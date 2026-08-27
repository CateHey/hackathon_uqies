import { createAnthropicClient, type AiClient } from "@free-me/ai";
import type { PlanMode } from "@free-me/core";

/**
 * How plans get made in this environment:
 *  - "ai"       ANTHROPIC_API_KEY present and DEMO_MODE not set → Claude generates the plan
 *  - "demo"     DEMO_MODE=true → instant template plans (no network, no cost) — for stage demos
 *  - "template" no API key → same instant template plans, for local development
 */
export function planMode(): PlanMode {
  if (process.env.DEMO_MODE === "true") return "demo";
  if (!process.env.ANTHROPIC_API_KEY) return "template";
  return "ai";
}

let client: AiClient | null = null;

/** Server-only singleton. Never import this from a client component. */
export function getAiClient(): AiClient {
  if (!client) client = createAnthropicClient();
  return client;
}
