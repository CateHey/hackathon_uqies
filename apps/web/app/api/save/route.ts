import { SaveRequest } from "@free-me/core";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { buildSave } from "@/lib/save";
import { loadSession } from "@/lib/session";

/** The current split. */
export const GET = handle(async () => {
  const session = await loadSession();
  if (!session.profile) throw new ApiError(404, "no_profile", "No profile yet — complete onboarding first.");
  return json(buildSave(session.profile));
});

/** The same thing under different settings: a different monthly amount, growth assumption, or goals left out. */
export const POST = handle(async (req) => {
  const body = await parseBody(req, SaveRequest);
  const session = await loadSession();
  if (!session.profile) throw new ApiError(404, "no_profile", "No profile yet — complete onboarding first.");
  return json(buildSave(session.profile, body));
});
