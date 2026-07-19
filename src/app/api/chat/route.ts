import { streamText } from "ai";
import { deepseek, DEEPSEEK_MODEL } from "@/lib/deepseek";
import { searchKnowledge, formatContext } from "@/lib/rag";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load system prompt at module init (cached across invocations)
const systemPrompt = readFileSync(
  join(process.cwd(), "prompts", "system.txt"),
  "utf-8"
);

export async function POST(req: Request) {
  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const { allowed } = checkRateLimit(identifier, {
    maxRequests: 20,
    windowMs: 60_000,
  });

  if (!allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    // RAG: Extract last user message and search knowledge base
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");

    let systemWithContext = systemPrompt;

    if (lastUserMessage) {
      // Handle both legacy `content` and new `parts` message formats
      const query =
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : lastUserMessage.parts
              ?.filter((p: { type: string }) => p.type === "text")
              .map((p: { text: string }) => p.text)
              .join(" ") ?? "";

      if (query) {
        try {
          const results = await searchKnowledge(query, 5, 0.3);
          if (results.length > 0) {
            const context = formatContext(results);
            systemWithContext = `${systemPrompt}\n\n## Relevant Knowledge\n\nThe following information from HIRO's knowledge base may help answer the member's question:\n\n${context}\n\nUse this information when relevant. If the member's question is not addressed by this content, rely on your general knowledge while staying true to HIRO's principles.`;
          }
        } catch (ragError) {
          // RAG failure is non-fatal — fall back to base system prompt
          console.error("RAG retrieval failed:", ragError);
        }
      }
    }

    const result = streamText({
      model: deepseek(DEEPSEEK_MODEL),
      system: systemWithContext,
      messages,
      temperature: 0.7,
      maxOutputTokens: 1000,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "An error occurred processing your request." },
      { status: 500 }
    );
  }
}
