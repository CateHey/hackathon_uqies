import {
  computeMetrics,
  PlanOutput,
  recomputePlanState,
  templatePlan,
  toIsoDate,
  type FreedomPlan,
  type FreedomProfile,
  type Metrics,
} from "@free-me/core";
import type { LessonSummary } from "@free-me/content";
import { addUsage, zeroUsage, type AiClient, type Usage } from "./client";
import { getCatalogue, planSystemBlocks } from "./catalogue";
import { postValidate } from "./validate";

export interface GenerateOptions {
  client: AiClient;
  now?: Date;
  /** Defaults to the real lesson catalogue. Tests pass a small one. */
  catalogue?: LessonSummary[];
  /** Model attempts before falling back to the template plan. Default 2. */
  maxAttempts?: number;
}

export interface GenerateResult {
  plan: FreedomPlan;
  metrics: Metrics;
  source: "ai" | "template";
  attempts: number;
  usage: Usage;
  /** Validation problems from the last failed attempt, when the template was used. */
  problems?: string[];
  stopReason?: string | null;
}

/**
 * Profile → metrics (rules engine) → Claude (structured output) → validation → plan.
 * Retries once with the validation problems appended; falls back to the template plan
 * so the user never sees an empty map.
 */
export async function generatePlan(profile: FreedomProfile, opts: GenerateOptions): Promise<GenerateResult> {
  const now = opts.now ?? new Date();
  const metrics = computeMetrics(profile, { now });
  const catalogue = opts.catalogue ?? getCatalogue();
  const catalogueIds = catalogue.map((c) => c.id);
  const system = planSystemBlocks(catalogue);
  const maxAttempts = opts.maxAttempts ?? 2;
  const usage = zeroUsage();

  const base = { profile, metrics, today: toIsoDate(now) };
  let user = JSON.stringify(base);
  let problems: string[] = [];
  let stopReason: string | null = null;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attemptsMade = attempt;
    const result = await opts.client.structured({
      system,
      user,
      schema: PlanOutput,
      effort: "high",
      maxTokens: 16000,
    });
    addUsage(usage, result.usage);
    stopReason = result.stopReason;

    if (result.stopReason === "refusal") {
      problems = ["model refused to generate a plan"];
      break;
    }
    if (!result.output) {
      problems = [`model returned no parseable plan (stop_reason=${result.stopReason})`];
      user = JSON.stringify({ ...base, previousAttemptProblems: problems, instruction: RETRY_INSTRUCTION });
      continue;
    }

    problems = postValidate(result.output, metrics, catalogueIds);
    if (problems.length === 0) {
      const plan: FreedomPlan = {
        ...result.output,
        version: 1,
        source: "ai",
        generatedAt: now.toISOString(),
      };
      // Derive every status from the steps so the map is consistent even if the model slipped.
      return { plan: recomputePlanState(plan).plan, metrics, source: "ai", attempts: attempt, usage, stopReason };
    }
    user = JSON.stringify({ ...base, previousAttemptProblems: problems, instruction: RETRY_INSTRUCTION });
  }

  return {
    plan: templatePlan(profile, metrics, { now }),
    metrics,
    source: "template",
    attempts: attemptsMade,
    usage,
    problems,
    stopReason,
  };
}

const RETRY_INSTRUCTION =
  "Your previous plan failed validation. Fix every problem listed in previousAttemptProblems and return the complete corrected plan.";
