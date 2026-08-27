import type { FreedomPlan, Region, RegionType } from "../schema/plan";

/** The linear part of every journey. */
export const SPINE: readonly RegionType[] = ["foundation", "security", "growth"];
export const EXPLORATION: readonly RegionType[] = ["markets", "property", "business", "digital_assets"];

/**
 * Canonical display order used by BOTH renderers: spine, then personal goals,
 * then exploration branches by relevance, then the Freedom City.
 */
export function orderRegions(plan: Pick<FreedomPlan, "regions">): Region[] {
  const byType = (t: RegionType) => plan.regions.filter((r) => r.type === t);
  const spine = SPINE.flatMap(byType);
  const goals = byType("personal_goal").sort(
    (a, b) => b.relevance - a.relevance || a.id.localeCompare(b.id),
  );
  const explore = EXPLORATION.flatMap(byType).sort(
    (a, b) =>
      b.relevance - a.relevance ||
      EXPLORATION.indexOf(a.type) - EXPLORATION.indexOf(b.type) ||
      a.id.localeCompare(b.id),
  );
  const city = byType("freedom_city");
  const known = new Set([...spine, ...goals, ...explore, ...city].map((r) => r.id));
  const rest = plan.regions.filter((r) => !known.has(r.id));
  return [...spine, ...goals, ...explore, ...rest, ...city];
}

export function isSpine(type: RegionType): boolean {
  return SPINE.includes(type);
}
