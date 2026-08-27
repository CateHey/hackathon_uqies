import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  FIXTURE_NOW,
  fixtures,
  TEMPLATE_LESSON_IDS,
  templatePlan,
  type FixtureName,
  type FreedomPlan,
} from "@free-me/core";
import { assertValid, findBannedTerms, postValidate, ValidationError } from "./validate";

const build = (name: FixtureName = "sarah") => {
  const profile = fixtures[name];
  const metrics = computeMetrics(profile, { now: FIXTURE_NOW });
  const plan = templatePlan(profile, metrics, { now: FIXTURE_NOW });
  return { plan, metrics };
};
const check = (plan: FreedomPlan, name: FixtureName = "sarah") =>
  postValidate(plan, computeMetrics(fixtures[name], { now: FIXTURE_NOW }), TEMPLATE_LESSON_IDS);
const region = (plan: FreedomPlan, id: string) => plan.regions.find((r) => r.id === id)!;

describe("postValidate", () => {
  it("accepts every template plan", () => {
    for (const name of Object.keys(fixtures) as FixtureName[]) {
      const { plan, metrics } = build(name);
      expect(postValidate(plan, metrics, TEMPLATE_LESSON_IDS)).toEqual([]);
    }
  });

  it("flags a step pointing at an unknown region", () => {
    const { plan } = build();
    const bad = { ...plan, steps: [...plan.steps, { ...plan.steps[0]!, id: "x.y", regionId: "ghost" }] };
    expect(check(bad).join("\n")).toMatch(/step x\.y: unknown regionId ghost/);
  });

  it("flags unknown lesson ids", () => {
    const { plan } = build();
    const bad = { ...plan, regions: plan.regions.map((r) => (r.id === "markets" ? { ...r, lessonIds: ["nope"] } : r)) };
    expect(check(bad).join("\n")).toMatch(/region markets: unknown lessonId nope/);
  });

  it("flags relevance and progress out of range", () => {
    const { plan } = build();
    const bad = {
      ...plan,
      regions: plan.regions.map((r) => (r.id === "markets" ? { ...r, relevance: 7, progress: 1.5 } : r)),
    };
    const problems = check(bad).join("\n");
    expect(problems).toMatch(/relevance 7/);
    expect(problems).toMatch(/progress 1.5/);
  });

  it("flags a cycle", () => {
    const { plan } = build();
    const bad = {
      ...plan,
      bridges: [...plan.bridges, { ...plan.bridges[0]!, id: "loop", from: "freedom_city", to: "foundation" }],
    };
    expect(check(bad)).toContain("bridges form a cycle");
  });

  it("flags regions unreachable from foundation", () => {
    const { plan } = build();
    const bad = { ...plan, bridges: plan.bridges.filter((b) => b.to !== "markets") };
    expect(check(bad).join("\n")).toMatch(/region markets is not reachable/);
  });

  it("flags a next step outside the priority region", () => {
    const { plan } = build();
    const bad = { ...plan, nextStepId: "growth.saving-target" };
    expect(check(bad).join("\n")).toMatch(/nextStepId growth.saving-target is not in the priority region foundation/);
    expect(check({ ...plan, nextStepId: "nope" }).join("\n")).toMatch(/nextStepId nope does not exist/);
    expect(check({ ...plan, currentPriorityRegionId: "nope" }).join("\n")).toMatch(/currentPriorityRegionId nope/);
  });

  it("flags advice and product language anywhere in the plan", () => {
    const { plan } = build();
    const bad = {
      ...plan,
      regions: plan.regions.map((r) =>
        r.id === "markets" ? { ...r, why: "You should buy an index fund from Vanguard this month." } : r,
      ),
      freedomCity: { ...plan.freedomCity, narrative: "Load up on bitcoin." },
    };
    const problems = check(bad).join("\n");
    expect(problems).toMatch(/region markets\.why: contains advice/);
    expect(problems).toMatch(/freedomCity\.narrative/);
  });

  it("flags duplicate ids and missing whys", () => {
    const { plan } = build();
    const dup = { ...plan, steps: [...plan.steps, plan.steps[0]!] };
    expect(check(dup).join("\n")).toMatch(/duplicate step ids/);
    const noWhy = { ...plan, steps: plan.steps.map((s, i) => (i === 0 ? { ...s, why: "" } : s)) };
    expect(check(noWhy).join("\n")).toMatch(/missing why/);
  });

  it("flags stepIds inconsistencies", () => {
    const { plan } = build();
    const missing = {
      ...plan,
      regions: plan.regions.map((r) => (r.id === "foundation" ? { ...r, stepIds: r.stepIds.slice(1) } : r)),
    };
    expect(check(missing).join("\n")).toMatch(/is not listed in stepIds/);
    const stolen = {
      ...plan,
      regions: plan.regions.map((r) => (r.id === "growth" ? { ...r, stepIds: [...r.stepIds, "foundation.build-budget"] } : r)),
    };
    expect(check(stolen).join("\n")).toMatch(/belongs to another region/);
    const unknown = {
      ...plan,
      regions: plan.regions.map((r) => (r.id === "growth" ? { ...r, stepIds: [...r.stepIds, "ghost"] } : r)),
    };
    expect(check(unknown).join("\n")).toMatch(/references unknown step ghost/);
  });

  it("flags a missing spine region and extra cities", () => {
    const { plan } = build();
    const noGrowth = { ...plan, regions: plan.regions.filter((r) => r.id !== "growth") };
    expect(check(noGrowth).join("\n")).toMatch(/expected exactly one growth region, found 0/);
    const twoCities = { ...plan, regions: [...plan.regions, { ...region(plan, "freedom_city"), id: "city2" }] };
    expect(check(twoCities).join("\n")).toMatch(/expected exactly one freedom_city region, found 2/);
  });

  it("flags bad metrics and implausible targets", () => {
    const { plan } = build();
    const bad = {
      ...plan,
      steps: plan.steps.map((s) =>
        s.id === "security.emergency-buffer" ? { ...s, metric: { ...s.metric!, target: 0, current: -1 } } : s,
      ),
    };
    const problems = check(bad).join("\n");
    expect(problems).toMatch(/metric target must be > 0/);
    expect(problems).toMatch(/metric current must be >= 0/);
    const huge = {
      ...plan,
      steps: plan.steps.map((s) =>
        s.id === "security.emergency-buffer" ? { ...s, metric: { ...s.metric!, target: 1e9 } } : s,
      ),
    };
    expect(check(huge).join("\n")).toMatch(/implausible/);
    const badOrder = { ...plan, steps: plan.steps.map((s, i) => (i === 0 ? { ...s, order: 0 } : s)) };
    expect(check(badOrder).join("\n")).toMatch(/order must be a positive integer/);
  });

  it("flags bad bridges", () => {
    const { plan } = build();
    const bad = {
      ...plan,
      bridges: [
        ...plan.bridges,
        { ...plan.bridges[0]!, id: "self", from: "growth", to: "growth", requiredStepIds: ["ghost"], why: "", relationship: "" },
        { ...plan.bridges[0]!, id: "dangling", from: "growth", to: "nowhere" },
      ],
    };
    const problems = check(bad).join("\n");
    expect(problems).toMatch(/bridge self: from and to are the same region/);
    expect(problems).toMatch(/bridge self: unknown required step ghost/);
    expect(problems).toMatch(/bridge self: missing why/);
    expect(problems).toMatch(/bridge self: missing relationship/);
    expect(problems).toMatch(/bridge dangling: unknown to nowhere/);
  });

  it("assertValid throws a ValidationError listing the problems", () => {
    const { plan, metrics } = build();
    expect(() => assertValid(plan, metrics, TEMPLATE_LESSON_IDS)).not.toThrow();
    const bad = { ...plan, nextStepId: "nope" };
    try {
      assertValid(bad, metrics, TEMPLATE_LESSON_IDS);
      throw new Error("did not throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).problems.length).toBeGreaterThan(0);
      expect((e as ValidationError).message).toMatch(/nextStepId nope/);
    }
  });
});

describe("findBannedTerms", () => {
  it("catches advice phrasing, providers, coins and tickers", () => {
    expect(findBannedTerms("You should buy shares now")).toHaveLength(1);
    expect(findBannedTerms("open an account with CommSec")).toHaveLength(1);
    expect(findBannedTerms("put it all in Bitcoin")).toHaveLength(1);
    expect(findBannedTerms("look at VAS.AX or $VOO or NASDAQ:AAPL")).toHaveLength(3);
    expect(findBannedTerms("guaranteed returns of 12%")).toHaveLength(1);
    expect(findBannedTerms("you can't lose with property")).toHaveLength(1);
  });

  it("ignores ordinary educational text", () => {
    expect(findBannedTerms("An ETF is a collection of investments grouped together.")).toEqual([]);
    expect(findBannedTerms("Your emergency buffer covers 2 months of expenses.")).toEqual([]);
    expect(findBannedTerms("Diversification spreads risk across many investments.")).toEqual([]);
  });
});
