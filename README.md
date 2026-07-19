# HIRO AI

Personal transformation AI assistant for [HIRO](https://hiroprotocol.com) — a premium glow-up and self-improvement community for busy adults 30+.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui
- **AI:** Vercel AI SDK v7, DeepSeek API (OpenAI-compatible)
- **RAG:** Transformers.js (Xenova/all-MiniLM-L6-v2), pre-computed vector index
- **Deployment:** Vercel (serverless)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example and add your DeepSeek API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
DEEPSEEK_API_KEY=sk-your-actual-key
```

Get a key at [platform.deepseek.com](https://platform.deepseek.com/api-keys).

### 3. Index the knowledge base

```bash
npm run index
```

This reads all documents in `/knowledge`, splits them into chunks, generates embeddings, and saves the index to `data/index.json`. The index is ~100KB and is committed to the repository.

> **Note:** The first run downloads the embedding model (~80MB) and takes 30-60 seconds. Subsequent runs use the cached model.

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
User Message → /api/chat
  ├─ Rate limit check (in-memory, IP-based)
  ├─ Extract last user message
  ├─ RAG: Generate query embedding → cosine similarity → top-k chunks
  ├─ Inject relevant context into system prompt
  └─ Stream response via DeepSeek
```

### Knowledge Base

Documents in `/knowledge/`:

| File | Topic |
|------|-------|
| `fitness.md` | Workout programs, exercises, recovery |
| `nutrition.md` | Meal structure, supplements, eating out |
| `skincare.md` | Routines, ingredients, anti-aging |
| `haircare.md` | Hair health, thinning, daily care |
| `lifestyle.md` | Sleep, stress, grooming, confidence |
| `faq.md` | Common questions about HIRO |
| `products.md` | Product catalog (H01, H02, H03) |
| `programs.md` | Transformation program catalog |
| `community.md` | Community values and guidelines |

### RAG Details

- **Embedding model:** `Xenova/all-MiniLM-L6-v2` (384 dimensions, quantized)
- **Chunking:** Split by H2/H3 headings
- **Similarity:** Cosine similarity, minimum score threshold 0.3
- **Retrieval:** Top 5 most relevant chunks injected into system prompt
- **Fallback:** If RAG fails, chat continues with base system prompt (no crash)

## Deployment

### Vercel + GitHub

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variable: `DEEPSEEK_API_KEY`
4. Set domain: `ai.hiroprotocol.com`
5. Deploy

**Before deploying**, make sure to run `npm run index` and commit `data/index.json` — this file is required at build time.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEEPSEEK_API_KEY` | Yes | — | DeepSeek API key |
| `DEEPSEEK_MODEL` | No | `deepseek-chat` | Model to use (e.g., `deepseek-chat`) |

### Cost Estimate

- **DeepSeek API:** ~$0.14 per 1M input tokens, ~$0.28 per 1M output tokens
- **Embeddings:** Free (local Transformers.js)
- **Hosting:** Free (Vercel Hobby tier)
- **Total:** <$5/month for moderate usage

### Vercel Considerations

- **Cold starts:** First request after deploy/idle may take 5-10s (Transformers.js model loading). Subsequent requests are fast.
- **Function timeout:** Hobby tier max 10s. Upgrade to Pro for 60s if needed.
- **Function size:** The embedding model (~80MB) is downloaded at runtime. Vercel caches it across warm invocations.

## Local Development

```bash
npm run dev       # Start dev server
npm run index     # Rebuild knowledge index (after editing /knowledge docs)
npm run build     # Production build
npm run lint      # Lint check
```

## Project Structure

```
hiro-ai/
├── knowledge/          # RAG knowledge documents (markdown)
├── prompts/            # System prompt
├── scripts/            # Build scripts (indexing)
├── data/               # Generated index (commit this)
├── src/
│   ├── app/
│   │   ├── api/chat/   # Chat API route
│   │   ├── layout.tsx  # Root layout
│   │   ├── page.tsx    # Home page
│   │   └── globals.css # HIRO brand theme
│   ├── components/
│   │   ├── chat/       # Chat UI components
│   │   └── ui/         # shadcn/ui components
│   └── lib/
│       ├── deepseek.ts # DeepSeek provider config
│       ├── rag.ts      # RAG retrieval
│       └── rate-limit.ts # Rate limiter
├── .env.example        # Environment template
└── next.config.ts      # Next.js config
```
