import { WhyRequest } from "@free-me/core";
import { explain, findPlanItem } from "@free-me/ai";
import { ApiError, bundleFrom, handle, json, parseBody } from "@/lib/api";
import { getAiClient, planMode } from "@/lib/ai";
import { loadSession } from "@/lib/session";

export const maxDuration = 30;

export const POST = handle(async (req) => {
  const { itemType, itemId } = await parseBody(req, WhyRequest);
  const session = await loadSession();
  const { profile, plan, metrics } = bundleFrom(session);

  const item = findPlanItem(plan, itemType, itemId);
  if (!item) throw new ApiError(404, "not_found", `${itemType} ${itemId} is not in your plan.`);

  if (planMode() !== "ai") {
    return json({ explanation: item.why, source: "plan" });
  }
  const result = await explain({ plan, metrics, profile, itemType, itemId }, { client: getAiClient() });
  return json({ explanation: result.explanation, source: result.source });
});
