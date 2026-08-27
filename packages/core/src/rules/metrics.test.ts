import { describe, expect, it } from "vitest";
import { capacityFor, computeMetrics, emergencyTargetMonths } from "./metrics";
import { FIXTURE_NOW, fixtures } from "../fixtures";
import type { FreedomProfile } from "../schema/profile";

const at = (p: FreedomProfile) => computeMetrics(p, { now: FIXTURE_NOW });
const goal = (p: FreedomProfile, id: string) => {
  const g = at(p).goalProjections.find((x) => x.goalId === id);
  if (!g) throw new Error(`missing projection ${id}`);
  return g;
};

describe("computeMetrics", () => {
  it("sarah: 2-month student buffer, behind on Japan", () => {
    const m = at(fixtures.sarah);
    expect(m.surplus).toBe(300);
    expect(m.savingsRate).toBeCloseTo(0.1667, 3);
    expect(m.emergencyTargetMonths).toBe(2);
    expect(m.emergencyTarget).toBe(3000);
    expect(m.emergencyMonths).toBeCloseTo(0.53, 2);
    expect(m.emergencyGap).toBe(2200);
    expect(m.emergencyProgress).toBeCloseTo(0.2667, 3);
    expect(m.spareSavings).toBe(0);
    expect(m.debtToAnnualIncome).toBe(0);
    expect(m.monthsToClearDebt).toBe(0);
    expect(m.capacity).toBe("steady");

    const japan = goal(fixtures.sarah, "g-japan");
    expect(japan.funded).toBe(0);
    expect(japan.remaining).toBe(6000);
    expect(japan.monthsToTarget).toBe(20);
    expect(japan.monthsUntilDeadline).toBe(18);
    expect(japan.requiredMonthly).toBe(334);
    expect(japan.onTrack).toBe(false);

    const fi = goal(fixtures.sarah, "g-fi");
    expect(fi.targetAmount).toBeNull();
    expect(fi.remaining).toBeNull();
    expect(fi.monthsToTarget).toBeNull();
    expect(fi.onTrack).toBeNull();
  });

  it("userB: buffer already full, deposit on track", () => {
    const m = at(fixtures.userB);
    expect(m.surplus).toBe(3000);
    expect(m.savingsRate).toBe(0.4);
    expect(m.capacity).toBe("strong");
    expect(m.emergencyTarget).toBe(13500);
    expect(m.emergencyMonths).toBeCloseTo(11.11, 2);
    expect(m.emergencyGap).toBe(0);
    expect(m.emergencyProgress).toBe(1);
    expect(m.spareSavings).toBe(36500);

    const home = goal(fixtures.userB, "g-home");
    expect(home.funded).toBe(36500);
    expect(home.remaining).toBe(83500);
    expect(home.monthsToTarget).toBe(28);
    expect(home.monthsUntilDeadline).toBe(28);
    expect(home.requiredMonthly).toBe(2983);
    expect(home.onTrack).toBe(true);
  });

  it("debtHeavy: debt ratio and months to clear", () => {
    const m = at(fixtures.debtHeavy);
    expect(m.surplus).toBe(400);
    expect(m.capacity).toBe("steady");
    expect(m.emergencyTargetMonths).toBe(3);
    expect(m.emergencyTarget).toBe(10800);
    expect(m.emergencyGap).toBe(9300);
    expect(m.debtToAnnualIncome).toBe(1.25);
    expect(m.monthsToClearDebt).toBe(150);
  });

  it("zeroIncome: never produces NaN or Infinity", () => {
    const m = at(fixtures.zeroIncome);
    expect(m.surplus).toBe(-900);
    expect(m.savingsRate).toBeNull();
    expect(m.capacity).toBe("none");
    expect(m.emergencyTarget).toBe(1800);
    expect(m.emergencyProgress).toBe(1);
    expect(m.spareSavings).toBe(700);
    expect(m.debtToAnnualIncome).toBe(0);
    expect(m.monthsToClearDebt).toBe(0);
    const course = goal(fixtures.zeroIncome, "g-course");
    expect(course.funded).toBe(700);
    expect(course.remaining).toBe(2300);
    expect(course.monthsToTarget).toBeNull();
    expect(course.requiredMonthly).toBeNull();
    expect(course.onTrack).toBeNull();
    for (const v of Object.values(m)) {
      if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("zero expenses: no emergency target, progress is complete", () => {
    const m = at({ ...fixtures.sarah, monthlyExpenses: 0 });
    expect(m.emergencyTarget).toBe(0);
    expect(m.emergencyMonths).toBeNull();
    expect(m.emergencyGap).toBe(0);
    expect(m.emergencyProgress).toBe(1);
    expect(m.spareSavings).toBe(800);
  });

  it("debt with no income: ratio unknown, no surplus to clear it", () => {
    const m = at({ ...fixtures.zeroIncome, debt: 5000 });
    expect(m.debtToAnnualIncome).toBeNull();
    expect(m.monthsToClearDebt).toBeNull();
  });

  it("a goal that spare savings already cover is funded immediately", () => {
    const m = at({
      ...fixtures.userB,
      goals: [{ id: "g-car", type: "other", label: "Car", targetAmount: 30000, targetDate: "2027-06-01", priority: 1 }],
    });
    const car = m.goalProjections[0];
    expect(car?.funded).toBe(30000);
    expect(car?.remaining).toBe(0);
    expect(car?.monthsToTarget).toBe(0);
    expect(car?.requiredMonthly).toBe(0);
    expect(car?.onTrack).toBe(true);
  });

  it("a deadline in the past leaves zero months and no required monthly", () => {
    const m = at({
      ...fixtures.sarah,
      goals: [{ id: "g-late", type: "travel", label: "Late", targetAmount: 1000, targetDate: "2020-01-01", priority: 1 }],
    });
    const late = m.goalProjections[0];
    expect(late?.monthsUntilDeadline).toBe(0);
    expect(late?.requiredMonthly).toBeNull();
    expect(late?.onTrack).toBe(false);
  });

  it("applies spare savings to goals in priority order", () => {
    const m = at({
      ...fixtures.userB,
      goals: [
        { id: "second", type: "travel", label: "Second", targetAmount: 10000, priority: 2 },
        { id: "first", type: "other", label: "First", targetAmount: 30000, priority: 1 },
      ],
    });
    expect(m.goalProjections.map((g) => g.goalId)).toEqual(["first", "second"]);
    expect(m.goalProjections[0]?.funded).toBe(30000);
    expect(m.goalProjections[1]?.funded).toBe(6500);
    expect(m.goalProjections[1]?.remaining).toBe(3500);
    expect(m.goalProjections[1]?.monthsToTarget).toBe(2);
  });

  it("uses the real clock when no `now` is given", () => {
    const m = computeMetrics(fixtures.sarah);
    expect(m.goalProjections[0]?.monthsUntilDeadline).not.toBeNull();
  });
});

describe("capacityFor", () => {
  it("classifies every band", () => {
    expect(capacityFor(null)).toBe("none");
    expect(capacityFor(-0.2)).toBe("none");
    expect(capacityFor(0)).toBe("none");
    expect(capacityFor(0.05)).toBe("tight");
    expect(capacityFor(0.1)).toBe("steady");
    expect(capacityFor(0.24)).toBe("steady");
    expect(capacityFor(0.25)).toBe("strong");
  });
});

describe("emergencyTargetMonths", () => {
  it("varies by life stage", () => {
    expect(emergencyTargetMonths("student")).toBe(2);
    expect(emergencyTargetMonths("parent")).toBe(4);
    expect(emergencyTargetMonths("professional")).toBe(3);
    expect(emergencyTargetMonths("early_career")).toBe(3);
    expect(emergencyTargetMonths("other")).toBe(3);
  });
});
