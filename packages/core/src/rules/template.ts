import { DISCLAIMER } from "../schema/plan";
import type {
  Bridge,
  FreedomPlan,
  Region,
  RegionType,
  Step,
  StepKind,
  StepMetric,
  StepStatus,
} from "../schema/plan";
import type { FreedomProfile, Goal, GoalType } from "../schema/profile";
import type { Capacity, GoalProjection, Metrics } from "../schema/metrics";
import { recomputePlanState } from "./unlock";
import { clamp, formatMoney } from "../utils/money";

/** Lesson ids the template references. The content catalogue must provide every one of these. */
export const TEMPLATE_LESSONS = {
  budgeting: "budgeting-basics",
  emergency: "emergency-fund",
  debt: "understanding-debt",
  compound: "compound-interest",
  investing: "what-is-investing",
  risk: "understanding-risk",
  diversification: "diversification",
  etfs: "etfs-explained",
  deposit: "saving-for-a-deposit",
  crypto: "crypto-and-volatility",
} as const;
export const TEMPLATE_LESSON_IDS: string[] = Object.values(TEMPLATE_LESSONS);

type StepInput = {
  kind: StepKind;
  title: string;
  description: string;
  why: string;
  metric?: StepMetric;
  status?: StepStatus;
};
type RegionInput = Omit<Region, "status" | "progress" | "stepIds">;
type BridgeInput = Pick<Bridge, "requirement" | "requiredStepIds" | "relationship" | "why">;

const REGION_COPY: Record<
  Exclude<RegionType, "personal_goal" | "freedom_city">,
  { explore: string; pro: string; summary: string }
> = {
  foundation: {
    explore: "Foundation Village",
    pro: "Financial foundations",
    summary: "Know where your money goes and put a simple budget in place.",
  },
  security: {
    explore: "Security Harbour",
    pro: "Financial security",
    summary: "Build a buffer against surprises and get on top of any debt.",
  },
  growth: {
    explore: "Savings Garden",
    pro: "Saving & growth",
    summary: "Turn saving into a habit and grow what you earn.",
  },
  markets: {
    explore: "Markets District",
    pro: "Investing & markets",
    summary: "Understand shares, funds, risk and diversification before you commit money.",
  },
  property: {
    explore: "Property Quarter",
    pro: "Property",
    summary: "What a deposit takes, how borrowing works, and whether property fits your plan.",
  },
  business: {
    explore: "Enterprise Workshop",
    pro: "Business & extra income",
    summary: "Side income, entrepreneurship and what it takes to build something of your own.",
  },
  digital_assets: {
    explore: "Digital Frontier",
    pro: "Digital assets",
    summary: "How cryptocurrency works, why it swings so much, and how to think about the risk.",
  },
};

const GOAL_SUFFIX: Partial<Record<GoalType, string>> = {
  travel: "Destination",
  education: "Academy",
  other: "Landmark",
};

const STAGE_TAG = {
  student: "🎓 Student",
  early_career: "🚀 Early career",
  professional: "💼 Professional",
  parent: "👨‍👩‍👧 Parent",
  other: "🧭 Finding your path",
} as const;

const STAGE_NOUN = {
  student: "student",
  early_career: "early-career saver",
  professional: "professional",
  parent: "parent",
  other: "explorer",
} as const;

const FOCUS_TAG: Record<GoalType, string> = {
  travel: "🌍 Travel-focused",
  home: "🏠 Home-focused",
  education: "📚 Education-focused",
  business: "💼 Business-minded",
  security: "🛡️ Security-focused",
  investing: "📈 Wealth-focused",
  passive_income: "📈 Wealth-focused",
  early_retirement: "📈 Wealth-focused",
  other: "🎯 Goal-driven",
};

const CAPACITY_TAG: Record<Capacity, string> = {
  none: "💰 Building capacity",
  tight: "💰 Tight budget",
  steady: "💰 Steady saver",
  strong: "💰 Strong saver",
};

