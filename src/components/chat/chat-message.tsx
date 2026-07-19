"use client";

import { Sparkles, User } from "lucide-react";
import type { UIMessage } from "ai";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 px-4 py-6 ${isUser ? "" : "bg-[#0d0d0d]"}`}>
      <div className="flex shrink-0 items-start pt-0.5">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700">
            <User className="h-4 w-4 text-neutral-300" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 text-xs font-medium text-neutral-500">
          {isUser ? "You" : "HIRO AI"}
        </div>
        <div className="prose prose-invert prose-sm max-w-none">
          {message.parts.map((part, index) => {
            switch (part.type) {
              case "text":
                return <MessageText key={index} text={part.text} />;
              case "reasoning":
                return (
                  <details key={index} className="mb-2">
                    <summary className="cursor-pointer text-xs text-neutral-500">
                      Reasoning
                    </summary>
                    <div className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-neutral-400">
                      {part.text}
                    </div>
                  </details>
                );
              case "source-url":
                return null; // Skip source URLs for now
              case "step-start":
                return (
                  <div
                    key={index}
                    className="mb-2 text-xs text-neutral-600 italic"
                  >
                    Thinking...
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}

function MessageText({ text }: { text: string }) {
  // Simple markdown-like rendering for line breaks
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-neutral-200">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        // Bold text
        const boldParsed = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-semibold text-white">$1</strong>'
        );

        // Bullet points
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <div
              key={i}
              className="flex gap-2"
              dangerouslySetInnerHTML={{
                __html: `<span class="text-neutral-500">•</span> ${boldParsed.replace(/^[-*]\s+/, "")}`,
              }}
            />
          );
        }

        // Numbered lists
        const numberMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numberMatch) {
          return (
            <div
              key={i}
              className="flex gap-2"
              dangerouslySetInnerHTML={{
                __html: `<span class="text-neutral-500">${numberMatch[1]}.</span> ${numberMatch[2]}`,
              }}
            />
          );
        }

        return (
          <p
            key={i}
            dangerouslySetInnerHTML={{ __html: boldParsed }}
          />
        );
      })}
    </div>
  );
}
