import { BRAND, computeMetrics, formatMoney, personas as profiles, type DemoName } from "@free-me/core";

/** Display layer for the demo people — the numbers come from `personas` in @free-me/core. */
export interface Persona {
  key: DemoName;
  name: string;
  emoji: string;
  headline: string;
  story: string;
  email: string;
}

export const PERSONAS: Persona[] = [
  {
    key: "aman",
    name: "Aman",
    emoji: "⚽",
    headline: "20 · casual work · World Cup 2030",
    story: "$6,500 for the trip, $250 spare a month, and four years. The smallest goal here, and the tightest budget.",
    email: `aman@demo.${BRAND.domain}`,
  },
  {
    key: "vinuy",
    name: "Vinuy",
    emoji: "🏠",
    headline: "23 · early career · deposit by 30",
    story: "$100,000 for a 10% deposit, seven years, and a solid surplus. Close — but not quite, at today's pace.",
    email: `vinuy@demo.${BRAND.domain}`,
  },
  {
    key: "camille",
    name: "Camille",
    emoji: "🎓",
    headline: "26 · paying for a master's in cash",
    story: "$60,000 by 2030 without borrowing. The plan says what it actually takes, and what it doesn't.",
    email: `camille@demo.${BRAND.domain}`,
  },
  {
    key: "mike",
    name: "Mike",
    emoji: "🚀",
    headline: "29 · founder · $1M by 35 and a second property",
    story: "Two big goals competing for the same dollars — and one of them isn't a savings goal at all.",
    email: `mike@demo.${BRAND.domain}`,
  },
  {
    key: "zuko",
    name: "Zuko",
    emoji: "📈",
    headline: "38 · high earner · $2M by 42",
    story: "$520,000 saved and $6,200 a month spare. The number still doesn't work — and the app says so.",
    email: `zuko@demo.${BRAND.domain}`,
  },
];

/** Three quick facts for a persona card, straight from the rules engine. */
export function personaFacts(key: DemoName): string[] {
  const profile = profiles[key];
  const m = computeMetrics(profile);
  const money = (n: number) => formatMoney(n, profile.currency);
  const goal = profile.goals[0];
  return [
    `${money(profile.savings)} saved`,
    m.surplus > 0 ? `${money(m.surplus)}/month spare` : "No monthly surplus",
    goal ? `${goal.label}${goal.targetAmount ? ` · ${money(goal.targetAmount)}` : ""}` : "",
  ].filter(Boolean);
}
