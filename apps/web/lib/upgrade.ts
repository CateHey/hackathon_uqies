import type { FreedomProfile } from "@free-me/core";
import { estimateCostUsd, generatePlan, type AiClient, type Effort } from "@free-me/ai";
import { getAiClient } from "./ai";
import { getRepository } from "./repository";

const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];

/** Reasoning effort for live users. Goldens use "high"; a person waiting gets "medium" unless PLAN_EFFORT says otherwise. */
export function planEffort(): Effort {
  const v = process.env.PLAN_EFFORT as Effort | undefined;
  return v && EFFORTS.includes(v) ? v : "medium";
}

/**
 * Build the personalised plan after the response has gone out. The user is already
 * looking at the instant rules-engine map; this stores the model's plan as an
 * `upgrade` on the session, and the client decides when to swap it in.
 */
export async function upgradeInBackground(
  sessionId: string,
  profile: FreedomProfile,
  deps: { client?: () => AiClient } = {},
): Promise<void> {
  const repo = getRepository();
  const started = Date.now();
  try {
    const result = await generatePlan(profile, { client: (deps.client ?? getAiClient)(), effort: planEffort() });
    console.info(
      JSON.stringify({
        event: "plan_upgraded",
        source: result.source,
        attempts: result.attempts,
        ms: Date.now() - started,
        effort: planEffort(),
        usage: result.usage,
        costUsd: Number(estimateCostUsd(result.usage).toFixed(4)),
        problems: result.problems ?? null,
      }),
    );
    const session = await repo.get(sessionId);
    if (!session) return;
    if (result.source !== "ai") {
      session.pendingUpgrade = null;
      session.upgradeError = result.problems?.join("; ") ?? "The model did not return a usable plan.";
      await repo.upsert(session);
      return;
    }
    session.upgrade = {
      plan: result.plan,
      metrics: result.metrics,
      source: "ai",
      attempts: result.attempts,
      startedAt: session.pendingUpgrade?.startedAt ?? new Date(started).toISOString(),
      finishedAt: new Date().toISOString(),
    };
    session.pendingUpgrade = null;
    session.upgradeError = null;
    await repo.upsert(session);
  } catch (e) {
    console.error("[upgrade] failed", e);
    const session = await repo.get(sessionId);
    if (!session) return;
    session.pendingUpgrade = null;
    session.upgradeError = e instanceof Error ? e.message : String(e);
    await repo.upsert(session);
  }
}
