import { describe, expect, it } from "vitest";
import {
  monthsToTarget,
  PLAUSIBLE_MAX_RATE,
  projectBalance,
  projectSeries,
  RATE_PRESETS,
  requiredMonthly,
  requiredRate,
  waysToGetThere,
} from "./growth";

describe("projectBalance", () => {
  it("with no growth it is just the contributions", () => {
    expect(projectBalance({ current: 600, monthly: 250, months: 12, annualRate: 0 })).toBe(3600);
  });

  it("compounds monthly on both the balance and the contributions", () => {
    // $10,000 at 6% for a year, plus $100/month
    const v = projectBalance({ current: 10000, monthly: 100, months: 12, annualRate: 0.06 });
    expect(v).toBeGreaterThan(10000 * 1.06 + 1200);
    expect(v).toBeLessThan(11900);
  });

  it("handles zero months and zero everything", () => {
    expect(projectBalance({ current: 500, monthly: 100, months: 0, annualRate: 0.05 })).toBe(500);
    expect(projectBalance({ current: 0, monthly: 0, months: 24, annualRate: 0.05 })).toBe(0);
  });

  it("projectSeries starts at today and ends at the projection", () => {
    const s = projectSeries({ current: 1000, monthly: 100, months: 6, annualRate: 0 });
    expect(s).toHaveLength(7);
    expect(s[0]).toBe(1000);
    expect(s[6]).toBe(1600);
  });
});

describe("requiredMonthly", () => {
  it("splits the gap evenly when nothing grows", () => {
    expect(requiredMonthly({ current: 600, target: 6500, months: 44, annualRate: 0 })).toBe(135);
  });

  it("asks for less once growth is assumed", () => {
    const flat = requiredMonthly({ current: 12000, target: 100000, months: 84, annualRate: 0 })!;
    const grown = requiredMonthly({ current: 12000, target: 100000, months: 84, annualRate: 0.06 })!;
    expect(grown).toBeLessThan(flat);
  });

  it("returns 0 when the target is already covered, null with no time left", () => {
    expect(requiredMonthly({ current: 5000, target: 3000, months: 12, annualRate: 0 })).toBe(0);
    expect(requiredMonthly({ current: 0, target: 3000, months: 0, annualRate: 0 })).toBeNull();
  });
});

describe("monthsToTarget", () => {
  it("counts the months at a given pace", () => {
    expect(monthsToTarget({ current: 600, target: 6500, monthly: 250, annualRate: 0 })).toBe(24);
  });

  it("is null when nothing is going in and nothing grows", () => {
    expect(monthsToTarget({ current: 100, target: 5000, monthly: 0, annualRate: 0 })).toBeNull();
  });

  it("is 0 when it is already there", () => {
    expect(monthsToTarget({ current: 5000, target: 5000, monthly: 100, annualRate: 0 })).toBe(0);
  });
});

describe("requiredRate", () => {
  it("is 0 when saving alone already gets there", () => {
    expect(requiredRate({ current: 1000, target: 3000, monthly: 200, months: 12 })).toBe(0);
  });

  it("finds the rate that closes a modest gap", () => {
    const rate = requiredRate({ current: 12000, target: 100000, monthly: 800, months: 84 })!;
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(0.3);
    // The rate it found should actually land on the target.
    expect(projectBalance({ current: 12000, monthly: 800, months: 84, annualRate: rate })).toBeGreaterThanOrEqual(99000);
  });

  it("Zuko's $2M in 4 years needs a rate no plan should assume", () => {
    // $520k saved, $6,200 a month, 48 months, target $2M — arithmetically ~26% a year.
    const rate = requiredRate({ current: 520000, target: 2000000, monthly: 6200, months: 48 })!;
    expect(rate).toBeGreaterThan(0.25);
    expect(rate).toBeGreaterThan(PLAUSIBLE_MAX_RATE);
  });

  it("returns null when even 30% a year wouldn't do it", () => {
    expect(requiredRate({ current: 0, target: 1000000, monthly: 100, months: 24 })).toBeNull();
  });
});

