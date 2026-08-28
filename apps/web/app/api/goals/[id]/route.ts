import { FreedomProfile, GoalPatch } from "@free-me/core";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Edit one goal — its balance, emoji, target or date — without touching the plan.
 * Changing the profile through /api/profile resets everything; this deliberately doesn't.
 */
export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const patch = await parseBody(req, GoalPatch);
  const session = await loadSession();
  if (!session.profile) throw new ApiError(404, "no_profile", "No profile yet — complete onboarding first.");
  if (!session.profile.goals.some((g) => g.id === id)) throw new ApiError(404, "not_found", `No goal called "${id}".`);

  const profile = FreedomProfile.parse({
    ...session.profile,
    goals: session.profile.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  });
  session.profile = profile;
  await saveSession(session);
  return json({ ok: true, profile });
});
