import { WhyResponse, type FreedomPlan, type FreedomProfile, type Metrics, type WhyRequest } from "@free-me/core";
import type { AiClient, Usage } from "./client";
import { EXPLAIN_SYSTEM_PROMPT } from "./prompts";
import { containsBannedTerms } from "./validate";

export interface ExplainInput extends WhyRequest {
  plan: FreedomPlan;
  metrics: Metrics;
  profile: FreedomProfile;
}

export interface ExplainResult {
  explanation: string;
  /** "ai" when the model answered; "plan" when we fell back to the item's own `why`. */
  source: "ai" | "plan";
  usage: Usage | null;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function findPlanItem(plan: FreedomPlan, itemType: WhyRequest["itemType"], itemId: string) {
  switch (itemType) {
    case "region":
      return plan.regions.find((r) => r.id === itemId);
    case "bridge":
      return plan.bridges.find((b) => b.id === itemId);
    case "step":
      return plan.steps.find((s) => s.id === itemId);
  }
}

/**
 * The "Why?" feature. The plan already carries a `why` on every item — this asks
 * for a deeper, figure-citing explanation and falls back to the existing one.
 */
export async function explain(input: ExplainInput, opts: { client: AiClient }): Promise<ExplainResult> {
  const item = findPlanItem(input.plan, input.itemType, input.itemId);
  if (!item) throw new NotFoundError(`${input.itemType} ${input.itemId} not found`);

  const user = JSON.stringify({
    item: { itemType: input.itemType, ...item },
    freedomStatement: input.profile.freedomStatement,
    knowledge: input.profile.knowledge,
    risk: input.profile.risk,
    goals: input.profile.goals,
    profileSummary: input.plan.profileSummary,
    currentPriorityRegionId: input.plan.currentPriorityRegionId,
    metrics: input.metrics,
  });

  const result = await opts.client.structured({
    system: [{ type: "text", text: EXPLAIN_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    user,
    schema: WhyResponse,
    effort: "low",
    maxTokens: 1024,
  });

  const text = result.output?.explanation.trim();
  if (!text || containsBannedTerms(text)) {
    return { explanation: item.why, source: "plan", usage: result.usage };
  }
  return { explanation: text, source: "ai", usage: result.usage };
}
