import { describe, expect, it } from "vitest";
import { TEMPLATE_LESSON_IDS, templatePlan } from "./template";
import { computeMetrics } from "./metrics";
import { FIXTURE_NOW, fixtures, type FixtureName } from "../fixtures";
import { FreedomPlan } from "../schema/plan";

const planFor = (name: FixtureName) => {
  const profile = fixtures[name];
  return templatePlan(profile, computeMetrics(profile, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });
};
const region = (plan: FreedomPlan, id: string) => {
  const r = plan.regions.find((x) => x.id === id);
  if (!r) throw new Error(`missing region ${id}`);
  return r;
};

describe("templatePlan — structural guarantees for every fixture", () => {
  for (const name of Object.keys(fixtures) as FixtureName[]) {
    it(`${name}: is a valid, internally consistent FreedomPlan`, () => {
      const plan = planFor(name);
      expect(FreedomPlan.safeParse(plan).success).toBe(true);
      expect(plan.source).toBe("template");
      expect(plan.version).toBe(1);

      const regionIds = new Set(plan.regions.map((r) => r.id));
      const stepIds = new Set(plan.steps.map((s) => s.id));
      expect(regionIds.size).toBe(plan.regions.length);
      expect(stepIds.size).toBe(plan.steps.length);
      for (const s of plan.steps) expect(regionIds.has(s.regionId)).toBe(true);
      for (const r of plan.regions) {
        for (const id of r.stepIds) expect(stepIds.has(id)).toBe(true);
        for (const id of r.lessonIds) expect(TEMPLATE_LESSON_IDS).toContain(id);
        expect(r.relevance).toBeGreaterThanOrEqual(1);
        expect(r.relevance).toBeLessThanOrEqual(5);
        expect(r.progress).toBeGreaterThanOrEqual(0);
        expect(r.progress).toBeLessThanOrEqual(1);
        expect(r.why.length).toBeGreaterThan(20);
      }
      for (const b of plan.bridges) {
        expect(regionIds.has(b.from)).toBe(true);
        expect(regionIds.has(b.to)).toBe(true);
        for (const id of b.requiredStepIds) expect(stepIds.has(id)).toBe(true);
        expect(b.why.length).toBeGreaterThan(10);
        expect(b.relationship.length).toBeGreaterThan(10);
      }
      for (const s of plan.steps) {
        expect(s.why.length).toBeGreaterThan(10);
        if (s.metric) expect(s.metric.target).toBeGreaterThan(0);
      }
      expect(regionIds.has(plan.currentPriorityRegionId)).toBe(true);
      expect(stepIds.has(plan.nextStepId)).toBe(true);
      expect(plan.regions.filter((r) => r.status === "active")).toHaveLength(1);
      expect(plan.disclaimers.length).toBeGreaterThan(0);
      expect(plan.freedomCity.pillars).toContain("Financial security");
      expect(plan.profileSummary.tags).toHaveLength(5);
    });
  }
});

