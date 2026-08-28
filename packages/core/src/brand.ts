/**
 * One place for everything the product is called.
 *
 * Internal package names (`@free-me/*`) and type names (`FreedomPlan`) match the brand again —
 * they were never renamed, which is why coming back cost one file instead of seventy-six.
 */
export const BRAND = {
  /** Full name. */
  name: "Free Me",
  /** How it's referred to everywhere else. */
  short: "Free Me",
  /** The promise, in one line. */
  tagline: "Discover your path to financial freedom.",
  /** Used for demo account addresses. */
  domain: "free-me.app",
} as const;

/** Shown in both modes and carried on every generated plan. */
export const DISCLAIMER =
  "Free Me provides general financial education, not personal financial advice. It doesn't know your full circumstances — consider them, and seek licensed advice for decisions that matter to you.";

/** The sentence every disclaimer must contain, whatever the brand — asserted in evals. */
export const DISCLAIMER_CORE = "general financial education, not personal financial advice";
