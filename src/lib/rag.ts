/**
 * Runtime RAG retrieval — serverless-compatible.
 *
 * Uses Transformers.js with onnxruntime-web (WASM) backend,
 * which works on Vercel serverless without native dependencies.
 *
 * On first call, loads the pre-computed index and initializes
 * the embedding pipeline. Subsequent calls reuse the cached
 * pipeline and index (per serverless instance warm invocation).
 */

import indexData from "../../data/index.json";

let embedder: any = null;
let chunks: Chunk[] | null = null;

interface Chunk {
  title: string;
  source: string;
  content: string;
  embedding: number[];
}

interface SearchResult {
  title: string;
  source: string;
  content: string;
  score: number;
}

async function getEmbedder(): Promise<any> {
  if (!embedder) {
    // Force WASM backend for serverless compatibility
    const { env, pipeline } = await import("@xenova/transformers");
    env.backends.onnx.preferredBackend = "wasm";
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { quantized: true }
    );
  }
  return embedder;
}

function getChunks(): Chunk[] {
  if (!chunks) {
    chunks = (indexData as { chunks: Chunk[] }).chunks;
  }
  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search the knowledge base for chunks relevant to the query.
 * Returns top-k results sorted by relevance score.
 */
export async function searchKnowledge(
  query: string,
  topK: number = 5,
  minScore: number = 0.3
): Promise<SearchResult[]> {
  const pipeline = await getEmbedder();
  const allChunks = getChunks();

  // Generate query embedding
  const output = await pipeline(query, {
    pooling: "mean",
    normalize: true,
  });
  const queryEmbedding = Array.from(output.data) as number[];

  // Compute similarity against all chunks
  const scored = allChunks
    .map((chunk) => ({
      title: chunk.title,
      source: chunk.source,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

/**
 * Format retrieved chunks into a context string for the LLM prompt.
 */
export function formatContext(results: SearchResult[]): string {
  if (results.length === 0) return "";

  return results
    .map((r) => `[Source: ${r.title}]\n${r.content}`)
    .join("\n\n---\n\n");
}
