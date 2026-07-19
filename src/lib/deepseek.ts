import { createOpenAI } from "@ai-sdk/openai";

// DeepSeek is OpenAI-compatible — configure via baseURL
export const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
