/**
 * Structural expectations for every golden plan. Runs against evals/golden/*.json —
 * never against the API — so it is free and deterministic. Regenerate goldens with
 * `pnpm eval:golden` (real model) or `pnpm eval:template` (no AI).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DISCLAIMER, FreedomPlan, type PersonaName } from "@free-me/core";
import { lessonIds } from "@free-me/content";
import { postValidate } from "@free-me/ai";
import { profileNames } from "./profiles";
import type { GoldenFile } from "./profiles";

const goldenDir = path.resolve(import.meta.dirname, "golden");
const load = (name: PersonaName): GoldenFile | null => {
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

describe("person-specific expectations", () => {
  it.runIf(load("aman"))("Aman: the World Cup gets its own place, and the tone stays encouraging", () => {
    const g = load("aman")!;
    const trip = g.plan.regions.find((r) => r.goalId === "g-worldcup");
    expect(trip?.type).toBe("personal_goal");
    expect(byType(g, "personal_goal").length).toBeGreaterThanOrEqual(1);
    // A student on casual shifts starts at the beginning, not in the markets.
    expect(["foundation", "security"]).toContain(g.plan.currentPriorityRegionId);
    expect(region(g, "property")?.relevance).toBeLessThanOrEqual(2);
    expect(g.plan.freedomCity.title).toMatch(/^🌴/);
    for (const s of g.plan.steps) expect(s.title).not.toMatch(/\b(impossible|hopeless|never)\b/i);
  });

  it.runIf(load("vinuy"))("Vinuy: the deposit is the point, and it carries the real target", () => {
    const g = load("vinuy")!;
    const property = region(g, "property");
    expect(property?.relevance).toBeGreaterThanOrEqual(4);
    expect(property?.goalId).toBe("g-deposit");
    const deposit = g.plan.steps.find((s) => s.regionId === "property" && s.kind === "save" && s.metric);
    expect(deposit?.metric?.target).toBe(100000);
    expect(g.plan.freedomCity.title).toMatch(/^🏡/);
  });

  it.runIf(load("camille"))("Camille: the master's has its own region and an honest monthly figure", () => {
    const g = load("camille")!;
    const masters = g.plan.regions.find((r) => r.goalId === "g-masters");
    expect(masters?.type).toBe("personal_goal");
    const save = g.plan.steps.find((s) => s.regionId === masters?.id && s.kind === "save" && s.metric);
    expect(save?.metric?.target).toBe(60000);
    // She is behind on this one; the plan must not pretend otherwise.
    const projection = g.metrics.goalProjections.find((p) => p.goalId === "g-masters");
    expect(projection?.onTrack).toBe(false);
    expect(save?.why.length ?? 0).toBeGreaterThan(30);
  });

  it.runIf(load("mike"))("Mike: two goals that compete, and a bridge that says so", () => {
    const g = load("mike")!;
    expect(region(g, "property")?.goalId).toBe("g-apartment");
    expect(region(g, "markets")?.goalId).toBe("g-million");
    expect(region(g, "markets")?.relevance).toBeGreaterThanOrEqual(4);
    // The trade-off between the venture money and the deposit is drawn, not hidden.
    expect(g.plan.bridges.some((b) => b.from === "markets" && b.to === "property")).toBe(true);
    expect(region(g, "foundation")?.status).toBe("complete");
  });

  it.runIf(load("zuko"))("Zuko: a stretch target, met with figures rather than cheerleading", () => {
    const g = load("zuko")!;
    expect(region(g, "markets")?.goalId).toBe("g-two-million");
    expect(["growth", "markets", "security"]).toContain(g.plan.currentPriorityRegionId);
    expect(region(g, "foundation")?.status).toBe("complete");
    expect(region(g, "security")?.status).toBe("complete");
    // No step may promise the target; it may only describe what saving does.
    for (const s of g.plan.steps) expect(s.why).not.toMatch(/\b(guaranteed|certain to|will reach)\b/i);
  });
});
