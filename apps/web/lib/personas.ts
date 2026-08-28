import { computeMetrics, fixtures, formatMoney, type DemoName } from "@free-me/core";

/** Display layer for the demo personas — the numbers come from the fixtures in @free-me/core. */
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
    key: "sarah",
    name: "Sarah",
    emoji: "🎓",
    headline: "21 · student · Japan in 18 months",
    story: "Part-time job, $800 saved, wants to travel without worrying about money — and to be financially independent one day.",
    email: "sarah@demo.free-me.app",
  },
  {
    key: "userA",
    name: "Liam",
    emoji: "🎒",
    headline: "19 · student · $300 to his name",
    story: "Just started uni, tiny surplus, big appetite for a trip. The map starts at the very beginning.",
    email: "liam@demo.free-me.app",
  },
  {
    key: "userB",
    name: "Priya",
    emoji: "💼",
    headline: "29 · professional · first home",
    story: "$50k saved, strong surplus, buffer already done. Property is central and investing competes for the same dollars.",
    email: "priya@demo.free-me.app",
  },
  {
    key: "debtHeavy",
    name: "Marco",
    emoji: "🧾",
    headline: "26 · early career · $60k of debt",
    story: "Steady income but debt bigger than a year of pay. Security comes first, and the map says why.",
    email: "marco@demo.free-me.app",
  },
  {
    key: "zeroIncome",
    name: "Ana",
    emoji: "📚",
    headline: "20 · student · no income yet",
    story: "Decent savings, an exchange semester to fund, nothing coming in each month — a plan that stays honest and encouraging.",
    email: "ana@demo.free-me.app",
  },
];

/** Three quick facts for a persona card, straight from the rules engine. */
export function personaFacts(key: DemoName): string[] {
  const profile = fixtures[key];
  const m = computeMetrics(profile);
  const money = (n: number) => formatMoney(n, profile.currency);
  const goal = profile.goals[0];
  return [
    `${money(profile.savings)} saved`,
    m.surplus > 0 ? `${money(m.surplus)}/month surplus` : "No monthly surplus",
    goal ? `Goal: ${goal.label}${goal.targetAmount ? ` (${money(goal.targetAmount)})` : ""}` : "",
  ].filter(Boolean);
}