describe("waysToGetThere", () => {
  it("Aman: $6,500 for the World Cup — behind, but a small change fixes it", () => {
    const w = waysToGetThere({ target: 6500, current: 600, monthly: 100, months: 44, maxMonthly: 250 });
    expect(w.reachable).toBe(false);
    expect(w.projected).toBe(5000);
    expect(w.shortfall).toBe(1500);
    const saveMore = w.ways.find((x) => x.kind === "save_more")!;
    expect(saveMore.value).toBe(135);
    expect(saveMore.headline).toMatch(/135 a month/);
    expect(w.ways.some((x) => x.kind === "more_time")).toBe(true);
    // A goal this small and this close shouldn't be solved by hoping for returns, and isn't:
    // closing a $1,500 gap in 44 months at $100/month would take more than 12% a year.
    expect(w.ways.some((x) => x.kind === "let_it_grow")).toBe(false);
    expect(w.ways.filter((x) => x.kind === "adjust_goal").map((x) => x.headline).join(" ")).toMatch(
      /far beyond what any plan should count on/,
    );
  });

  it("says so plainly when the pace already works", () => {
    const w = waysToGetThere({ target: 3000, current: 1000, monthly: 200, months: 12 });
    expect(w.reachable).toBe(true);
    expect(w.ways).toHaveLength(1);
    expect(w.ways[0]!.kind).toBe("on_track");
    expect(w.ways[0]!.headline).toMatch(/On track/);
  });

  it("Zuko: $2M in four years needs ~26% a year, and the plan refuses to lean on it", () => {
    const w = waysToGetThere({ target: 2000000, current: 520000, monthly: 6200, months: 48, maxMonthly: 6200 });
    expect(w.reachable).toBe(false);
    // Never offered as a route.
    expect(w.ways.find((x) => x.kind === "let_it_grow")).toBeUndefined();
    const honest = w.ways.filter((x) => x.kind === "adjust_goal");
    expect(honest.map((h) => h.headline).join(" ")).toMatch(/far beyond what any plan should count on/);
    expect(honest.map((h) => h.headline).join(" ")).toMatch(/26% growth a year/);
    // It still names what IS reachable by then.
    expect(honest.some((h) => h.unit === "currency" && (h.value ?? 0) > 800000)).toBe(true);
  });

  it("flags when the required monthly is beyond what they have spare", () => {
    const w = waysToGetThere({ target: 60000, current: 9000, monthly: 400, months: 24, maxMonthly: 900 });
    const saveMore = w.ways.find((x) => x.kind === "save_more")!;
    expect(saveMore.headline).toMatch(/more than you have spare/);
  });

  it("with no deadline it answers with a duration", () => {
    const w = waysToGetThere({ target: 6500, current: 600, monthly: 250, months: null });
    expect(w.reachable).toBe(true);
    expect(w.ways[0]!.kind).toBe("on_track");
    expect(w.ways[0]!.value).toBe(24);
  });

  it("with no deadline and nothing going in, it says to start", () => {
    const w = waysToGetThere({ target: 6500, current: 600, monthly: 0, months: null });
    expect(w.reachable).toBe(false);
    expect(w.ways[0]!.kind).toBe("adjust_goal");
  });
});

describe("RATE_PRESETS", () => {
  it("describes volatility, never a product", () => {
    const banned = /etf|share|stock|bond|fund|crypto|index|portfolio|invest in/i;
    for (const p of RATE_PRESETS) {
      expect(`${p.label} ${p.note}`, p.label).not.toMatch(banned);
    }
    expect(RATE_PRESETS[0]!.rate).toBe(0);
    expect(RATE_PRESETS.at(-1)!.rate).toBeLessThanOrEqual(0.1);
  });
});
