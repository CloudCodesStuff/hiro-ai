"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import {
  Leaf,
  Dumbbell,
  Apple,
  Droplets,
  Scissors,
  Heart,
} from "lucide-react";

const EXAMPLE_PROMPTS = [
  {
    icon: Dumbbell,
    text: "I have 30 minutes, 3 days a week. What workout plan should I follow?",
    label: "Fitness",
  },
  {
    icon: Apple,
    text: "What should I eat to support muscle growth while losing fat?",
    label: "Nutrition",
  },
  {
    icon: Droplets,
    text: "I'm 35 and just starting skincare. Where do I begin?",
    label: "Skincare",
  },
  {
    icon: Scissors,
    text: "I've noticed my hair thinning. What actually works?",
    label: "Haircare",
  },
];

export function ChatInterface() {
  const { messages, status, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  // Message limit state
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch remaining count on mount
  useEffect(() => {
    fetch("/api/limit")
      .then((r) => r.json())
      .then((d) => {
        setRemaining(d.remaining);
        setLimitReached(d.limitReached);
      })
      .catch(() => {});
  }, [messages]);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage({ text });
      // Optimistically decrement remaining
      setRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    },
    [sendMessage]
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            HIRO
          </span>
        </div>

        {/* Message limit indicator */}
        <div className="flex items-center gap-2">
          {remaining !== null && (
            <span
              className={`text-[11px] tabular-nums ${
                remaining <= 3
                  ? "text-destructive"
                  : remaining <= 5
                    ? "text-amber-600"
                    : "text-muted-foreground"
              }`}
            >
              {remaining} / 20 remaining today
            </span>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {limitReached ? (
          <LimitReachedScreen />
        ) : messages.length === 0 ? (
          <WelcomeScreen onSelect={handleSend} isLoading={isLoading} />
        ) : (
          <div className="pb-2">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {error && (
              <div className="mx-4 my-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Something went wrong. Please try again.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed input */}
      <ChatInput onSend={handleSend} isLoading={isLoading || limitReached} />
    </div>
  );
}

function LimitReachedScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <Leaf className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        You&apos;ve reached today&apos;s limit
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Come back tomorrow for more conversations, or upgrade your HIRO
        membership for unlimited access.
      </p>
    </div>
  );
}

function WelcomeScreen({
  onSelect,
  isLoading,
}: {
  onSelect: (text: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-12">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Leaf className="h-6 w-6 text-primary" />
      </div>
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground">
        HIRO AI
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Your personal transformation coach
      </p>

      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt.text)}
            disabled={isLoading}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.02] disabled:opacity-50"
          >
            <prompt.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {prompt.label}
              </div>
              <div className="mt-0.5 text-[13px] leading-relaxed text-foreground/70">
                {prompt.text}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-10 flex items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          <span>Evidence-based</span>
        </div>
        <span>·</span>
        <span>For adults 30+</span>
        <span>·</span>
        <span>Sustainable advice</span>
      </div>
    </div>
  );
}
