import { fixtures, type FixtureName, type FreedomProfile } from "@free-me/core";

export const profiles: Record<FixtureName, FreedomProfile> = fixtures;
export const profileNames = Object.keys(profiles) as FixtureName[];

export interface GoldenFile {
  name: FixtureName;
  source: "ai" | "template";
  generatedAt: string;
  profile: FreedomProfile;
  metrics: import("@free-me/core").Metrics;
  plan: import("@free-me/core").FreedomPlan;
  usage?: import("@free-me/ai").Usage;
  attempts?: number;
  problems?: string[];
}
