import { AllocationRequest } from "@free-me/core";
import { allocate, ruleAllocation } from "@free-me/ai";
import { bundleFrom, handle, json, parseBody } from "@/lib/api";
import { getAiClient, planMode } from "@/lib/ai";
import { loadSession, saveSession } from "@/lib/session";

export const maxDuration = 30;

export const POST = handle(async (req) => {
  const { amount } = await parseBody(req, AllocationRequest);
  const session = await loadSession();
  const { profile, plan, metrics } = bundleFrom(session);

  const input = { plan, metrics, profile, amount };
  const result =
    planMode() === "ai"
      ? await allocate(input, { client: getAiClient() })
      : { allocation: ruleAllocation(input), source: "rules" as const };

  session.allocations = [...session.allocations, result.allocation];
  await saveSession(session);

  return json({ allocation: result.allocation, source: result.source });
});
