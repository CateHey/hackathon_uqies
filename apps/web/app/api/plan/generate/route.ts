import { after } from "next/server";
import { computeMetrics, templatePlan } from "@free-me/core";
import { ApiError, handle, json } from "@/lib/api";
import { planMode } from "@/lib/ai";
import { loadSession, saveSession } from "@/lib/session";
import { upgradeInBackground } from "@/lib/upgrade";

/** The response is instant; the background personalisation may run for a few minutes. */
export const maxDuration = 300;

/**
 * Instant map, personalised upgrade in the background.
 * Every mode returns a rules-engine plan immediately. In AI mode the model then
 * builds the personalised plan after the response; the client polls /plan/status
 * and swaps it in when it is ready.
 */
export const POST = handle(async (req) => {
  const session = await loadSession();
  if (!session.profile) throw new ApiError(400, "no_profile", "Save a profile before generating a plan.");

  // Optional body: { force: "template" } skips the model entirely.
  const body = (await req.json().catch(() => ({}))) as { force?: unknown };
  const mode = body?.force === "template" ? "template" : planMode();
  const now = new Date();

  const metrics = computeMetrics(session.profile, { now });
  const plan = templatePlan(session.profile, metrics, { now });
  const pending = mode === "ai";

  session.plan = plan;
  session.metrics = metrics;
  session.planMode = mode;
  session.events = [];
  session.upgrade = null;
  session.upgradeError = null;
  session.pendingUpgrade = pending ? { startedAt: now.toISOString() } : null;
  await saveSession(session);

  if (pending) {
    const { id, profile } = session;
    after(() => upgradeInBackground(id, profile));
  }

  return json({ profile: session.profile, plan, metrics, source: "template", attempts: 0, mode, pending });
});
