"use client";

import { User } from "lucide-react";
import type { UIMessage } from "ai";
import Image from "next/image";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
        {/* Avatar — only for assistant */}
        {!isUser && (
          <div className="flex shrink-0 items-start pt-0.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 border border-primary/20">
              <Image
                src="/hiro-logo.png"
                alt="HIRO"
                width={16}
                height={7}
                className="h-[12px] w-auto brightness-0 invert opacity-80"
              />
            </div>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`min-w-0 max-w-[85%] ${
            isUser
              ? "rounded-2xl rounded-br-md bg-white/[0.06] border border-white/[0.06] px-4 py-2.5"
              : "px-0.5"
          }`}
        >
          {!isUser && (
            <div className="mb-1 ml-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
              HIRO
            </div>
          )}
          <div className="text-[15px] leading-relaxed text-white/92">
            {message.parts.map((part, index) => {
              switch (part.type) {
                case "text":
                  return <MessageText key={index} text={part.text} />;
                case "reasoning":
                  return (
                    <details key={index} className="mb-1">
                      <summary className="cursor-pointer text-[11px] text-white/35">
                        thinking
                      </summary>
                      <div className="mt-1 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 text-xs text-white/50">
                        {part.text}
                      </div>
                    </details>
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>

        {/* Avatar — only for user */}
        {isUser && (
          <div className="flex shrink-0 items-start pt-0.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.06]">
              <User className="h-3 w-3 text-white/45" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        // Bold
        const boldParsed = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-semibold text-white">$1</strong>'
        );

        // Bullet
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <div
              key={i}
              className="flex gap-2"
              dangerouslySetInnerHTML={{
                __html: `<span class="text-white/35 select-none">-</span> <span>${boldParsed.replace(/^[-*]\s+/, "")}</span>`,
              }}
            />
          );
        }

        // Numbered
        const numMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
          return (
            <div
              key={i}
              className="flex gap-2"
              dangerouslySetInnerHTML={{
                __html: `<span class="text-white/40 tabular-nums select-none">${numMatch[1]}.</span> <span>${numMatch[2]}</span>`,
              }}
            />
          );
        }

        return <p key={i} dangerouslySetInnerHTML={{ __html: boldParsed }} />;
      })}
    </div>
  );
}