describe("templatePlan — personalisation", () => {
  it("sarah: beginner starts at Foundation, Japan gets its own region, property is a low priority", () => {
    const plan = planFor("sarah");
    expect(plan.currentPriorityRegionId).toBe("foundation");
    const japan = region(plan, "goal-g-japan");
    expect(japan.type).toBe("personal_goal");
    expect(japan.goalId).toBe("g-japan");
    expect(japan.exploreTitle).toBe("Trip to Japan Destination");
    const save = plan.steps.find((s) => s.regionId === "goal-g-japan");
    expect(save?.metric?.target).toBe(6000);
    expect(save?.why).toMatch(/behind/);
    expect(region(plan, "property").relevance).toBeLessThanOrEqual(2);
    expect(region(plan, "markets").relevance).toBeGreaterThanOrEqual(3);
    expect(plan.freedomCity.title).toBe("🌴 Freedom City");
    expect(plan.profileSummary.tags[0]).toBe("🎓 Student");
    expect(plan.profileSummary.tags[1]).toBe("🌍 Travel-focused");
  });

  it("userB: foundations already done, priority is growth, property is central", () => {
    const plan = planFor("userB");
    expect(plan.currentPriorityRegionId).toBe("growth");
    expect(region(plan, "foundation").status).toBe("complete");
    expect(region(plan, "security").status).toBe("complete");
    expect(region(plan, "property").relevance).toBe(5);
    expect(region(plan, "property").goalId).toBe("g-home");
    const deposit = plan.steps.find((s) => s.id === "property.deposit");
    expect(deposit?.metric?.current).toBe(36500);
    expect(deposit?.metric?.target).toBe(120000);
    expect(deposit?.status).toBe("in_progress");
    expect(deposit?.why).toMatch(/inside your 28-month deadline/);
    expect(region(plan, "markets").goalId).toBe("g-invest");
    expect(plan.bridges.some((b) => b.id === "markets->property")).toBe(true);
    expect(plan.regions.filter((r) => r.type === "personal_goal")).toHaveLength(0);
    expect(plan.freedomCity.title).toBe("🏡 Freedom City");
  });

  it("debtHeavy: security first, with a debt step and lesson", () => {
    const plan = planFor("debtHeavy");
    expect(plan.currentPriorityRegionId).toBe("security");
    expect(plan.steps.some((s) => s.id === "security.debt-plan")).toBe(true);
    expect(region(plan, "security").lessonIds).toContain("understanding-debt");
    expect(region(plan, "security").why).toMatch(/debt/);
    expect(region(plan, "digital_assets").why).toMatch(/Higher volatility/);
    expect(plan.nextStepId).toBe("security.emergency-buffer");
  });

  it("zeroIncome: buffer already covered, honest copy about no surplus", () => {
    const plan = planFor("zeroIncome");
    expect(plan.currentPriorityRegionId).toBe("foundation");
    expect(plan.steps.find((s) => s.id === "security.emergency-buffer")?.status).toBe("done");
    expect(plan.steps.find((s) => s.id === "growth.saving-target")?.why).toMatch(/first \$50/);
    expect(plan.steps.find((s) => s.id === "goal-g-course.save")?.why).toMatch(/no monthly surplus/);
    expect(plan.steps.find((s) => s.id === "foundation.build-budget")?.why).toMatch(/close the gap/);
    expect(region(plan, "growth").why).toMatch(/capacity/);
  });

  it("userA: a goal without a date gets an open-ended saving step", () => {
    const plan = planFor("userA");
    const save = plan.steps.find((s) => s.id === "goal-g-japan.save");
    expect(save?.description).toMatch(/Build towards/);
    expect(save?.why).toMatch(/about 40 months/);
  });

  it("a goal without a target amount asks for a number", () => {
    const profile = { ...fixtures.userA, goals: [{ id: "g-x", type: "other" as const, label: "A boat", priority: 1 }] };
    const plan = templatePlan(profile, computeMetrics(profile, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });
    expect(plan.steps.find((s) => s.id === "goal-g-x.define")?.title).toBe("Put a number on A boat");
    expect(region(plan, "goal-g-x").exploreTitle).toBe("A boat Landmark");
    expect(plan.freedomCity.title).toBe("🕊️ Freedom City");
  });

  it("business goals and high risk raise business and digital relevance", () => {
    const profile = {
      ...fixtures.userB,
      risk: "high" as const,
      knowledge: "advanced" as const,
      goals: [{ id: "g-biz", type: "business" as const, label: "Launch a studio", priority: 1 }],
    };
    const plan = templatePlan(profile, computeMetrics(profile, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });
    expect(region(plan, "business").relevance).toBe(5);
    expect(region(plan, "business").goalId).toBe("g-biz");
    expect(region(plan, "digital_assets").relevance).toBe(3);
    expect(region(plan, "markets").relevance).toBe(5);
    expect(region(plan, "property").why).toMatch(/capacity/);
    expect(plan.freedomCity.title).toBe("🚀 Freedom City");
  });

  it("a home goal without a target amount still gets a learning step", () => {
    const profile = {
      ...fixtures.userB,
      savings: 1000,
      goals: [{ id: "g-home", type: "home" as const, label: "A place of my own", priority: 1 }],
    };
    const plan = templatePlan(profile, computeMetrics(profile, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });
    expect(plan.steps.some((s) => s.id === "property.learn-deposit")).toBe(true);
    expect(plan.currentPriorityRegionId).toBe("security");
  });

  it("zero expenses drops the emergency metric instead of dividing by zero", () => {
    const profile = { ...fixtures.userB, monthlyExpenses: 0 };
    const plan = templatePlan(profile, computeMetrics(profile, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });
    const buffer = plan.steps.find((s) => s.id === "security.emergency-buffer");
    expect(buffer?.metric).toBeUndefined();
    expect(buffer?.status).toBe("done");
  });

  it("uses the real clock when no `now` is given", () => {
    const plan = templatePlan(fixtures.sarah, computeMetrics(fixtures.sarah));
    expect(Math.abs(Date.now() - new Date(plan.generatedAt).getTime())).toBeLessThan(5000);
  });
});
