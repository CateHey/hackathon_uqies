/**
 * One place for everything the product is called.
 *
 * Internal package names (`@free-me/*`) and type names (`FreedomPlan`) are deliberately
 * unchanged — they are invisible to users and renaming them would touch 76 files for no
 * benefit. Everything a person can read comes from here.
 */
export const BRAND = {
  /** Full name, used once per screen at most. */
  name: "Pay Yourself First",
  /** How it's referred to everywhere else. */
  short: "PAYF",
  /** The principle, in one line. */
  tagline: "Fund your future before you spend the rest.",
  /** Used for demo account addresses. */
  domain: "payf.app",
} as const;

/** Shown in both modes and carried on every generated plan. */
export const DISCLAIMER =
  "PAYF provides general financial education, not personal financial advice. It doesn't know your full circumstances — consider them, and seek licensed advice for decisions that matter to you.";

/** The sentence every disclaimer must contain, whatever the brand — asserted in evals. */
export const DISCLAIMER_CORE = "general financial education, not personal financial advice";
