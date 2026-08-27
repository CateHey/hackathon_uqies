import { ApiError, handle, json } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/session";

/** Swap the background-built personalised plan in for the current one. */
export const POST = handle(async () => {
  const session = await loadSession();
  if (!session.profile) throw new ApiError(404, "no_profile", "No profile yet — complete onboarding first.");
  if (!session.upgrade) throw new ApiError(409, "no_upgrade", "No personalised plan is ready yet.");

  session.plan = session.upgrade.plan;
  session.metrics = session.upgrade.metrics;
  session.planMode = "ai";
  session.events = [];
  session.upgrade = null;
  await saveSession(session);

  return json({ profile: session.profile, plan: session.plan, metrics: session.metrics });
});
