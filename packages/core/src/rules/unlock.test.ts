import { describe, expect, it } from "vitest";
import { applyProgress, recomputePlanState } from "./unlock";
import { computeMetrics } from "./metrics";
import { templatePlan } from "./template";
import { FIXTURE_NOW, fixtures } from "../fixtures";
import type { FreedomPlan } from "../schema/plan";

const sarahPlan = (): FreedomPlan =>
  templatePlan(fixtures.sarah, computeMetrics(fixtures.sarah, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });

const region = (plan: FreedomPlan, id: string) => {
  const r = plan.regions.find((x) => x.id === id);
  if (!r) throw new Error(`missing region ${id}`);
  return r;
};
const bridge = (plan: FreedomPlan, id: string) => {
  const b = plan.bridges.find((x) => x.id === id);
  if (!b) throw new Error(`missing bridge ${id}`);
  return b;
};
const step = (plan: FreedomPlan, id: string) => {
  const s = plan.steps.find((x) => x.id === id);
  if (!s) throw new Error(`missing step ${id}`);
  return s;
};

describe("initial state (sarah, beginner)", () => {
  it("starts in Foundation with the first step next and everything else locked", () => {
    const plan = sarahPlan();
    expect(plan.currentPriorityRegionId).toBe("foundation");
    expect(plan.nextStepId).toBe("foundation.understand-spending");
    expect(region(plan, "foundation").status).toBe("active");
    expect(region(plan, "security").status).toBe("locked");
    expect(region(plan, "growth").status).toBe("locked");
    expect(region(plan, "goal-g-japan").status).toBe("locked");
    expect(region(plan, "freedom_city").status).toBe("locked");
    expect(bridge(plan, "foundation->security").status).toBe("locked");
    expect(plan.regions.filter((r) => r.status === "active")).toHaveLength(1);
  });
});

describe("applyProgress", () => {
  it("completing a step unlocks its bridge and opens the next region", () => {
    const { plan, unlockedBridgeIds, completedRegionIds } = applyProgress(sarahPlan(), {
      type: "step_status",
      stepId: "foundation.understand-spending",
      status: "done",
    });
    expect(unlockedBridgeIds).toEqual(["foundation->security"]);
    expect(completedRegionIds).toEqual([]);
    expect(region(plan, "foundation").progress).toBe(0.5);
    expect(region(plan, "foundation").status).toBe("active");
    expect(region(plan, "security").status).toBe("available");
    expect(plan.nextStepId).toBe("foundation.build-budget");
  });

  it("completing a region moves the priority and the next step forward", () => {
    const first = applyProgress(sarahPlan(), {
      type: "step_status",
      stepId: "foundation.understand-spending",
      status: "done",
    }).plan;
    const { plan, completedRegionIds } = applyProgress(first, {
      type: "step_status",
      stepId: "foundation.build-budget",
      status: "done",
    });
    expect(completedRegionIds).toEqual(["foundation"]);
    expect(region(plan, "foundation").status).toBe("complete");
    expect(region(plan, "foundation").progress).toBe(1);
    expect(plan.currentPriorityRegionId).toBe("security");
    expect(region(plan, "security").status).toBe("active");
    expect(plan.nextStepId).toBe("security.emergency-buffer");
    expect(region(plan, "growth").status).toBe("locked");
  });

  it("a metric moves a step to in_progress, then done, and cascades", () => {
    let plan = sarahPlan();
    for (const id of ["foundation.understand-spending", "foundation.build-budget"]) {
      plan = applyProgress(plan, { type: "step_status", stepId: id, status: "done" }).plan;
    }
    const partial = applyProgress(plan, { type: "step_metric", stepId: "security.emergency-buffer", current: 1200 });
    expect(step(partial.plan, "security.emergency-buffer").status).toBe("in_progress");
    expect(step(partial.plan, "security.emergency-buffer").metric?.current).toBe(1200);
    expect(partial.unlockedBridgeIds).toEqual([]);

    const full = applyProgress(partial.plan, { type: "step_metric", stepId: "security.emergency-buffer", current: 3000 });
    expect(step(full.plan, "security.emergency-buffer").status).toBe("done");
    expect(full.completedRegionIds).toEqual(["security"]);
    expect(full.unlockedBridgeIds).toContain("security->growth");
    expect(full.plan.currentPriorityRegionId).toBe("growth");
    expect(region(full.plan, "growth").status).toBe("active");
    expect(full.plan.nextStepId).toBe("growth.saving-target");
  });

  it("marking a metric step done fills the metric to its target", () => {
    const { plan } = applyProgress(sarahPlan(), { type: "step_status", stepId: "security.emergency-buffer", status: "done" });
    const s = step(plan, "security.emergency-buffer");
    expect(s.status).toBe("done");
    expect(s.metric?.current).toBe(3000);
  });

  it("a metric back to zero returns a done step to todo", () => {
    const done = applyProgress(sarahPlan(), { type: "step_status", stepId: "security.emergency-buffer", status: "done" }).plan;
    const { plan } = applyProgress(done, { type: "step_metric", stepId: "security.emergency-buffer", current: 0 });
    expect(step(plan, "security.emergency-buffer").status).toBe("todo");
    expect(step(plan, "security.emergency-buffer").metric?.current).toBe(0);
  });

  it("a metric event on a step without a metric is a no-op on that step", () => {
    const { plan } = applyProgress(sarahPlan(), { type: "step_metric", stepId: "foundation.build-budget", current: 10 });
    expect(step(plan, "foundation.build-budget")).toEqual(step(sarahPlan(), "foundation.build-budget"));
  });

  it("negative metric values are clamped to zero", () => {
    const { plan } = applyProgress(sarahPlan(), { type: "step_metric", stepId: "security.emergency-buffer", current: -50 });
    expect(step(plan, "security.emergency-buffer").metric?.current).toBe(0);
  });

  it("un-doing a step re-opens a completed region", () => {
    let plan = sarahPlan();
    for (const id of ["foundation.understand-spending", "foundation.build-budget"]) {
      plan = applyProgress(plan, { type: "step_status", stepId: id, status: "done" }).plan;
    }
    expect(region(plan, "foundation").status).toBe("complete");
    const { plan: reopened } = applyProgress(plan, { type: "step_status", stepId: "foundation.build-budget", status: "todo" });
    expect(region(reopened, "foundation").status).toBe("available");
    expect(region(reopened, "foundation").progress).toBe(0.5);
    expect(reopened.currentPriorityRegionId).toBe("security");
  });

  it("throws on an unknown step", () => {
    expect(() => applyProgress(sarahPlan(), { type: "step_status", stepId: "nope", status: "done" })).toThrow(/Unknown step/);
  });
});

