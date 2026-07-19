import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transformers.js uses WASM and native modules — don't bundle it
  serverExternalPackages: ["@xenova/transformers"],
  // Increase serverless function max duration for first cold start (model download)
  // Vercel Pro allows up to 60s on hobby, 300s on pro
};

export default nextConfig;
