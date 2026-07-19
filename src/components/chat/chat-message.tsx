"use client";

import { Leaf, User } from "lucide-react";
import type { UIMessage } from "ai";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 px-4 py-4 ${isUser ? "bg-transparent" : "bg-muted/30"}`}>
      <div className="flex shrink-0 items-start pt-0.5">
        {isUser ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">
          {isUser ? "You" : "HIRO"}
        </div>
        <div className="prose prose-sm max-w-none">
          {message.parts.map((part, index) => {
            switch (part.type) {
              case "text":
                return <MessageText key={index} text={part.text} />;
              case "reasoning":
                return (
                  <details key={index} className="mb-1">
                    <summary className="cursor-pointer text-[11px] text-muted-foreground">
                      thinking
                    </summary>
                    <div className="mt-1 rounded-lg border border-border bg-muted/50 p-2 text-xs text-muted-foreground">
                      {part.text}
                    </div>
                  </details>
                );
              case "step-start":
                return null;
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
  const lines = text.split("\n");

  return (
    <div className="space-y-0.5 text-[15px] leading-relaxed text-foreground">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        const boldParsed = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-semibold text-foreground">$1</strong>'
        );

        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <div
              key={i}
              className="flex gap-2"
              dangerouslySetInnerHTML={{
                __html: `<span class="text-muted-foreground select-none">•</span> ${boldParsed.replace(/^[-*]\s+/, "")}`,
              }}
            />
          );
        }

        const numberMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numberMatch) {
          return (
            <div
              key={i}
              className="flex gap-2"
              dangerouslySetInnerHTML={{
                __html: `<span class="text-muted-foreground tabular-nums select-none">${numberMatch[1]}.</span> ${numberMatch[2]}`,
              }}
            />
          );
        }

        return <p key={i} dangerouslySetInnerHTML={{ __html: boldParsed }} />;
      })}
    </div>
  );
}
