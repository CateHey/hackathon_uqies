import { applyProgress, ProgressEvent } from "@free-me/core";
import { ApiError, bundleFrom, handle, json, parseBody } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/session";

/** Progress is deterministic — no model call. Unlocks and re-prioritisation come from the rules engine. */
export const POST = handle(async (req) => {
  const event = await parseBody(req, ProgressEvent);
  const session = await loadSession();
  const { plan, metrics } = bundleFrom(session);

  let result;
  try {
    result = applyProgress(plan, event);
  } catch (e) {
    throw new ApiError(404, "not_found", e instanceof Error ? e.message : "Unknown step.");
  }

  session.plan = result.plan;
  session.events = [...session.events, event];
  await saveSession(session);

  return json({
    plan: result.plan,
    metrics,
    unlockedBridgeIds: result.unlockedBridgeIds,
    completedRegionIds: result.completedRegionIds,
  });
});
