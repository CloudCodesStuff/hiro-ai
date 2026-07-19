"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/[0.08] bg-[#0d0d0d] p-4"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask HIRO about fitness, nutrition, skincare, or anything transformation..."
            rows={1}
            disabled={isLoading}
            className="min-h-[48px] resize-none rounded-xl border-white/[0.08] bg-white/[0.04] pr-12 text-sm text-white placeholder:text-neutral-500 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl bg-amber-500 text-neutral-900 transition-all hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-neutral-600">
        HIRO AI provides wellness guidance, not medical advice.
      </p>
    </form>
  );
}