describe("recomputePlanState", () => {
  it("picks a new priority when the current one is missing", () => {
    const plan = { ...sarahPlan(), currentPriorityRegionId: "ghost" };
    const { plan: fixed } = recomputePlanState(plan);
    expect(fixed.currentPriorityRegionId).toBe("foundation");
    expect(region(fixed, "foundation").status).toBe("active");
  });

  it("forces bridges into the priority region open", () => {
    const debt = fixtures.debtHeavy;
    const plan = templatePlan(debt, computeMetrics(debt, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });
    expect(plan.currentPriorityRegionId).toBe("security");
    expect(bridge(plan, "foundation->security").status).toBe("unlocked");
    expect(region(plan, "security").status).toBe("active");
    expect(region(plan, "foundation").status).toBe("available");
  });

  it("falls back to any reachable unfinished step when the priority region has none", () => {
    const base = sarahPlan();
    const plan: FreedomPlan = {
      ...base,
      steps: base.steps.filter((s) => s.regionId !== "foundation"),
      // no bridge leads into security, so it is reachable on its own
      bridges: base.bridges.filter((b) => b.to !== "security"),
      currentPriorityRegionId: "foundation",
    };
    const { plan: fixed } = recomputePlanState(plan);
    expect(fixed.currentPriorityRegionId).toBe("foundation");
    expect(region(fixed, "security").status).toBe("available");
    expect(step(fixed, fixed.nextStepId).regionId).toBe("security");
  });

  it("keeps the previous nextStepId when nothing is left to do", () => {
    const base = sarahPlan();
    const done: FreedomPlan = { ...base, steps: base.steps.map((s) => ({ ...s, status: "done" })) };
    const { plan } = recomputePlanState(done);
    expect(plan.nextStepId).toBe(base.nextStepId);
    expect(plan.regions.every((r) => r.status === "complete")).toBe(true);
  });
});
