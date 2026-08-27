import { FreedomProfile } from "@free-me/core";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/session";

export const POST = handle(async (req) => {
  const profile = await parseBody(req, FreedomProfile);
  const session = await loadSession();
  session.profile = profile;
  session.plan = null;
  session.metrics = null;
  session.planMode = null;
  session.events = [];
  await saveSession(session);
  return json({ ok: true, profile });
});

export const GET = handle(async () => {
  const session = await loadSession();
  if (!session.profile) throw new ApiError(404, "no_profile", "No profile yet — complete onboarding first.");
  return json({ ok: true, profile: session.profile });
});
