import { streamText, convertToModelMessages } from "ai";
import { deepseek, DEEPSEEK_MODEL } from "@/lib/deepseek";
import { searchKnowledge, formatContext } from "@/lib/rag";
import { checkDailyLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const systemPrompt = readFileSync(
  join(process.cwd(), "prompts", "system.txt"),
  "utf-8"
);

export async function POST(req: Request) {
  const identifier = getRateLimitIdentifier(req);
  const limit = checkDailyLimit(identifier);

  if (!limit.allowed) {
    return Response.json(
      { error: "Daily limit reached. Come back tomorrow." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-RateLimit-Limit": String(limit.limit),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const uiMessages = body.messages;

    if (!uiMessages || !Array.isArray(uiMessages)) {
      return Response.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    // Convert UI messages (parts-based) to model messages (content-based)
    const modelMessages = await convertToModelMessages(
      uiMessages.map(({ id, ...rest }: any) => rest)
    );

    // RAG: Extract last user message and search knowledge base
    const lastUserMessage = [...uiMessages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");

    let systemWithContext = systemPrompt;

    if (lastUserMessage) {
      const query = lastUserMessage.parts
        ?.filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join(" ") ?? "";

      if (query) {
        try {
          const results = await searchKnowledge(query, 5, 0.2);
          if (results.length > 0) {
            const context = formatContext(results);
            systemWithContext = `${systemPrompt}\n\n## Knowledge Context\n\nRelevant information from HIRO's knowledge base:\n\n${context}\n\nUse this when relevant to the member's question. Stay natural and conversational.`;
          }
        } catch {
          // RAG failure is non-fatal
        }
      }
    }

    const result = streamText({
      model: deepseek.chat(DEEPSEEK_MODEL),
      system: systemWithContext,
      messages: modelMessages,
      temperature: 0.7,
      maxOutputTokens: 500,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: uiMessages,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
