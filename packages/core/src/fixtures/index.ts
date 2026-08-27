import type { FreedomProfile } from "../schema/profile";

/** Fixed "now" so projections in tests and golden plans are stable. */
export const FIXTURE_NOW = new Date("2026-09-01T00:00:00Z");

/** CONCEPT §18 — 21, university student, $800 saved, Japan in 18 months, wants financial independence. */
export const sarah: FreedomProfile = {
  freedomStatement: "I want to be able to travel without worrying about money.",
  age: 21,
  country: "AU",
  currency: "AUD",
  lifeStage: "student",
  monthlyIncome: 1800,
  monthlyExpenses: 1500,
  savings: 800,
  debt: 0,
  goals: [
    {
      id: "g-japan",
      type: "travel",
      label: "Trip to Japan",
      targetAmount: 6000,
      targetDate: "2028-03-01",
      priority: 1,
    },
    { id: "g-fi", type: "early_retirement", label: "Financial independence", priority: 2 },
  ],
  knowledge: "beginner",
  risk: "moderate",
  priorities: "I want to enjoy my twenties but not be careless with money.",
};

/** CONCEPT §5 User A — 19, student, $300, Japan, beginner. */
export const userA: FreedomProfile = {
  freedomStatement: "Being able to say yes to a trip without checking my bank balance first.",
  age: 19,
  country: "AU",
  currency: "AUD",
  lifeStage: "student",
  monthlyIncome: 1200,
  monthlyExpenses: 1100,
  savings: 300,
  debt: 0,
  goals: [{ id: "g-japan", type: "travel", label: "Trip to Japan", targetAmount: 4000, priority: 1 }],
  knowledge: "beginner",
  risk: "moderate",
};

/** CONCEPT §5 User B — 29, professional, $50k, wants to buy a property. */
export const userB: FreedomProfile = {
  freedomStatement: "Owning my own place and not having to answer to a landlord.",
  age: 29,
  country: "AU",
  currency: "AUD",
  lifeStage: "professional",
  monthlyIncome: 7500,
  monthlyExpenses: 4500,
  savings: 50000,
  debt: 0,
  goals: [
    {
      id: "g-home",
      type: "home",
      label: "Deposit for a first home",
      targetAmount: 120000,
      targetDate: "2029-01-01",
      priority: 1,
    },
    { id: "g-invest", type: "investing", label: "Keep building long-term investments", priority: 2 },
  ],
  knowledge: "intermediate",
  risk: "moderate",
  priorities: "Security first, then growth.",
};

/** Debt larger than a year of income, small buffer, conservative. */
export const debtHeavy: FreedomProfile = {
  freedomStatement: "Not feeling a knot in my stomach every time I open my banking app.",
  age: 26,
  country: "AU",
  currency: "AUD",
  lifeStage: "early_career",
  monthlyIncome: 4000,
  monthlyExpenses: 3600,
  savings: 1500,
  debt: 60000,
  goals: [{ id: "g-secure", type: "security", label: "Feel financially secure", priority: 1 }],
  knowledge: "beginner",
  risk: "conservative",
};

/** Student with no income yet, decent savings, an education goal. */
export const zeroIncome: FreedomProfile = {
  freedomStatement: "Finishing my degree without money stress getting in the way.",
  age: 20,
  country: "AU",
  currency: "AUD",
  lifeStage: "student",
  monthlyIncome: 0,
  monthlyExpenses: 900,
  savings: 2500,
  debt: 0,
  goals: [{ id: "g-course", type: "education", label: "Exchange semester", targetAmount: 3000, priority: 1 }],
  knowledge: "beginner",
  risk: "conservative",
};

export const fixtures = { sarah, userA, userB, debtHeavy, zeroIncome } as const;
export type FixtureName = keyof typeof fixtures;
