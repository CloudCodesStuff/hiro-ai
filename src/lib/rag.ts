/**
 * Runtime RAG retrieval — Vercel serverless compatible.
 *
 * Uses keyword-based retrieval on the pre-computed knowledge index.
 * No embeddings at runtime — no ONNX, no native dependencies, no Transformers.js.
 *
 * The index is built at build time via `npm run index` and committed to the repo.
 * At runtime, we search chunk text directly using keyword matching.
 */

import indexData from "../../data/index.json";

let chunks: Chunk[] | null = null;

interface Chunk {
  title: string;
  source: string;
  content: string;
  embedding: number[];
}

export interface SearchResult {
  title: string;
  source: string;
  content: string;
  score: number;
}

function getChunks(): Chunk[] {
  if (!chunks) {
    chunks = (indexData as { chunks: Chunk[] }).chunks;
  }
  return chunks;
}

/**
 * Simple keyword-based retrieval.
 * Scores chunks by term overlap with the query.
 */
function keywordRetrieve(
  query: string,
  allChunks: Chunk[],
  topK: number,
  minScore: number
): SearchResult[] {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 1);

  if (queryTerms.length === 0) return [];

  const scored = allChunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    // Count individual term matches
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        score += 1;
      }
    }

    // Bonus for the full phrase appearing
    if (contentLower.includes(queryLower)) {
      score += 3;
    }

    // Bonus for title match
    if (chunk.title.toLowerCase().includes(queryLower)) {
      score += 2;
    }

    // Normalize by content length (favor concise, relevant chunks)
    const normalizedScore = score / Math.log(contentLower.length + 1);

    return {
      title: chunk.title,
      source: chunk.source,
      content: chunk.content,
      score: normalizedScore,
    };
  });

  return scored
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Search the knowledge base for chunks relevant to the query.
 * Returns top-k results sorted by relevance score.
 */
export async function searchKnowledge(
  query: string,
  topK: number = 5,
  minScore: number = 0.1
): Promise<SearchResult[]> {
  const allChunks = getChunks();
  return keywordRetrieve(query, allChunks, topK, minScore);
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
