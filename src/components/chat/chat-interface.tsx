"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import {
  Sparkles,
  Dumbbell,
  Apple,
  Droplets,
  Scissors,
  Heart,
  Shield,
  Zap,
  Leaf,
} from "lucide-react";
import Image from "next/image";

const EXAMPLE_PROMPTS = [
  {
    icon: Dumbbell,
    text: "I have 30 minutes, 3 days a week. What workout should I do?",
    label: "Fitness",
  },
  {
    icon: Apple,
    text: "What should I eat to build muscle and lose fat?",
    label: "Nutrition",
  },
  {
    icon: Droplets,
    text: "I'm 35 and just getting into skincare. Where do I start?",
    label: "Skincare",
  },
  {
    icon: Scissors,
    text: "My hair is starting to thin. What actually helps?",
    label: "Hair",
  },
];

export function ChatInterface() {
  const { messages, status, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  const [remaining, setRemaining] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    },
    [sendMessage]
  );

  return (
    <div className="flex h-full flex-col bg-black">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/hiro-logo.png"
            alt="HIRO"
            width={64}
            height={27}
            className="h-[22px] w-auto brightness-0 invert opacity-90"
            priority
          />
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/35">
            AI Coach
          </span>
        </div>
        <div className="flex items-center gap-4">
          {remaining !== null && (
            <span
              className={`text-[11px] tabular-nums font-medium ${
                remaining <= 3
                  ? "text-red-400"
                  : remaining <= 5
                    ? "text-amber-400"
                    : "text-white/35"
              }`}
            >
              {remaining}/{20} today
            </span>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {limitReached ? (
          <LimitReachedScreen />
        ) : messages.length === 0 ? (
          <WelcomeScreen onSelect={handleSend} isLoading={isLoading} />
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {error && (
              <div className="mx-auto max-w-2xl px-4 py-3">
                <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] px-4 py-3 text-sm text-red-400">
                  Something went wrong. Please try again.
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading || limitReached} />
    </div>
  );
}

function LimitReachedScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05]">
        <Shield className="h-6 w-6 text-primary/60" />
      </div>
      <h2 className="text-lg font-semibold text-white">
        That's all for today
      </h2>
      <p className="mt-2 max-w-xs text-sm text-white/50 leading-relaxed">
        You've used your 20 messages for today. Come back tomorrow, or upgrade
        your HIRO membership for unlimited access.
      </p>
      <a
        href="https://hiroprotocol.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-all hover:bg-primary/80"
      >
        Upgrade Membership
        <Zap className="h-3.5 w-3.5" />
      </a>
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
      {/* Logo */}
      <div className="mb-6 animate-fade-in">
        <Image
          src="/hiro-logo.png"
          alt="HIRO"
          width={100}
          height={42}
          className="h-[36px] w-auto brightness-0 invert opacity-90"
          priority
        />
      </div>

      {/* Tagline */}
      <p className="mb-2 text-lg font-medium text-white animate-fade-in">
        Your personal transformation coach
      </p>
      <p className="mb-10 max-w-sm text-center text-sm text-white/50 leading-relaxed animate-fade-in">
        Evidence-based advice on fitness, nutrition, skincare, and hair - built
        for busy adults who want real results.
      </p>

      {/* Prompt cards */}
      <div className="grid w-full max-w-xl gap-2.5 sm:grid-cols-2 animate-fade-in">
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt.text)}
            disabled={isLoading}
            className="group flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.04] disabled:opacity-40"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.05] group-hover:border-primary/20 transition-colors">
              <prompt.icon className="h-3.5 w-3.5 text-white/50 group-hover:text-primary/70 transition-colors" />
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-white/40 group-hover:text-primary/40 transition-colors">
                {prompt.label}
              </div>
              <div className="mt-1 text-[13px] leading-relaxed text-white/65 group-hover:text-white/80 transition-colors">
                {prompt.text}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Trust badges */}
      <div className="mt-12 flex items-center gap-5 text-[11px] text-white/35 animate-fade-in">
        <div className="flex items-center gap-1.5">
          <Heart className="h-3 w-3" />
          <span>Evidence-based</span>
        </div>
        <span className="text-white/25">·</span>
        <span>For adults 30+</span>
        <span className="text-white/25">·</span>
        <span>Sustainable advice</span>
      </div>
    </div>
  );
}
