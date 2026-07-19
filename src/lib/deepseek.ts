import { createOpenAI } from "@ai-sdk/openai";

// DeepSeek uses OpenAI-compatible Chat Completions API.
// deepseek.chat("model") → /v1/chat/completions (what DeepSeek supports)
// deepseek("model")     → /v1/responses (DeepSeek doesn't support this)
export const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
