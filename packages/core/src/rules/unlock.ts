import type { ProgressEvent } from "../schema/api";
import type { Bridge, FreedomPlan, Region, Step } from "../schema/plan";
import { orderRegions } from "../layout/order";

export interface ApplyResult {
  plan: FreedomPlan;
  /** Bridges that were locked before and are unlocked now. */
  unlockedBridgeIds: string[];
  /** Regions that were not complete before and are complete now. */
  completedRegionIds: string[];
}

/**
 * Apply one progress event and recompute every derived status. Pure: returns a new plan.
 * Marking a step done fills its metric; a metric reaching its target marks the step done.
 */
export function applyProgress(plan: FreedomPlan, event: ProgressEvent): ApplyResult {
  let matched = false;
  const steps: Step[] = plan.steps.map((s) => {
    if (s.id !== event.stepId) return s;
    matched = true;
    if (event.type === "step_status") {
      const metric =
        event.status === "done" && s.metric ? { ...s.metric, current: s.metric.target } : s.metric;
      return { ...s, status: event.status, metric };
    }
    if (!s.metric) return s;
    const current = Math.max(0, event.current);
    const metric = { ...s.metric, current };
    const status: Step["status"] =
      current >= metric.target ? "done" : current > 0 ? "in_progress" : s.status === "done" ? "todo" : s.status;
    return { ...s, metric, status };
  });
  if (!matched) throw new Error(`Unknown step: ${event.stepId}`);
  return recomputePlanState({ ...plan, steps }, plan);
}

/**
 * Recompute region progress/status, bridge status, the current priority and the next step
 * from the steps alone. Deterministic — no AI involved in unlocking anything.
 */
export function recomputePlanState(plan: FreedomPlan, previous: FreedomPlan = plan): ApplyResult {
  const stepsByRegion = new Map<string, Step[]>();
  for (const s of plan.steps) {
    const list = stepsByRegion.get(s.regionId) ?? [];
    list.push(s);
    stepsByRegion.set(s.regionId, list);
  }
  const doneStep = new Set(plan.steps.filter((s) => s.status === "done").map((s) => s.id));

  // 1. Progress and completion from steps. A saving step counts partially (current ÷ target),
  //    so a half-built buffer shows as half a region, not zero.
  let regions: Region[] = plan.regions.map((r) => {
    const rs = stepsByRegion.get(r.id) ?? [];
    const done = rs.filter((s) => s.status === "done").length;
    const fraction = rs.reduce((sum, s) => sum + stepFraction(s), 0);
    const progress = rs.length ? Math.round((fraction / rs.length) * 1000) / 1000 : 0;
    const complete = rs.length > 0 && done === rs.length;
    const status: Region["status"] = complete ? "complete" : r.status === "complete" ? "available" : r.status;
    return { ...r, progress, status };
  });
  const byId = new Map(regions.map((r) => [r.id, r]));

  // 2. Current priority: keep it unless it is missing or complete.
  let currentPriorityRegionId = plan.currentPriorityRegionId;
  const current = byId.get(currentPriorityRegionId);
  if (!current || current.status === "complete") {
    const candidate = orderRegions({ regions }).find(
      (r) => r.status !== "complete" && r.type !== "freedom_city" && isReachable(r, plan.bridges, byId, doneStep),
    );
    if (candidate) currentPriorityRegionId = candidate.id;
  }

  // 3. Bridges: unlocked when their required steps are done (or `from` is complete),
  //    and always into the current priority region — the plan opened that path on purpose.
  const bridges: Bridge[] = plan.bridges.map((b) => {
    const satisfied = b.requiredStepIds.length
      ? b.requiredStepIds.every((id) => doneStep.has(id))
      : byId.get(b.from)?.status === "complete";
    const forced = b.to === currentPriorityRegionId;
    return { ...b, status: satisfied || forced ? "unlocked" : "locked" };
  });

  // 4. Availability: a locked region opens when any bridge into it is unlocked, or it has no incoming bridges.
  regions = regions.map((r) => {
    if (r.status !== "locked") return r;
    const incoming = bridges.filter((b) => b.to === r.id);
    const open = incoming.length === 0 || incoming.some((b) => b.status === "unlocked");
    return open ? { ...r, status: "available" } : r;
  });

  // 5. Exactly one active region: the current priority (unless complete).
  regions = regions.map((r) => {
    if (r.id === currentPriorityRegionId && r.status !== "complete") return { ...r, status: "active" };
    if (r.status === "active") return { ...r, status: "available" };
    return r;
  });

  // 6. Next step: first unfinished step in the priority region, else anywhere reachable.
  const unfinished = (s: Step) => s.status !== "done";
  const byOrder = (a: Step, b: Step) => a.order - b.order;
  const inPriority = (stepsByRegion.get(currentPriorityRegionId) ?? []).filter(unfinished).sort(byOrder)[0];
  const reachableIds = new Set(regions.filter((r) => r.status !== "locked").map((r) => r.id));
  const anywhere = orderRegions({ regions })
    .filter((r) => reachableIds.has(r.id))
    .flatMap((r) => (stepsByRegion.get(r.id) ?? []).filter(unfinished).sort(byOrder))[0];
  const nextStepId = inPriority?.id ?? anywhere?.id ?? plan.nextStepId;

  const prevUnlocked = new Set(previous.bridges.filter((b) => b.status === "unlocked").map((b) => b.id));
  const prevComplete = new Set(previous.regions.filter((r) => r.status === "complete").map((r) => r.id));

  return {
    plan: { ...plan, regions, bridges, currentPriorityRegionId, nextStepId },
    unlockedBridgeIds: bridges.filter((b) => b.status === "unlocked" && !prevUnlocked.has(b.id)).map((b) => b.id),
    completedRegionIds: regions.filter((r) => r.status === "complete" && !prevComplete.has(r.id)).map((r) => r.id),
  };
}

/** How complete one step is: done = 1, a saving step = current ÷ target, in progress = ½, else 0. */
export function stepFraction(step: Step): number {
  if (step.status === "done") return 1;
  if (step.metric && step.metric.target > 0) return Math.min(1, Math.max(0, step.metric.current / step.metric.target));
  return step.status === "in_progress" ? 0.5 : 0;
}

function isReachable(r: Region, bridges: Bridge[], byId: Map<string, Region>, doneStep: Set<string>): boolean {
  if (r.status !== "locked") return true;
  const incoming = bridges.filter((b) => b.to === r.id);
  if (incoming.length === 0) return true;
  return incoming.some((b) =>
    b.requiredStepIds.length
      ? b.requiredStepIds.every((id) => doneStep.has(id))
      : byId.get(b.from)?.status === "complete",
  );
}
