import { describe, expect, it } from "vitest";
import { GoalFuturesSchema, PayYourselfPlanSchema, SaveRequest, WaysSchema } from "./save";
import { payYourselfPlan } from "../rules/pay-yourself";
import { exploreFutures, growthGoalNote } from "../rules/futures";
import { waysToGetThere } from "../rules/growth";
import { computeMetrics } from "../rules/metrics";
import { personas } from "../fixtures/personas";

const NOW = new Date("2026-09-01T00:00:00Z");

/**
 * The engines own the TypeScript types; these schemas describe the same shapes on the wire.
 * Parsing real engine output through them is what stops the two drifting apart.
 */
describe("the wire schemas match what the engines actually return", () => {
  it("payYourselfPlan output parses, for every persona", () => {
    for (const [name, profile] of Object.entries(personas)) {
      const metrics = computeMetrics(profile, { now: NOW });
      const plan = payYourselfPlan(profile, metrics, { now: NOW });
      const parsed = PayYourselfPlanSchema.safeParse(plan);
      expect(parsed.success, `${name}: ${parsed.error?.message}`).toBe(true);
    }
  });

  it("waysToGetThere output parses", () => {
    const ways = waysToGetThere({ target: 100000, current: 12000, monthly: 900, months: 81 });
    expect(WaysSchema.safeParse(ways).success).toBe(true);
  });

  it("a goal with futures parses", () => {
    const { today, futures } = exploreFutures({
      target: 60000,
      current: 9000,
      months: 41,
      monthlyIncome: 4800,
      monthlyExpenses: 3400,
      savingsRate: 0.23,
    });
    const parsed = GoalFuturesSchema.safeParse({
      goalId: "g-masters",
      label: "Master's degree",
      emoji: "🎓",
      fundedBy: "savings",
      target: 60000,
      current: 9000,
      monthsUntilDeadline: 41,
      targetDate: "2030-02-01",
      monthly: 1120,
      today,
      futures,
    });
    expect(parsed.success, parsed.error?.message).toBe(true);
  });

  it("a growth goal's note parses", () => {
    const growthNote = growthGoalNote({ target: 1000000, current: 40000, months: 72, monthlyContribution: 0 });
    const parsed = GoalFuturesSchema.safeParse({
      goalId: "g-million",
      label: "$1M net worth by 35",
      fundedBy: "growth",
      target: 1000000,
      current: 40000,
      monthsUntilDeadline: 72,
      targetDate: "2032-09-01",
      monthly: 0,
      today: null,
      futures: [],
      growthNote,
    });
    expect(parsed.success, parsed.error?.message).toBe(true);
  });
});

describe("SaveRequest", () => {
  it("keeps the growth assumption inside a defensible range", () => {
    expect(SaveRequest.safeParse({ annualRate: 0.06 }).success).toBe(true);
    expect(SaveRequest.safeParse({ annualRate: 0.5 }).success).toBe(false);
    expect(SaveRequest.safeParse({ annualRate: -0.01 }).success).toBe(false);
  });

  it("accepts an empty body — everything is optional", () => {
    expect(SaveRequest.safeParse({}).success).toBe(true);
  });
});
