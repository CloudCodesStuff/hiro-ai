"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import {
  MessageSquare,
  Sparkles,
  Dumbbell,
  Apple,
  Droplets,
  Scissors,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoading = status === "streaming" || status === "submitted";

  const handleSend = (text: string) => {
    sendMessage({ text });
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } shrink-0 overflow-hidden border-r border-white/[0.06] bg-[#0d0d0d] transition-all duration-200`}
      >
        <div className="w-64 p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
              <Sparkles className="h-4 w-4 text-neutral-900" />
            </div>
            <span className="font-semibold text-white">HIRO AI</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mb-4 w-full justify-start gap-2 border-white/[0.08] bg-white/[0.03] text-sm text-neutral-300 hover:bg-white/[0.06] hover:text-white"
            onClick={() => window.location.reload()}
          >
            <MessageSquare className="h-4 w-4" />
            New conversation
          </Button>

          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-600">
              Recent chats
            </p>
            <p className="mt-2 text-xs text-neutral-600">
              Conversations are not persisted between sessions.
            </p>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Sidebar toggle */}
        <div className="absolute left-0 top-0 z-10 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/[0.05] hover:text-neutral-300 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          {messages.length === 0 ? (
            <WelcomeScreen onSelect={handleSend} isLoading={isLoading} />
          ) : (
            <div className="pb-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-3 px-4 py-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                    <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
                  </div>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500/60 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500/60 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500/60 [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
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
    <div className="flex h-full flex-col items-center justify-center px-4 py-16">
      <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
        <Sparkles className="h-7 w-7 text-amber-500" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-white">HIRO AI</h1>
      <p className="mb-10 text-sm text-neutral-400">
        Your personal transformation coach
      </p>

      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt.text)}
            disabled={isLoading}
            className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-amber-500/30 hover:bg-white/[0.04] disabled:opacity-50"
          >
            <prompt.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/70" />
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                {prompt.label}
              </div>
              <div className="mt-1 text-[13px] leading-relaxed text-neutral-400">
                {prompt.text}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-12 flex items-center gap-6 text-[11px] text-neutral-600">
        <div className="flex items-center gap-1.5">
          <Heart className="h-3 w-3" />
          <span>Evidence-based advice</span>
        </div>
        <span>•</span>
        <span>For busy adults 30+</span>
        <span>•</span>
        <span>No extreme diets</span>
      </div>
    </div>
  );
}
