export type LessonLevel = "beginner" | "intermediate" | "advanced";

export interface QuickCheck {
  question: string;
  answer: string;
}

export interface Lesson {
  /** kebab-case, stable — referenced from plans as `lessonIds`. */
  id: string;
  title: string;
  level: LessonLevel;
  topics: string[];
  readingMinutes: number;
  /** One sentence shown in lists. */
  summary: string;
  /** Markdown. Education only — no products, tickers, providers, or "you should buy". */
  body: string;
  quickCheck: QuickCheck[];
}

export interface LessonSummary {
  id: string;
  title: string;
  level: LessonLevel;
  topics: string[];
  summary: string;
}
