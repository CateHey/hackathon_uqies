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
import type { Lesson, LessonSummary } from "./types";

export type { Lesson, LessonLevel, LessonSummary, QuickCheck } from "./types";

/** The lesson catalogue, in a sensible learning order. */
export const lessons: Lesson[] = [
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

export const lessonIds: string[] = lessons.map((l) => l.id);

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

/** The compact form handed to the model (and cached) so it can pick `lessonIds`. */
export function lessonSummaries(): LessonSummary[] {
  return lessons.map(({ id, title, level, topics, summary }) => ({ id, title, level, topics, summary }));
}
