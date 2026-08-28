import { describe, expect, it } from "vitest";
import { compareScenarios, payYourselfPlan } from "./pay-yourself";
import { computeMetrics } from "./metrics";
import { personas } from "../fixtures/personas";
import type { FreedomProfile } from "../schema/profile";

const NOW = new Date("2026-09-01T00:00:00Z");
const plan = (p: FreedomProfile, opts = {}) => payYourselfPlan(p, computeMetrics(p, { now: NOW }), { now: NOW, ...opts });
const line = (p: ReturnType<typeof plan>, key: string) => p.lines.find((l) => l.key === key);
const total = (p: ReturnType<typeof plan>) => p.lines.reduce((s, l) => s + l.amount, 0);

describe("payYourselfPlan", () => {
  it("splits exactly the surplus, every time", () => {
    for (const [name, p] of Object.entries(personas)) {
      const result = plan(p);
      const metrics = computeMetrics(p, { now: NOW });
      expect(result.monthlyTotal, name).toBe(Math.max(0, metrics.surplus));
      expect(total(result), name).toBe(result.monthlyTotal);
      expect(result.lines.every((l) => l.amount >= 0), name).toBe(true);
    }
  });

  it("Aman: the safety net gets its share before the trip", () => {
    const p = plan(personas.aman);
    expect(line(p, "buffer")?.amount).toBeGreaterThan(0);
    expect(line(p, "g-worldcup")?.amount).toBeGreaterThan(0);
    expect(line(p, "buffer")?.reason).toMatch(/short of a 2-month buffer/);
  });

  it("Vinuy: buffer already done, so it's the goal then flexible", () => {
    const p = plan(personas.vinuy);
    expect(line(p, "buffer")).toBeUndefined();
    expect(line(p, "g-deposit")?.amount).toBe(1087);
    expect(line(p, "g-deposit")?.onTrack).toBe(true);
    expect(line(p, "flexible")?.amount).toBe(513);
  });

  it("Mike: the venture goal takes no monthly slice, so the deposit gets funded properly", () => {
    const p = plan(personas.mike);
    expect(p.growthGoals.map((g) => g.goalId)).toEqual(["g-million"]);
    expect(p.growthGoals[0]?.reason).toMatch(/isn't reached by saving/);
    expect(line(p, "g-million")).toBeUndefined();
    // The apartment now gets what its deadline actually needs, not the leftovers.
    const apartment = line(p, "g-apartment")!;
    expect(apartment.amount).toBe(495);
    expect(apartment.onTrack).toBe(true);
    expect(line(p, "flexible")?.amount).toBe(3805);
  });

  it("Zuko: one goal that can't be reached still gets the whole budget, and says so", () => {
    const p = plan(personas.zuko);
    const goal = line(p, "g-two-million")!;
    expect(goal.amount).toBe(6200);
    expect(goal.onTrack).toBe(false);
    expect(goal.reason).toMatch(/See what would close the gap/);
    expect(goal.ways?.reachable).toBe(false);
  });

  it("respects an explicit monthly total and an excluded goal", () => {
    const p = plan(personas.mike, { monthlyTotal: 1000, excludeGoalIds: ["g-apartment"] });
    expect(p.monthlyTotal).toBe(1000);
    expect(line(p, "g-apartment")).toBeUndefined();
    expect(line(p, "flexible")?.amount).toBe(1000);
  });

  it("with no surplus there is nothing to split", () => {
    const broke: FreedomProfile = { ...personas.aman, monthlyIncome: 1000, monthlyExpenses: 1200 };
    const p = plan(broke);
    expect(p.monthlyTotal).toBe(0);
    expect(p.lines).toHaveLength(0);
    expect(p.shareOfIncome).toBe(0);
  });

  it("a growth assumption lowers what each goal needs", () => {
    const flat = plan(personas.camille);
    const grown = plan(personas.camille, { annualRate: 0.05 });
    expect(grown.annualRate).toBe(0.05);
    expect(grown.lines.find((l) => l.key === "g-masters")!.ways!.projected).toBeGreaterThan(
      flat.lines.find((l) => l.key === "g-masters")!.ways!.projected,
    );
  });
});

describe("compareScenarios", () => {
  it("dropping a goal moves its money to the one that's left", () => {
    const metrics = computeMetrics(personas.mike, { now: NOW });
    const { base, variant, deltas } = compareScenarios(
      personas.mike,
      metrics,
      { now: NOW },
      { now: NOW, excludeGoalIds: ["g-apartment"] },
    );
    expect(base.lines.some((l) => l.key === "g-apartment")).toBe(true);
    expect(variant.lines.some((l) => l.key === "g-apartment")).toBe(false);
    // The flexible pot absorbs it, and the totals still balance.
    expect(variant.lines.reduce((s, l) => s + l.amount, 0)).toBe(variant.monthlyTotal);
    expect(deltas.some((d) => d.goalId === "g-apartment" && d.after === 0)).toBe(true);
  });

  it("reports how many months a goal moves when another is dropped", () => {
    // Two goals of equal weight competing for one budget.
    const two: FreedomProfile = {
      ...personas.camille,
      goals: [
        { id: "g-a", type: "education", label: "Master's", targetAmount: 60000, targetDate: "2030-02-01", priority: 1, currentBalance: 9000 },
        { id: "g-b", type: "other", label: "Car", targetAmount: 30000, targetDate: "2030-02-01", priority: 2, currentBalance: 0 },
      ],
    };
    const metrics = computeMetrics(two, { now: NOW });
    const { deltas } = compareScenarios(two, metrics, { now: NOW }, { now: NOW, excludeGoalIds: ["g-b"] });
    const masters = deltas.find((d) => d.goalId === "g-a")!;
    expect(masters.after).toBeGreaterThan(masters.before);
    expect(masters.monthsSaved).not.toBeNull();
    expect(masters.monthsSaved!).toBeLessThan(0); // arrives sooner
  });
});
