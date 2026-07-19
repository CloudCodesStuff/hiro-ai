/**
 * RAG indexing script.
 * Run: node scripts/index.mjs
 *
 * Reads knowledge documents, splits them into chunks,
 * generates embeddings using Transformers.js, and saves
 * the index to data/index.json for runtime retrieval.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const KNOWLEDGE_DIR = join(ROOT, "knowledge");
const DATA_DIR = join(ROOT, "data");
const OUTPUT_FILE = join(DATA_DIR, "index.json");

// --- Chunking ---

function splitMarkdownByHeadings(content, filename) {
  const chunks = [];
  const lines = content.split("\n");
  let currentTitle = filename.replace(".md", "");
  let currentContent = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Track code blocks to avoid splitting inside them
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      currentContent.push(line);
      continue;
    }

    // Split on H2 or H3 headings (outside code blocks)
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);

    if (!inCodeBlock && (h2Match || h3Match)) {
      // Save previous chunk
      if (currentContent.length > 0) {
        const text = currentContent.join("\n").trim();
        if (text.length > 50) {
          chunks.push({
            title: currentTitle,
            source: filename,
            content: text,
          });
        }
      }
      const heading = h2Match ? h2Match[1] : h3Match[1];
      currentTitle = `${filename.replace(".md", "")} — ${heading}`;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save final chunk
  if (currentContent.length > 0) {
    const text = currentContent.join("\n").trim();
    if (text.length > 50) {
      chunks.push({
        title: currentTitle,
        source: filename,
        content: text,
      });
    }
  }

  return chunks;
}

// --- Main ---

async function main() {
  console.log("🔍 Reading knowledge documents...");

  const files = readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
  console.log(`   Found ${files.length} documents: ${files.join(", ")}`);

  let allChunks = [];
  for (const file of files) {
    const content = readFileSync(join(KNOWLEDGE_DIR, file), "utf-8");
    const chunks = splitMarkdownByHeadings(content, file);
    allChunks = allChunks.concat(chunks);
  }

  console.log(`   Created ${allChunks.length} chunks`);

  // Generate embeddings
  console.log("🧠 Loading embedding model (Xenova/all-MiniLM-L6-v2)...");
  const { pipeline } = await import("@xenova/transformers");

  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    quantized: true, // Use quantized model for faster loading
  });

  console.log("   Generating embeddings...");
  const batchSize = 8;
  const embeddings = [];

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content.slice(0, 1000)); // Truncate long chunks

    for (const text of texts) {
      const output = await embedder(text, {
        pooling: "mean",
        normalize: true,
      });
      // Convert tensor to plain array
      const vec = Array.from(output.data);
      embeddings.push(vec);
    }

    const progress = Math.min(i + batchSize, allChunks.length);
    console.log(`   ${progress}/${allChunks.length} chunks embedded`);
  }

  // Build index
  const index = {
    model: "Xenova/all-MiniLM-L6-v2",
    dimensions: 384,
    createdAt: new Date().toISOString(),
    chunks: allChunks.map((chunk, i) => ({
      title: chunk.title,
      source: chunk.source,
      content: chunk.content,
      embedding: embeddings[i],
    })),
  };

  // Ensure data directory exists
  const { mkdirSync } = await import("node:fs");
  mkdirSync(DATA_DIR, { recursive: true });

  writeFileSync(OUTPUT_FILE, JSON.stringify(index));
  const stats = statSync(OUTPUT_FILE);
  console.log(`✅ Index saved to ${OUTPUT_FILE}`);
  console.log(`   ${allChunks.length} chunks, ${(stats.size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("❌ Indexing failed:", err);
  process.exit(1);
});
