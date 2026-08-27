import {
  AllocationOutput,
  formatMoney,
  type Allocation,
  type AllocationBucket,
  type FreedomPlan,
  type FreedomProfile,
  type Metrics,
} from "@free-me/core";
import { addUsage, zeroUsage, type AiClient, type Usage } from "./client";
import { ALLOCATE_SYSTEM_PROMPT } from "./prompts";
import { containsBannedTerms } from "./validate";

export interface AllocateInput {
  plan: FreedomPlan;
  metrics: Metrics;
  profile: FreedomProfile;
  amount: number;
}

export interface AllocateResult {
  allocation: Allocation;
  source: "ai" | "rules";
  attempts: number;
  usage: Usage;
}

export interface EligibleBucket {
  key: string;
  label: string;
  /** What this bucket still needs, when known. */
  remaining: number | null;
  /** Higher = more urgent. */
  priority: number;
  note: string;
}

export const FLEXIBLE_KEY = "flexible";

/**
 * Buckets the person can put money into right now: open regions with an unfinished saving
 * step, plus any region that carries one of their goals (a locked goal can still receive money —
 * the map's order is guidance, not a gate on their own savings).
 */
export function eligibleBuckets(plan: FreedomPlan, metrics: Metrics): EligibleBucket[] {
  const buckets: EligibleBucket[] = [];
  for (const region of plan.regions) {
    if (region.status === "complete" || region.type === "freedom_city") continue;
    if (region.status === "locked" && !region.goalId) continue;
    const saveSteps = plan.steps.filter(
      (s) => s.regionId === region.id && s.kind === "save" && s.status !== "done" && s.metric,
    );
    if (!saveSteps.length) continue;
    const remaining = saveSteps.reduce((sum, s) => sum + Math.max(0, (s.metric?.target ?? 0) - (s.metric?.current ?? 0)), 0);
    const projection = region.goalId ? metrics.goalProjections.find((g) => g.goalId === region.goalId) : undefined;
    const behind = projection?.onTrack === false;
    const priority =
      region.type === "security" ? 100 : region.id === plan.currentPriorityRegionId ? 90 : behind ? 80 : 50 + region.relevance;
    buckets.push({
      key: region.id,
      label: region.proTitle,
      remaining,
      priority,
      note: behind ? "behind schedule" : region.type === "security" ? "emergency buffer" : "on track",
    });
  }
  buckets.push({ key: FLEXIBLE_KEY, label: "Flexible savings", remaining: null, priority: 10, note: "keeps options open" });
  return buckets.sort((a, b) => b.priority - a.priority);
}

/** Deterministic allocation used when the model's answer doesn't add up. */
export function ruleAllocation(input: AllocateInput): Allocation {
  const buckets = eligibleBuckets(input.plan, input.metrics).filter((b) => b.key !== FLEXIBLE_KEY);
  const money = (n: number) => formatMoney(n, input.profile.currency);
  let left = input.amount;
  const out: AllocationBucket[] = [];

  const security = buckets.find((b) => b.key === "security");
  if (security && security.remaining && left > 0) {
    const amt = Math.min(left, Math.round(input.amount * 0.4), security.remaining);
    if (amt > 0) {
      out.push({ key: security.key, label: security.label, amount: amt, reason: `Your buffer still needs ${money(security.remaining)}; this closes part of the gap first.` });
      left -= amt;
    }
  }
  const goals = buckets.filter((b) => b.key !== "security" && b.remaining && b.remaining > 0).slice(0, 2);
  for (const g of goals) {
    if (left <= 0) break;
    const share = Math.min(left, Math.round(input.amount * (goals.length === 1 ? 0.4 : 0.25)), g.remaining ?? 0);
    if (share > 0) {
      out.push({ key: g.key, label: g.label, amount: share, reason: g.note === "behind schedule" ? `${g.label} is behind schedule; this helps you catch up.` : `${g.label} still needs ${money(g.remaining ?? 0)}.` });
      left -= share;
    }
  }
  if (left > 0 || out.length === 0) {
    out.push({ key: FLEXIBLE_KEY, label: "Flexible savings", amount: left, reason: "Kept available so a future priority doesn't have to wait." });
  }
  return { amount: input.amount, buckets: out, summary: "A simple split: buffer first, then the goals that need it most, with the rest kept flexible." };
}

export function allocationProblems(output: AllocationOutput, amount: number, eligible: EligibleBucket[]): string[] {
  const problems: string[] = [];
  const keys = new Set(eligible.map((b) => b.key));
  const sum = output.buckets.reduce((s, b) => s + b.amount, 0);
  if (sum !== amount) problems.push(`bucket amounts sum to ${sum}, expected ${amount}`);
  for (const b of output.buckets) {
    if (!Number.isInteger(b.amount) || b.amount < 0) problems.push(`bucket ${b.key}: amount must be a non-negative integer`);
    if (!keys.has(b.key)) problems.push(`bucket ${b.key}: not an eligible bucket`);
    if (containsBannedTerms(b.reason)) problems.push(`bucket ${b.key}: reason contains advice/product language`);
  }
  if (containsBannedTerms(output.summary)) problems.push("summary contains advice/product language");
  return problems;
}

/** "I have $X — what should I do with it?" Integer amounts that add up, each with a reason. */
export async function allocate(input: AllocateInput, opts: { client: AiClient; maxAttempts?: number }): Promise<AllocateResult> {
  const eligible = eligibleBuckets(input.plan, input.metrics);
  const maxAttempts = opts.maxAttempts ?? 2;
  const usage = zeroUsage();
  const base = {
    amount: input.amount,
    currency: input.profile.currency,
    eligibleBuckets: eligible,
    profileSummary: input.plan.profileSummary,
    freedomStatement: input.profile.freedomStatement,
    knowledge: input.profile.knowledge,
    metrics: input.metrics,
  };
  let user = JSON.stringify(base);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await opts.client.structured({
      system: [{ type: "text", text: ALLOCATE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      user,
      schema: AllocationOutput,
      effort: "medium",
      maxTokens: 2048,
    });
    addUsage(usage, result.usage);
    if (result.stopReason === "refusal") break;
    if (result.output) {
      const problems = allocationProblems(result.output, input.amount, eligible);
      if (!problems.length) {
        return { allocation: { ...result.output, amount: input.amount }, source: "ai", attempts: attempt, usage };
      }
      user = JSON.stringify({ ...base, previousAttemptProblems: problems, instruction: "Fix every listed problem. Amounts must be integers that sum exactly to the amount." });
    }
  }
  return { allocation: ruleAllocation(input), source: "rules", attempts: maxAttempts, usage };
}
