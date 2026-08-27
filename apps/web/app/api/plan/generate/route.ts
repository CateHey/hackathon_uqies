import { computeMetrics, templatePlan, type FreedomPlan, type Metrics, type PlanSource } from "@free-me/core";
import { estimateCostUsd, generatePlan } from "@free-me/ai";
import { ApiError, handle, json } from "@/lib/api";
import { getAiClient, planMode } from "@/lib/ai";
import { loadSession, saveSession } from "@/lib/session";

/** Plan generation can take 10–30 s with the real model. */
export const maxDuration = 60;

export const POST = handle(async (req) => {
  const session = await loadSession();
  if (!session.profile) throw new ApiError(400, "no_profile", "Save a profile before generating a plan.");

  // Optional body: { force: "template" } lets a client skip the model (e.g. after a slow-generation timeout).
  const body = (await req.json().catch(() => ({}))) as { force?: unknown };
  const mode = body?.force === "template" ? "template" : planMode();
  const now = new Date();
  let plan: FreedomPlan;
  let metrics: Metrics;
  let source: PlanSource;
  let attempts = 0;

  if (mode === "ai") {
    const result = await generatePlan(session.profile, { client: getAiClient(), now });
    plan = result.plan;
    metrics = result.metrics;
    source = result.source;
    attempts = result.attempts;
    console.info(
      JSON.stringify({
        event: "plan_generated",
        source,
        attempts,
        usage: result.usage,
        costUsd: Number(estimateCostUsd(result.usage).toFixed(4)),
        problems: result.problems ?? null,
        stopReason: result.stopReason ?? null,
      }),
    );
  } else {
    metrics = computeMetrics(session.profile, { now });
    plan = templatePlan(session.profile, metrics, { now });
    source = "template";
  }

  session.plan = plan;
  session.metrics = metrics;
  session.planMode = mode;
  session.events = [];
  await saveSession(session);

  return json({ profile: session.profile, plan, metrics, source, attempts, mode });
});
