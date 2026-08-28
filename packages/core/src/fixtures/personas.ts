import type { FreedomProfile } from "../schema/profile";

/**
 * The five demo people shown in the product. Deliberately unalike: a casual-work student
 * saving for a World Cup, a graduate chasing a house deposit, someone paying for a master's
 * in cash, a founder with two large goals, and a high earner whose target is a stretch.
 *
 * The test fixtures in ./index.ts stay as they are — tests assert exact figures against them.
 * Financial details beyond each stated goal are illustrative and internally consistent.
 */

/** 20 · casual shifts · the 2030 World Cup. The smallest goal here, and the tightest budget. */
export const aman: FreedomProfile = {
  freedomStatement: "Be in the stands for the 2030 World Cup without borrowing to get there.",
  age: 20,
  country: "AU",
  currency: "AUD",
  lifeStage: "student",
  monthlyIncome: 1400,
  monthlyExpenses: 1150,
  savings: 600,
  debt: 0,
  goals: [
    {
      id: "g-worldcup",
      type: "travel",
      label: "World Cup 2030",
      targetAmount: 6500,
      targetDate: "2030-06-01",
      priority: 1,
    },
  ],
  knowledge: "beginner",
  risk: "conservative",
  priorities: "I work casual shifts, so some months are much better than others.",
};

/** 23 · early career · a 10% deposit by 30. The classic Australian first-home timeline. */
export const vinuy: FreedomProfile = {
  freedomStatement: "A 10% deposit on my first place before I turn 30.",
  age: 23,
  country: "AU",
  currency: "AUD",
  lifeStage: "early_career",
  monthlyIncome: 5200,
  monthlyExpenses: 3600,
  savings: 12000,
  debt: 0,
  goals: [
    {
      id: "g-deposit",
      type: "home",
      label: "10% house deposit",
      targetAmount: 100000,
      targetDate: "2033-06-01",
      priority: 1,
    },
  ],
  knowledge: "intermediate",
  risk: "moderate",
  priorities: "I want the deposit to be the thing that happens automatically each month.",
};

/** 26 · paying for a master's in cash rather than borrowing. */
export const camille: FreedomProfile = {
  freedomStatement: "Pay for my master's in cash, not in loans.",
  age: 26,
  country: "AU",
  currency: "AUD",
  lifeStage: "early_career",
  monthlyIncome: 4800,
  monthlyExpenses: 3400,
  savings: 9000,
  debt: 0,
  goals: [
    {
      id: "g-masters",
      type: "education",
      label: "Master's degree",
      targetAmount: 60000,
      targetDate: "2030-02-01",
      priority: 1,
    },
  ],
  knowledge: "beginner",
  risk: "conservative",
  priorities: "I'd rather not borrow for study if there's any way around it.",
};

/** 29 · founder · $1M by 35 and a second property. Two large goals competing for the same dollars. */
export const mike: FreedomProfile = {
  freedomStatement: "Build something of my own that pays me back — and own more than one door.",
  age: 29,
  country: "AU",
  currency: "AUD",
  lifeStage: "professional",
  monthlyIncome: 9500,
  monthlyExpenses: 5200,
  savings: 85000,
  debt: 0,
  goals: [
    {
      id: "g-million",
      type: "early_retirement",
      label: "$1M net worth by 35, through my own venture",
      targetAmount: 1000000,
      targetDate: "2032-09-01",
      priority: 1,
    },
    {
      id: "g-apartment",
      type: "home",
      label: "Deposit for a second investment apartment",
      targetAmount: 65000,
      targetDate: "2032-09-01",
      priority: 2,
    },
  ],
  knowledge: "advanced",
  risk: "high",
  priorities: "I'd rather put money to work than leave it sitting.",
};

/** 38 · high earner · $2M by 42. A stretch target, on purpose. */
export const zuko: FreedomProfile = {
  freedomStatement: "Two million by 42, so my time stops being for sale.",
  age: 38,
  country: "AU",
  currency: "AUD",
  lifeStage: "professional",
  monthlyIncome: 14000,
  monthlyExpenses: 7800,
  savings: 520000,
  debt: 0,
  goals: [
    {
      id: "g-two-million",
      type: "early_retirement",
      label: "$2M by 42",
      targetAmount: 2000000,
      targetDate: "2030-09-01",
      priority: 1,
    },
  ],
  knowledge: "advanced",
  risk: "moderate",
  priorities: "Tell me if the number is realistic. Don't tell me what I want to hear.",
};

export const personas = { aman, vinuy, camille, mike, zuko } as const;
export type PersonaName = keyof typeof personas;
export const personaNames = Object.keys(personas) as PersonaName[];
