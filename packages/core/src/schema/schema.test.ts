import { describe, expect, it } from "vitest";
import { AllocationRequest, FreedomPlan, FreedomProfile, ProgressEvent, WhyRequest } from "./index";
import { fixtures } from "../fixtures";
import { templatePlan } from "../rules/template";
import { computeMetrics } from "../rules/metrics";
import { FIXTURE_NOW } from "../fixtures";

describe("FreedomProfile", () => {
  it("accepts every fixture", () => {
    for (const p of Object.values(fixtures)) expect(FreedomProfile.safeParse(p).success).toBe(true);
  });

  it("rejects a profile with no goals, a bad country code, or a bad date", () => {
    expect(FreedomProfile.safeParse({ ...fixtures.sarah, goals: [] }).success).toBe(false);
    expect(FreedomProfile.safeParse({ ...fixtures.sarah, country: "AUS" }).success).toBe(false);
    expect(
      FreedomProfile.safeParse({
        ...fixtures.sarah,
        goals: [{ id: "g", type: "travel", label: "x", targetDate: "March 2028", priority: 1 }],
      }).success,
    ).toBe(false);
  });

  it("strips unknown keys", () => {
    const parsed = FreedomProfile.parse({ ...fixtures.sarah, extra: 1 });
    expect("extra" in parsed).toBe(false);
  });
});

describe("FreedomPlan", () => {
  it("parses a template plan and rejects a bad status", () => {
    const plan = templatePlan(fixtures.sarah, computeMetrics(fixtures.sarah, { now: FIXTURE_NOW }));
    expect(FreedomPlan.safeParse(plan).success).toBe(true);
    const bad = { ...plan, regions: plan.regions.map((r) => ({ ...r, status: "open" })) };
    expect(FreedomPlan.safeParse(bad).success).toBe(false);
  });

  it("does not check referential integrity (that belongs to packages/ai validation)", () => {
    const plan = templatePlan(fixtures.sarah, computeMetrics(fixtures.sarah, { now: FIXTURE_NOW }));
    const dangling = { ...plan, steps: [...plan.steps, { ...plan.steps[0]!, id: "dangling", regionId: "ghost" }] };
    expect(FreedomPlan.safeParse(dangling).success).toBe(true);
  });
});

describe("API schemas", () => {
  it("ProgressEvent is a discriminated union", () => {
    expect(ProgressEvent.safeParse({ type: "step_status", stepId: "a", status: "done" }).success).toBe(true);
    expect(ProgressEvent.safeParse({ type: "step_metric", stepId: "a", current: 10 }).success).toBe(true);
    expect(ProgressEvent.safeParse({ type: "step_metric", stepId: "a", current: -1 }).success).toBe(false);
    expect(ProgressEvent.safeParse({ type: "other", stepId: "a" }).success).toBe(false);
  });

  it("AllocationRequest needs a positive integer", () => {
    expect(AllocationRequest.safeParse({ amount: 1000 }).success).toBe(true);
    expect(AllocationRequest.safeParse({ amount: 0 }).success).toBe(false);
    expect(AllocationRequest.safeParse({ amount: 10.5 }).success).toBe(false);
  });

  it("WhyRequest limits item types", () => {
    expect(WhyRequest.safeParse({ itemType: "region", itemId: "x" }).success).toBe(true);
    expect(WhyRequest.safeParse({ itemType: "lesson", itemId: "x" }).success).toBe(false);
  });
});
