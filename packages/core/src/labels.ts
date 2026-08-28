import type { RegionType } from "./schema/plan";

/**
 * Plain-language caption for every kind of place on the map.
 *
 * Explore titles are evocative on purpose ("Markets District", "Digital Frontier"), and the
 * model invents its own names. These captions sit underneath them so nobody has to guess
 * what a region actually covers — the same words in both renderers and in a demo out loud.
 */
export const REGION_PLAIN_LABEL: Record<RegionType, string> = {
  foundation: "Budgeting & spending",
  security: "Emergency fund & debt",
  growth: "Saving habit & income",
  markets: "Shares, ETFs & funds",
  property: "Property & deposits",
  business: "Side income & business",
  digital_assets: "Crypto & volatility",
  personal_goal: "Your goal",
  freedom_city: "Your destination",
};

export function regionPlainLabel(type: RegionType): string {
  return REGION_PLAIN_LABEL[type];
}

/** The short form used where space is tight (map legend, chips). */
export const REGION_SHORT_LABEL: Record<RegionType, string> = {
  foundation: "Budgeting",
  security: "Safety net",
  growth: "Saving",
  markets: "Shares & funds",
  property: "Property",
  business: "Side income",
  digital_assets: "Crypto",
  personal_goal: "Your goals",
  freedom_city: "Destination",
};
