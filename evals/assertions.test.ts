/**
 * Structural expectations for every golden plan. Runs against evals/golden/*.json —
 * never against the API — so it is free and deterministic. Regenerate goldens with
 * `pnpm eval:golden` (real model) or `pnpm eval:template` (no AI).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DISCLAIMER, FreedomPlan, type FixtureName } from "@free-me/core";
import { lessonIds } from "@free-me/content";
import { postValidate } from "@free-me/ai";
import { profileNames } from "./profiles";
import type { GoldenFile } from "./profiles";

const goldenDir = path.resolve(import.meta.dirname, "golden");
const load = (name: FixtureName): GoldenFile | null => {
  const file = path.join(goldenDir, `${name}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as GoldenFile) : null;
};
const region = (g: GoldenFile, id: string) => g.plan.regions.find((r) => r.id === id);
const byType = (g: GoldenFile, type: string) => g.plan.regions.filter((r) => r.type === type);

const available = profileNames.filter((n) => load(n));
if (available.length === 0) {
  console.warn("No golden plans found in evals/golden — run `pnpm eval:template` or `pnpm eval:golden`.");
}

describe.each(available)("golden plan: %s", (name) => {
  const g = load(name)!;

  it("is a valid FreedomPlan that passes post-validation against the real catalogue", () => {
    expect(FreedomPlan.safeParse(g.plan).success).toBe(true);
    expect(postValidate(g.plan, g.metrics, lessonIds)).toEqual([]);
  });

  it("has exactly one active region and a next step inside it", () => {
    const active = g.plan.regions.filter((r) => r.status === "active");
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe(g.plan.currentPriorityRegionId);
    const next = g.plan.steps.find((s) => s.id === g.plan.nextStepId);
    expect(next?.regionId).toBe(g.plan.currentPriorityRegionId);
    expect(next?.status).not.toBe("done");
  });

  it("explains itself: every region, bridge and step has a real why", () => {
    for (const r of g.plan.regions) expect(r.why.length, `region ${r.id}`).toBeGreaterThan(30);
    for (const b of g.plan.bridges) expect(b.why.length, `bridge ${b.id}`).toBeGreaterThan(20);
    for (const s of g.plan.steps) expect(s.why.length, `step ${s.id}`).toBeGreaterThan(20);
  });

  it("carries the disclaimer, a 5-tag profile summary and a Freedom City with pillars", () => {
    expect(g.plan.disclaimers).toContain(DISCLAIMER);
    expect(g.plan.profileSummary.tags).toHaveLength(5);
    expect(g.plan.profileSummary.headline.split(/\s+/).length).toBeLessThanOrEqual(10);
    expect(g.plan.freedomCity.pillars.length).toBeGreaterThanOrEqual(2);
    expect(g.plan.freedomCity.pillars).toContain("Financial security");
  });

  it("uses the rules-engine figures for saving metrics", () => {
    const buffer = g.plan.steps.find((s) => s.regionId === "security" && s.kind === "save" && s.metric);
    if (buffer?.metric && g.metrics.emergencyTarget > 0) {
      expect(buffer.metric.target).toBe(g.metrics.emergencyTarget);
      expect(buffer.metric.current).toBeLessThanOrEqual(g.metrics.emergencyTarget);
    }
    for (const p of g.metrics.goalProjections) {
      const goalRegion = g.plan.regions.find((r) => r.goalId === p.goalId);
      const save = goalRegion && g.plan.steps.find((s) => s.regionId === goalRegion.id && s.kind === "save" && s.metric);
      if (save?.metric && p.targetAmount) {
        expect(save.metric.target).toBe(p.targetAmount);
        expect(save.metric.current).toBe(p.funded);
      }
    }
  });
});

describe("profile-specific expectations", () => {
  it.runIf(load("sarah"))("sarah: Japan has a region, property is not a priority, starts in the spine", () => {
    const g = load("sarah")!;
    const japan = g.plan.regions.find((r) => r.goalId === "g-japan");
    expect(japan?.type).toBe("personal_goal");
    expect(region(g, "property")?.relevance).toBeLessThanOrEqual(2);
    expect(region(g, "markets")?.relevance).toBeGreaterThanOrEqual(3);
    expect(["foundation", "security"]).toContain(g.plan.currentPriorityRegionId);
    expect(g.plan.freedomCity.title).toMatch(/^🌴/);
    expect(byType(g, "personal_goal").length).toBeGreaterThanOrEqual(1);
  });

  it.runIf(load("userA"))("userA: Japan region, beginner start", () => {
    const g = load("userA")!;
    expect(g.plan.regions.find((r) => r.goalId === "g-japan")?.type).toBe("personal_goal");
    expect(["foundation", "security"]).toContain(g.plan.currentPriorityRegionId);
  });

  it.runIf(load("userB"))("userB: property is central, markets carries the investing goal, trade-off bridge exists", () => {
    const g = load("userB")!;
    expect(region(g, "property")?.relevance).toBeGreaterThanOrEqual(4);
    expect(region(g, "property")?.goalId).toBe("g-home");
    expect(region(g, "markets")?.goalId).toBe("g-invest");
    expect(["growth", "property", "security"]).toContain(g.plan.currentPriorityRegionId);
    expect(g.plan.bridges.some((b) => b.from === "markets" && b.to === "property")).toBe(true);
    expect(region(g, "foundation")?.status).toBe("complete");
  });

  it.runIf(load("debtHeavy"))("debtHeavy: security first, with a debt step and lesson", () => {
    const g = load("debtHeavy")!;
    expect(g.plan.currentPriorityRegionId).toBe("security");
    const securitySteps = g.plan.steps.filter((s) => s.regionId === "security");
    expect(securitySteps.some((s) => /debt/i.test(`${s.title} ${s.why}`))).toBe(true);
    expect(region(g, "security")?.lessonIds).toContain("understanding-debt");
    expect(region(g, "digital_assets")?.relevance).toBeLessThanOrEqual(2);
  });

  it.runIf(load("zeroIncome"))("zeroIncome: no impossible targets, encouraging tone", () => {
    const g = load("zeroIncome")!;
    for (const s of g.plan.steps) {
      if (s.metric) {
        expect(Number.isFinite(s.metric.target)).toBe(true);
        expect(s.metric.target).toBeGreaterThan(0);
      }
      expect(s.title).not.toMatch(/\b(impossible|hopeless|never)\b/i);
    }
    expect(["foundation", "security", "growth"]).toContain(g.plan.currentPriorityRegionId);
    expect(g.plan.steps.find((s) => s.regionId === "security" && s.kind === "save")?.status).toBe("done");
  });
});
