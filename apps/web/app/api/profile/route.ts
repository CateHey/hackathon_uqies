import { computeMetrics, FreedomProfile, ProfilePatch } from "@free-me/core";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/session";

/** Onboarding: a brand-new profile, so the old plan goes with it. */
export const POST = handle(async (req) => {
  const profile = await parseBody(req, FreedomProfile);
  const session = await loadSession();
  session.profile = profile;
  session.plan = null;
  session.metrics = null;
  session.planMode = null;
  session.events = [];
  session.planStale = false;
  await saveSession(session);
  return json({ ok: true, profile });
});

/**
 * Editing your numbers afterwards. The plan is deliberately kept: losing your map because you
 * corrected your rent would be its own kind of failure. Metrics are recomputed immediately —
 * so the dashboard is right at once — and the plan is flagged as out of date so the map can
 * offer to rebuild.
 */
export const PATCH = handle(async (req) => {
  const patch = await parseBody(req, ProfilePatch);
  const session = await loadSession();
  if (!session.profile) throw new ApiError(404, "no_profile", "No profile yet — complete onboarding first.");

  const profile = FreedomProfile.parse({ ...session.profile, ...patch });
  const metrics = computeMetrics(profile);
  const changed = JSON.stringify(profile) !== JSON.stringify(session.profile);

  session.profile = profile;
  session.metrics = metrics;
  if (changed && session.plan) session.planStale = true;
  await saveSession(session);

  return json({ ok: true, profile, metrics, planStale: Boolean(session.planStale) });
});

export const GET = handle(async () => {
  const session = await loadSession();
  if (!session.profile) throw new ApiError(404, "no_profile", "No profile yet — complete onboarding first.");
  return json({ ok: true, profile: session.profile });
});
