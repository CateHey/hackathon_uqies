import { describe, expect, it } from "vitest";
import { layoutFreedomMap, type Orientation, type RegionBox } from "./freedom-map";
import { orderRegions } from "./order";
import { templatePlan } from "../rules/template";
import { computeMetrics } from "../rules/metrics";
import { FIXTURE_NOW, fixtures, type FixtureName } from "../fixtures";
import type { FreedomPlan } from "../schema/plan";

const planFor = (name: FixtureName): FreedomPlan => {
  const profile = fixtures[name];
  return templatePlan(profile, computeMetrics(profile, { now: FIXTURE_NOW }), { now: FIXTURE_NOW });
};

const overlaps = (a: RegionBox, b: RegionBox) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const inside = (box: RegionBox, x: number, y: number, tol = 0.6) =>
  x >= box.x - tol && x <= box.x + box.w + tol && y >= box.y - tol && y <= box.y + box.h + tol;

const endpoints = (path: string) => {
  const nums = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const x1 = nums[0] ?? NaN;
  const y1 = nums[1] ?? NaN;
  const x2 = nums[nums.length - 2] ?? NaN;
  const y2 = nums[nums.length - 1] ?? NaN;
  return { x1, y1, x2, y2 };
};

describe("layoutFreedomMap", () => {
  const names = Object.keys(fixtures) as FixtureName[];
  const orientations: Orientation[] = ["horizontal", "vertical"];

  for (const name of names) {
    for (const orientation of orientations) {
      it(`${name} / ${orientation}: no overlaps, bridges anchored, deterministic, in bounds`, () => {
        const plan = planFor(name);
        const layout = layoutFreedomMap(plan, { orientation });

        expect(layout.regions).toHaveLength(plan.regions.length);
        expect(layout.bridges).toHaveLength(plan.bridges.length);

        for (let i = 0; i < layout.regions.length; i++) {
          for (let j = i + 1; j < layout.regions.length; j++) {
            const a = layout.regions[i];
            const b = layout.regions[j];
            if (!a || !b) throw new Error("unreachable");
            expect(overlaps(a, b), `${a.id} overlaps ${b.id}`).toBe(false);
          }
        }

        const byId = new Map(layout.regions.map((r) => [r.id, r]));
        for (const bridge of layout.bridges) {
          const from = byId.get(bridge.from);
          const to = byId.get(bridge.to);
          if (!from || !to) throw new Error("missing box");
          const { x1, y1, x2, y2 } = endpoints(bridge.path);
          expect(inside(from, x1, y1), `${bridge.id} start`).toBe(true);
          expect(inside(to, x2, y2), `${bridge.id} end`).toBe(true);
        }

        for (const r of layout.regions) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(layout.width);
          expect(r.y + r.h).toBeLessThanOrEqual(layout.height);
        }

        expect(JSON.stringify(layoutFreedomMap(plan, { orientation }))).toBe(JSON.stringify(layout));
      });
    }
  }

  it("horizontal puts the spine on one row and the city at the far right", () => {
    const layout = layoutFreedomMap(planFor("sarah"), { orientation: "horizontal" });
    const spine = layout.regions.filter((r) => r.lane === "spine");
    expect(new Set(spine.map((r) => r.cy)).size).toBe(1);
    const city = layout.regions.find((r) => r.lane === "city");
    expect(city && Math.max(...layout.regions.map((r) => r.cx)) === city.cx).toBe(true);
  });

  it("vertical puts the spine on one column and the city at the bottom", () => {
    const layout = layoutFreedomMap(planFor("sarah"), { orientation: "vertical" });
    const spine = layout.regions.filter((r) => r.lane === "spine");
    expect(new Set(spine.map((r) => r.cx)).size).toBe(1);
    const city = layout.regions.find((r) => r.lane === "city");
    expect(city && Math.max(...layout.regions.map((r) => r.cy)) === city.cy).toBe(true);
  });

  it("skips bridges whose regions are missing", () => {
    const plan = planFor("sarah");
    const broken = { ...plan, bridges: [...plan.bridges, { ...plan.bridges[0]!, id: "x", to: "ghost" }] };
    const layout = layoutFreedomMap(broken, { orientation: "horizontal" });
    expect(layout.bridges).toHaveLength(plan.bridges.length);
  });

  it("handles a plan with no regions", () => {
    const plan = { ...planFor("sarah"), regions: [], bridges: [] };
    const layout = layoutFreedomMap(plan, { orientation: "vertical" });
    expect(layout.regions).toHaveLength(0);
    expect(layout.width).toBeGreaterThan(0);
  });
});

describe("orderRegions", () => {
  it("spine first, goals before exploration by relevance, city last", () => {
    const plan = planFor("sarah");
    const order = orderRegions(plan).map((r) => r.type);
    expect(order.slice(0, 3)).toEqual(["foundation", "security", "growth"]);
    expect(order[3]).toBe("personal_goal");
    expect(order[order.length - 1]).toBe("freedom_city");
    const explore = orderRegions(plan).filter((r) =>
      ["markets", "property", "business", "digital_assets"].includes(r.type),
    );
    for (let i = 1; i < explore.length; i++) {
      expect(explore[i - 1]!.relevance).toBeGreaterThanOrEqual(explore[i]!.relevance);
    }
  });

  it("keeps unknown-typed leftovers before the city", () => {
    const plan = planFor("sarah");
    const extra = { ...plan.regions[0]!, id: "extra", type: "growth" as const };
    const order = orderRegions({ regions: [...plan.regions, extra] });
    expect(order.map((r) => r.id)).toContain("extra");
    expect(order[order.length - 1]?.type).toBe("freedom_city");
  });
});
