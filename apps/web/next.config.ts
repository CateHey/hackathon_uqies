import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@free-me/core",
    "@free-me/ai",
    "@free-me/api-client",
    "@free-me/content",
    "@free-me/tokens",
  ],
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
