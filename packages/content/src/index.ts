import budgetingBasics from "./lessons/budgeting-basics";
import emergencyFund from "./lessons/emergency-fund";
import understandingDebt from "./lessons/understanding-debt";
import compoundInterest from "./lessons/compound-interest";
import whatIsInvesting from "./lessons/what-is-investing";
import understandingRisk from "./lessons/understanding-risk";
import diversification from "./lessons/diversification";
import etfsExplained from "./lessons/etfs-explained";
import savingForADeposit from "./lessons/saving-for-a-deposit";
import cryptoAndVolatility from "./lessons/crypto-and-volatility";
import type { AuthoredLesson, Lesson, LessonSummary } from "./types";

export type { Lesson, LessonLevel, LessonSummary, QuickCheck } from "./types";

/**
 * Reading time at ~200 words a minute, the usual figure for non-technical prose.
 * Derived rather than authored so it stays true when a lesson is edited.
 */
function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.trim().split(/\s+/).length / 200));
}

/** The lesson catalogue, in a sensible learning order. */
const authored: AuthoredLesson[] = [
  budgetingBasics,
  emergencyFund,
  understandingDebt,
  compoundInterest,
  whatIsInvesting,
  understandingRisk,
  diversification,
  etfsExplained,
  savingForADeposit,
  cryptoAndVolatility,
];

export const lessons: Lesson[] = authored.map((l) => ({ ...l, readingMinutes: readingMinutes(l.body) }));

export const lessonIds: string[] = lessons.map((l) => l.id);

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

/** The compact form handed to the model (and cached) so it can pick `lessonIds`. */
export function lessonSummaries(): LessonSummary[] {
  return lessons.map(({ id, title, level, topics, summary }) => ({ id, title, level, topics, summary }));
}
