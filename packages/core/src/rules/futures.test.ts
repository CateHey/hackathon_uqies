import { describe, expect, it } from "vitest";
import {
  exploreFutures,
  growthGoalNote,
  monthsAtThisPace,
  requiredIncome,
  requiredRaise,
  requiredSavingsRate,
  simulateFuture,
  type FutureLevers,
} from "./futures";

const levers = (over: Partial<FutureLevers> = {}): FutureLevers => ({
  monthlyIncome: 5200,
  monthlyExpenses: 3600,
  savingsRate: 0.185,
  annualRaise: 0,
  annualRate: 0,
  months: 81,
  ...over,
});

describe("simulateFuture", () => {
  it("with no raise and no growth it is just contributions", () => {
    const out = simulateFuture(levers({ savingsRate: 0.2, months: 10, monthlyIncome: 1000 }), {
      current: 500,
      target: 100000,
    });
    expect(out.finalBalance).toBe(2500);
    expect(out.firstMonthly).toBe(200);
    expect(out.lastMonthly).toBe(200);
    expect(out.totalContributed).toBe(2000);
    expect(out.reaches).toBe(false);
  });

  it("a raise lifts the contribution once a year", () => {
    const out = simulateFuture(
      levers({ monthlyIncome: 1000, savingsRate: 0.1, annualRaise: 0.1, months: 24 }),
      { current: 0, target: 1e9 },
    );
    expect(out.firstMonthly).toBe(100);
    // The raise lands at the start of year two (month 13), so 24 months sees exactly one.
    expect(out.lastMonthly).toBeCloseTo(110, 0);
    expect(simulateFuture(levers({ monthlyIncome: 1000, savingsRate: 0.1, annualRaise: 0.1, months: 25 }), { current: 0, target: 1e9 }).lastMonthly).toBeCloseTo(121, 0);
  });

  it("reports the month it crosses the line", () => {
    const out = simulateFuture(levers({ monthlyIncome: 1000, savingsRate: 0.5, months: 24 }), {
      current: 0,
      target: 5000,
    });
    expect(out.monthsToTarget).toBe(10);
    expect(out.reaches).toBe(true);
  });

  it("counts an already-funded goal as done at month zero", () => {
    const out = simulateFuture(levers(), { current: 200000, target: 100000 });
    expect(out.monthsToTarget).toBe(0);
  });
});

describe("solving each lever — Vinuy's $100k deposit", () => {
  const args = { current: 12000, target: 100000 };

  it("says what share of income would do it", () => {
    const rate = requiredSavingsRate(levers(), args)!;
    expect(rate).toBeGreaterThan(0.185);
    expect(rate).toBeLessThan(0.31);
    expect(simulateFuture(levers({ savingsRate: rate }), args).reaches).toBe(true);
  });

  it("says what income would do it at today's share", () => {
    const income = requiredIncome(levers(), args)!;
    expect(income).toBeGreaterThan(5200);
    expect(simulateFuture(levers({ monthlyIncome: income }), args).reaches).toBe(true);
  });

  it("says what annual pay rise would do it", () => {
    const raise = requiredRaise(levers(), args)!;
    expect(raise).toBeGreaterThan(0);
    expect(raise).toBeLessThan(0.35);
    expect(simulateFuture(levers({ annualRaise: raise }), args).reaches).toBe(true);
  });

  it("says how long today's pace takes", () => {
    const months = monthsAtThisPace(levers(), args)!;
    expect(months).toBeGreaterThan(81);
  });

  it("returns null when the lever cannot get there", () => {
    // Everything already goes out the door: no share of income is available.
    expect(requiredSavingsRate(levers({ monthlyExpenses: 5200 }), args)).toBeNull();
    // Saving nothing means no income is ever enough.
    expect(requiredIncome(levers({ savingsRate: 0 }), args)).toBeNull();
  });
});

describe("exploreFutures", () => {
  it("Vinuy: four futures, ordered by how much they ask", () => {
    const { today, futures } = exploreFutures({
      target: 100000,
      current: 12000,
      months: 81,
      monthlyIncome: 5200,
      monthlyExpenses: 3600,
      savingsRate: 0.185,
    });
    expect(today.works).toBe(false);
    expect(today.headline).toMatch(/of \$100,000/);
    expect(futures.length).toBeGreaterThanOrEqual(3);
    expect(futures.every((f) => f.works)).toBe(true);
    for (let i = 1; i < futures.length; i++) {
      expect(futures[i]!.stretch).toBeGreaterThanOrEqual(futures[i - 1]!.stretch);
    }
    const kinds = futures.map((f) => f.kind);
    expect(kinds).toContain("save_more");
    expect(kinds).toContain("earn_more");
    expect(kinds).toContain("grow_income");
    // Every future that claims to work actually reaches the target in simulation.
    for (const f of futures) {
      expect(simulateFuture(f.levers, { current: 12000, target: 100000 }).reaches, f.kind).toBe(true);
    }
  });

  it("says nothing more is needed when today's pace already works", () => {
    const { today, futures } = exploreFutures({
      target: 6500,
      current: 600,
      months: 45,
      monthlyIncome: 1400,
      monthlyExpenses: 1150,
      savingsRate: 0.18,
    });
    expect(today.works).toBe(true);
    expect(today.headline).toMatch(/Keep going exactly as you are/);
    expect(futures).toHaveLength(0);
  });

  it("Zuko: $2M in four years — refuses to invent a route", () => {
    const { today, futures } = exploreFutures({
      target: 2000000,
      current: 496600,
      months: 48,
      monthlyIncome: 14000,
      monthlyExpenses: 7800,
      savingsRate: 0.44,
      maxSavingsRate: 0.5,
    });
    expect(today.works).toBe(false);
    // Saving a bigger share cannot close a gap that large in four years.
    expect(futures.some((f) => f.kind === "save_more")).toBe(false);
    // What it does offer is honest: earn far more, or take much longer.
    expect(futures.every((f) => f.works || f.kind === "out_of_reach")).toBe(true);
    const earn = futures.find((f) => f.kind === "earn_more");
    if (earn) expect(earn.levers.monthlyIncome).toBeGreaterThan(20000);
  });

  it("when no lever works it says so instead of inventing one", () => {
    const { futures } = exploreFutures({
      target: 5_000_000,
      current: 0,
      months: 6,
      monthlyIncome: 3000,
      monthlyExpenses: 2500,
      savingsRate: 0.1,
      maxSavingsRate: 0.5,
    });
    expect(futures).toHaveLength(1);
    expect(futures[0]!.kind).toBe("out_of_reach");
    expect(futures[0]!.works).toBe(false);
    expect(futures[0]!.headline).toMatch(/needs a different kind of answer/);
  });
});

describe("growthGoalNote — Mike's $1M via his venture", () => {
  it("says what saving contributes and leaves the rest where it belongs", () => {
    const note = growthGoalNote({ target: 1000000, current: 40000, months: 72, monthlyContribution: 2000 });
    expect(note.fromSaving).toBe(184000);
    expect(note.gap).toBe(816000);
    expect(note.headline).toMatch(/has to come from what you build/);
    expect(note.headline).toMatch(/won't pretend a savings plan will do it/);
  });

  it("admits when saving alone would actually cover it", () => {
    const note = growthGoalNote({ target: 50000, current: 20000, months: 24, monthlyContribution: 2000 });
    expect(note.gap).toBe(0);
    expect(note.headline).toMatch(/Saving alone would actually cover this/);
  });
});