const PRIORITY_VERB: Partial<Record<RegionType, string>> = {
  foundation: "building a foundation",
  security: "building security",
  growth: "growing savings",
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * A complete, valid Freedom Plan built with no AI at all. Used as the fallback when
 * generation fails and as the baseline the AI plan is expected to improve on.
 */
export function templatePlan(profile: FreedomProfile, metrics: Metrics, opts: { now?: Date } = {}): FreedomPlan {
  const now = opts.now ?? new Date();
  const money = (n: number) => formatMoney(n, profile.currency);
  const steps: Step[] = [];
  const regions: Region[] = [];
  const bridges: Bridge[] = [];

  const addStep = (regionId: string, key: string, input: StepInput): string => {
    const id = `${regionId}.${key}`;
    const order = steps.filter((s) => s.regionId === regionId).length + 1;
    const { status = "todo", ...rest } = input;
    steps.push({ id, regionId, order, status, ...rest });
    return id;
  };
  const addRegion = (input: RegionInput): void => {
    regions.push({
      status: "locked",
      progress: 0,
      stepIds: steps.filter((s) => s.regionId === input.id).map((s) => s.id),
      ...input,
    });
  };
  const addBridge = (from: string, to: string, input: BridgeInput): void => {
    bridges.push({ id: `${from}->${to}`, from, to, status: "locked", ...input });
  };

  const beginner = profile.knowledge === "beginner";
  const proj = (goal: Goal): GoalProjection | undefined =>
    metrics.goalProjections.find((p) => p.goalId === goal.id);
  const goalsOfType = (...types: GoalType[]) =>
    profile.goals.filter((g) => types.includes(g.type)).sort((a, b) => a.priority - b.priority);
  const has = (...types: GoalType[]) => goalsOfType(...types).length > 0;
  const surplusText = money(Math.max(0, metrics.surplus));
  const emergencyMonthsText =
    metrics.emergencyMonths === null ? "an unknown number of" : metrics.emergencyMonths.toFixed(1);
  const heavyDebt =
    profile.debt > 0 && (metrics.debtToAnnualIncome === null || metrics.debtToAnnualIncome >= 0.5);

  // ---------------------------------------------------------------- Foundation
  const learned: StepStatus = beginner ? "todo" : "done";
  const understandSpending = addStep("foundation", "understand-spending", {
    kind: "learn",
    title: "Understand where your money goes",
    description: "Track one month of spending and sort it into needs, wants and savings.",
    why: `You spend about ${money(profile.monthlyExpenses)} a month against ${money(profile.monthlyIncome)} coming in. Knowing where it goes is the first lever you control.`,
    status: learned,
  });
  addStep("foundation", "build-budget", {
    kind: "action",
    title: "Set a simple budget",
    description:
      "Decide, in advance, how much goes to essentials, to enjoying life, and to your goals each month.",
    why:
      metrics.surplus > 0
        ? `A budget turns your ${surplusText} monthly surplus from an accident into a decision.`
        : "You currently spend at least as much as you earn; a budget shows exactly where to close the gap.",
    status: learned,
  });
  addRegion({
    id: "foundation",
    type: "foundation",
    exploreTitle: REGION_COPY.foundation.explore,
    proTitle: REGION_COPY.foundation.pro,
    summary: REGION_COPY.foundation.summary,
    why: beginner
      ? "Everything else on your map gets easier once you can see your money clearly — this is where every journey starts."
      : "You already have the basics in place. This is here so you can see the whole path, not because you need to redo it.",
    relevance: 5,
    lessonIds: [TEMPLATE_LESSONS.budgeting],
  });

  // ---------------------------------------------------------------- Security
  const hasBuffer = metrics.emergencyGap === 0;
  const emergencyStep = addStep("security", "emergency-buffer", {
    kind: "save",
    title: `Build a ${metrics.emergencyTargetMonths}-month emergency buffer`,
    description: `Set aside ${money(metrics.emergencyTarget)} — ${metrics.emergencyTargetMonths} months of your expenses — somewhere you can reach it but won't touch it.`,
    why: hasBuffer
      ? `Your ${money(profile.savings)} already covers a ${metrics.emergencyTargetMonths}-month buffer. Every dollar above it is free to work on your goals.`
      : `You have ${money(profile.savings)} saved, which covers ${emergencyMonthsText} months of expenses. A ${metrics.emergencyTargetMonths}-month buffer means a surprise bill doesn't derail your goals.`,
    metric:
      metrics.emergencyTarget > 0
        ? {
            label: "Emergency buffer",
            current: Math.min(profile.savings, metrics.emergencyTarget),
            target: metrics.emergencyTarget,
            unit: profile.currency,
          }
        : undefined,
    status: hasBuffer ? "done" : profile.savings > 0 ? "in_progress" : "todo",
  });
  if (profile.debt > 0) {
    addStep("security", "debt-plan", {
      kind: "action",
      title: "Make a plan for your debt",
      description:
        "List every debt with its interest rate and minimum payment. Pay the minimums on all of them, then put anything extra towards the most expensive one.",
      why:
        metrics.monthsToClearDebt !== null
          ? `You owe ${money(profile.debt)}. At your current ${surplusText} monthly surplus it would take about ${metrics.monthsToClearDebt} months to clear — a plan can shorten that.`
          : `You owe ${money(profile.debt)} and have no monthly surplus yet, so the plan starts with interest rates and minimum payments while you build capacity.`,
    });
  }
  addRegion({
    id: "security",
    type: "security",
    exploreTitle: REGION_COPY.security.explore,
    proTitle: REGION_COPY.security.pro,
    summary: REGION_COPY.security.summary,
    why: heavyDebt
      ? `Your debt of ${money(profile.debt)} is the biggest thing between you and your goals, so this is where the map focuses first.`
      : hasBuffer
        ? "Your buffer is already in place — this region is about keeping it that way."
        : `A buffer of ${money(metrics.emergencyTarget)} is the difference between a setback and a crisis. It comes before growth on purpose.`,
    relevance: 5,
    lessonIds: [TEMPLATE_LESSONS.emergency, ...(profile.debt > 0 ? [TEMPLATE_LESSONS.debt] : [])],
  });

  // ---------------------------------------------------------------- Growth
  const savingTarget = addStep("growth", "saving-target", {
    kind: "action",
    title: "Set a monthly saving target",
    description: "Pick a number you can hit every month and automate it on payday.",
    why:
      metrics.surplus > 0
        ? `You have about ${surplusText} a month left after expenses — a ${Math.round((metrics.savingsRate ?? 0) * 100)}% saving rate. Automating it is the difference between hoping and doing.`
        : "Right now nothing is left at the end of the month, so this step is about finding the first $50. The habit matters more than the amount.",
  });
  addStep("growth", "grow-income", {
    kind: "learn",
    title: "Find one way to grow your income",
    description:
      "More income is the fastest way to more capacity: a raise, extra hours, a new skill, or a small side project.",
    why: "Every extra dollar you earn can go straight to a goal without cutting anything you enjoy.",
  });
  addRegion({
    id: "growth",
    type: "growth",
    exploreTitle: REGION_COPY.growth.explore,
    proTitle: REGION_COPY.growth.pro,
    summary: REGION_COPY.growth.summary,
    why:
      metrics.capacity === "strong"
        ? "You already save a large share of what you earn — this region is about making sure it is automatic and pointed at the right goals."
        : metrics.capacity === "none"
          ? "Your capacity to save is the constraint right now, so growing it — income up, habits in place — unlocks everything downstream."
          : "Consistent saving is the engine for every goal on this map. This is where the habit gets built.",
    relevance: 5,
    lessonIds: [TEMPLATE_LESSONS.compound],
  });

  // ---------------------------------------------------------------- Personal goal regions
  const goalWhy = (p: GoalProjection, target: number): string => {
    if (p.onTrack === false)
      return `At your current pace you'd reach ${money(target)} in ${p.monthsToTarget ?? "many"} months, but your deadline is ${p.monthsUntilDeadline} months away. You're behind — and this map is built to fix that.`;
    if (p.onTrack === true)
      return `At your current pace you'll reach ${money(target)} in about ${p.monthsToTarget} months, inside your ${p.monthsUntilDeadline}-month deadline.`;
    if (p.monthsToTarget === null)
      return `You have ${money(p.funded)} towards this already but no monthly surplus yet — growing your capacity is what unlocks it.`;
    return `At your current pace this takes about ${p.monthsToTarget} months.`;
  };
  const goalStepIds = new Map<string, string>();
  for (const goal of goalsOfType("travel", "education", "other")) {
    const id = `goal-${goal.id}`;
    const p = proj(goal);
    if (goal.targetAmount && p) {
      const stepId = addStep(id, "save", {
        kind: "save",
        title: `Save for ${goal.label}`,
        description: p.requiredMonthly
          ? `Put aside about ${money(p.requiredMonthly)} a month to have ${money(goal.targetAmount)} by ${goal.targetDate}.`
          : `Build towards ${money(goal.targetAmount)}, one automatic transfer at a time.`,
        why: goalWhy(p, goal.targetAmount),
        metric: { label: goal.label, current: p.funded, target: goal.targetAmount, unit: profile.currency },
        status: p.remaining === 0 ? "done" : p.funded > 0 ? "in_progress" : "todo",
      });
      goalStepIds.set(id, stepId);
    } else {
      const stepId = addStep(id, "define", {
        kind: "action",
        title: `Put a number on ${goal.label}`,
        description:
          "Work out what it will actually cost and when you want it. A goal with a number and a date is one you can plan for.",
        why: "Until it has a number, it can't have a place in your budget.",
      });
      goalStepIds.set(id, stepId);
    }
    addRegion({
      id,
      type: "personal_goal",
      exploreTitle: `${goal.label} ${GOAL_SUFFIX[goal.type] ?? "Landmark"}`,
      proTitle: goal.label,
      summary: `Your goal: ${goal.label}.`,
      why: `You told us this is what freedom looks like — it gets its own place on the map so every saving habit has somewhere to go.`,
      relevance: clamp(6 - goal.priority, 1, 5),
      lessonIds: [],
      goalId: goal.id,
    });
  }

  // ---------------------------------------------------------------- Exploration branches
  let marketsRelevance = 3;
  if (profile.risk === "high") marketsRelevance += 1;
  if (profile.risk === "conservative") marketsRelevance -= 1;
  if (has("investing", "passive_income", "early_retirement")) marketsRelevance += 1;
  if (metrics.capacity === "strong") marketsRelevance += 1;
  if (metrics.capacity === "none") marketsRelevance -= 1;
  marketsRelevance = clamp(marketsRelevance, 1, 5);
  const marketsLearn = addStep("markets", "what-is-investing", {
    kind: "learn",
    title: "Learn what investing actually is",
    description: "Shares, funds, returns and time — the vocabulary before the decisions.",
    why: "Understanding is free; mistakes are not. Learn the mechanics before any money moves.",
  });
  addStep("markets", "risk-and-diversification", {
    kind: "learn",
    title: "Understand risk and diversification",
    description: "Why prices move, what you can and can't control, and how spreading money reduces the damage of being wrong.",
    why: `You described your risk preference as ${profile.risk}. Knowing what that means in practice keeps you from being surprised later.`,
  });
  addRegion({
    id: "markets",
    type: "markets",
    exploreTitle: REGION_COPY.markets.explore,
    proTitle: REGION_COPY.markets.pro,
    summary: REGION_COPY.markets.summary,
    why:
      marketsRelevance >= 4
        ? "Long-term investing is the most relevant growth path for you: you have capacity and a long horizon."
        : marketsRelevance <= 2
          ? "Investing matters eventually, but right now your buffer and capacity come first — learn here, commit later."
          : "A sensible next path once your buffer is in place: learn how markets work, then decide what fits.",
    relevance: marketsRelevance,
    lessonIds: [
      TEMPLATE_LESSONS.investing,
      TEMPLATE_LESSONS.risk,
      TEMPLATE_LESSONS.diversification,
      TEMPLATE_LESSONS.etfs,
    ],
    goalId: goalsOfType("investing", "passive_income", "early_retirement")[0]?.id,
  });

  let propertyRelevance = 1;
  const homeGoal = goalsOfType("home")[0];
  if (homeGoal) propertyRelevance += 2;
  if (profile.savings >= 20000) propertyRelevance += 1;
  if (profile.monthlyIncome >= 5000) propertyRelevance += 1;
  if (metrics.capacity === "none") propertyRelevance -= 1;
  propertyRelevance = clamp(propertyRelevance, 1, 5);
  const homeProj = homeGoal ? proj(homeGoal) : undefined;
  if (homeGoal && homeGoal.targetAmount && homeProj) {
    addStep("property", "deposit", {
      kind: "save",
      title: `Save your deposit for ${homeGoal.label}`,
      description: homeProj.requiredMonthly
        ? `About ${money(homeProj.requiredMonthly)} a month gets you to ${money(homeGoal.targetAmount)} by ${homeGoal.targetDate}.`
        : `Build towards a ${money(homeGoal.targetAmount)} deposit.`,
      why: goalWhy(homeProj, homeGoal.targetAmount),
      metric: { label: "Deposit", current: homeProj.funded, target: homeGoal.targetAmount, unit: profile.currency },
      status: homeProj.remaining === 0 ? "done" : homeProj.funded > 0 ? "in_progress" : "todo",
    });
  } else {
    addStep("property", "learn-deposit", {
      kind: "learn",
      title: "Understand what a deposit takes",
      description: "How much a deposit is, what lenders look at, and the costs beyond the price.",
      why: "Property is a very large goal; knowing the real numbers early tells you whether and when it fits your plan.",
    });
  }
  addRegion({
    id: "property",
    type: "property",
    exploreTitle: REGION_COPY.property.explore,
    proTitle: REGION_COPY.property.pro,
    summary: REGION_COPY.property.summary,
    why: homeGoal
      ? "Owning a home is one of your stated goals, so this path is central to your map."
      : propertyRelevance <= 2
        ? "Not a priority yet because of the capital involved — it stays on the map so you can learn what it would take."
        : "You have the capacity to make property a realistic path; this is where you learn whether you want to.",
    relevance: propertyRelevance,
    lessonIds: [TEMPLATE_LESSONS.deposit],
    goalId: homeGoal?.id,
  });

  let businessRelevance = 2;
  const businessGoal = goalsOfType("business")[0];
  if (businessGoal) businessRelevance += 2;
  if (profile.risk === "high") businessRelevance += 1;
  businessRelevance = clamp(businessRelevance, 1, 5);
  addStep("business", "side-income", {
    kind: "action",
    title: "Test one small income idea",
    description: "Pick something you could sell, make or do this month. Small and real beats big and imaginary.",
    why: "Extra income is the one lever that raises your capacity for every other goal at once.",
  });
  addRegion({
    id: "business",
    type: "business",
    exploreTitle: REGION_COPY.business.explore,
    proTitle: REGION_COPY.business.pro,
    summary: REGION_COPY.business.summary,
    why: businessGoal
      ? "Building something of your own is one of your goals — this path is where it starts."
      : "Not a must, but extra income is the fastest way to raise your saving capacity.",
    relevance: businessRelevance,
    lessonIds: [],
    goalId: businessGoal?.id,
  });

  let digitalRelevance = 1;
  if (profile.risk === "high") digitalRelevance += 1;
  if (profile.knowledge === "advanced") digitalRelevance += 1;
  digitalRelevance = clamp(digitalRelevance, 1, 5);
  addStep("digital_assets", "understand-volatility", {
    kind: "learn",
    title: "Understand volatility before anything else",
    description: "Why digital assets swing so hard, what that does to a plan, and how to size any exposure so it can't hurt your goals.",
    why: "This is the highest-volatility area on the map. Understanding comes first, and for many plans understanding is enough.",
  });
  addRegion({
    id: "digital_assets",
    type: "digital_assets",
    exploreTitle: REGION_COPY.digital_assets.explore,
    proTitle: REGION_COPY.digital_assets.pro,
    summary: REGION_COPY.digital_assets.summary,
    why:
      profile.risk === "conservative"
        ? "Higher volatility than your stated preference — worth understanding, unlikely to be a priority."
        : "Volatile and speculative; on the map for education, not as a destination.",
    relevance: digitalRelevance,
    lessonIds: [TEMPLATE_LESSONS.crypto],
  });

  // ---------------------------------------------------------------- Freedom City
  const pillars = Array.from(new Set([...profile.goals.map((g) => g.label), "Financial security"]));
  const cityTitle = has("travel")
    ? "🌴 Freedom City"
    : has("home")
      ? "🏡 Freedom City"
      : has("business")
        ? "🚀 Freedom City"
        : "🕊️ Freedom City";
  addStep("freedom_city", "define-freedom", {
    kind: "review",
    title: "Revisit what freedom means to you",
    description: "Once a quarter, re-read your freedom statement and check the map still points at it.",
    why: `You said: "${profile.freedomStatement}" The whole map exists to get you there.`,
  });
  addRegion({
    id: "freedom_city",
    type: "freedom_city",
    exploreTitle: cityTitle,
    proTitle: "Your definition of freedom",
    summary: pillars.join(" · "),
    why: "This is the destination — your version of freedom, not a number someone else picked.",
    relevance: 5,
    lessonIds: [],
  });

  // ---------------------------------------------------------------- Bridges
  addBridge("foundation", "security", {
    requirement: "Understand where your money goes",
    requiredStepIds: [understandSpending],
    relationship: "Knowing your spending tells you exactly how big your buffer needs to be.",
    why: "A buffer target is just your monthly expenses multiplied — you need the first number to get the second.",
  });
  addBridge("security", "growth", {
    requirement: "Build your emergency buffer",
    requiredStepIds: [emergencyStep],
    relationship: "With a buffer in place, your savings can stay pointed at goals instead of being raided for surprises.",
    why: "Saving for goals before you have a buffer usually means un-saving them at the first emergency.",
  });
  for (const region of regions.filter((r) => r.type === "personal_goal")) {
    const stepId = goalStepIds.get(region.id);
    addBridge("growth", region.id, {
      requirement: "Set a monthly saving target",
      requiredStepIds: [savingTarget],
      relationship: `Every dollar you automate is a dollar closer to ${region.proTitle}.`,
      why: "A goal without a saving habit behind it is a wish.",
    });
    addBridge(region.id, "freedom_city", {
      requirement: `Reach your ${region.proTitle} target`,
      requiredStepIds: stepId ? [stepId] : [],
      relationship: `${region.proTitle} is one of the pillars of your Freedom City.`,
      why: "Your definition of freedom is made of the goals you named.",
    });
  }
  addBridge("growth", "markets", {
    requirement: "Set a monthly saving target",
    requiredStepIds: [savingTarget],
    relationship: "Investing only works with money you won't need soon — your saving habit is what feeds it.",
    why: "Markets reward time and consistency; the habit has to exist first.",
  });
  addBridge("growth", "property", {
    requirement: "Set a monthly saving target",
    requiredStepIds: [savingTarget],
    relationship: "A deposit is a very large saving goal with a deadline — the same habit, bigger numbers.",
    why: "Deposit progress is almost entirely a function of monthly saving and time.",
  });
  addBridge("growth", "business", {
    requirement: "Set a monthly saving target",
    requiredStepIds: [savingTarget],
    relationship: "Extra income raises your capacity for every other goal on this map.",
    why: "More income is the one input that makes every other target arrive sooner.",
  });
  addBridge("growth", "digital_assets", {
    requirement: "Set a saving target and learn what investing is",
    requiredStepIds: [savingTarget, marketsLearn],
    relationship: "Digital assets amplify everything about markets — understand the ordinary version first.",
    why: "Volatility is only survivable when it's a small part of a plan you already understand.",
  });
  if (homeGoal) {
    addBridge("markets", "property", {
      requirement: "Complete the Markets District",
      requiredStepIds: [],
      relationship: "Money put into investments is money not in your deposit — the trade-off runs both ways.",
      why: "Two good goals can compete for the same dollars; the bridge makes the trade-off visible.",
    });
  }
  addBridge("markets", "freedom_city", {
    requirement: "Complete the Markets District",
    requiredStepIds: [],
    relationship: "Long-term investing is how your Freedom City keeps being funded after the first goals are met.",
    why: "Freedom that lasts needs money that grows without you working for every dollar of it.",
  });

  // ---------------------------------------------------------------- Priority & summary
  const priority: RegionType = heavyDebt
    ? "security"
    : beginner
      ? "foundation"
      : metrics.emergencyGap > 0 || profile.debt > 0
        ? "security"
        : "growth";

  const primaryGoal = [...profile.goals].sort((a, b) => a.priority - b.priority)[0];
  const focus = primaryGoal ? FOCUS_TAG[primaryGoal.type] : FOCUS_TAG.other;
  const profileSummary = {
    headline: `${cap(focus.replace(/^\S+\s/, ""))} ${STAGE_NOUN[profile.lifeStage]} ${PRIORITY_VERB[priority] ?? "on the way"}`,
    tags: [
      STAGE_TAG[profile.lifeStage],
      focus,
      CAPACITY_TAG[metrics.capacity],
      `📚 ${cap(profile.knowledge)} knowledge`,
      `⚖️ ${cap(profile.risk)} risk preference`,
    ],
  };

  const freedomCity = {
    title: cityTitle,
    pillars,
    narrative: `Your freedom is made of ${pillars.slice(0, -1).join(", ")}${pillars.length > 1 ? " and " : ""}${pillars[pillars.length - 1]}. Every step on this map moves you closer to it.`,
  };

  const draft: FreedomPlan = {
    version: 1,
    source: "template",
    generatedAt: now.toISOString(),
    profileSummary,
    currentPriorityRegionId: priority,
    nextStepId:
      steps.find((s) => s.regionId === priority && s.status !== "done")?.id ?? "freedom_city.define-freedom",
    regions: regions.map((r) => (r.id === "foundation" ? { ...r, status: "available" } : r)),
    bridges,
    steps,
    freedomCity,
    disclaimers: [DISCLAIMER],
  };
  return recomputePlanState(draft).plan;
}
