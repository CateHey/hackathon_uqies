import { personaNames, personas, type FreedomProfile, type PersonaName } from "@free-me/core";

/** The golden plans back the demo, so they are generated for the people the demo shows. */
export const profiles: Record<PersonaName, FreedomProfile> = personas;
export const profileNames = personaNames;

export interface GoldenFile {
  name: PersonaName;
  source: "ai" | "template";
  generatedAt: string;
  profile: FreedomProfile;
  metrics: import("@free-me/core").Metrics;
  plan: import("@free-me/core").FreedomPlan;
  usage?: import("@free-me/ai").Usage;
  attempts?: number;
  problems?: string[];
}
