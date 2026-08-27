import type { FreedomPlan, Metrics, PlanOutput } from "@free-me/core";

/**
 * Structured outputs guarantee the SHAPE of a plan. This module guarantees its
 * SEMANTICS: referential integrity, a sane graph, ranges, and the
 * education-not-advice rule. Deterministic, no AI.
 */

export class ValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Plan failed validation:\n- ${problems.join("\n- ")}`);
    this.name = "ValidationError";
  }
}

/** Phrases and names that turn education into advice. Extend freely; every entry is a gate. */
export const BANNED_PATTERNS: RegExp[] = [
  /\byou (should|must|need to) (buy|sell|purchase|invest in|put (your )?money in(to)?)\b/i,
  /\b(guaranteed|risk[- ]free) (returns?|profits?|gains?|income)\b/i,
  /\b(can't|cannot|won't) lose\b/i,
  // brokers, platforms, fund managers
  /\b(vanguard|betashares|blackrock|ishares|state street|commsec|selfwealth|superhero|raiz|spaceship|pearler|stake|moomoo|coinbase|binance|kraken|swyftx|coinspot|robinhood|etoro|fidelity|schwab|webull|interactive brokers)\b/i,
  // banks
  /\b(commbank|commonwealth bank|westpac|anz|nab|macquarie|ing|up bank|ubank)\b/i,
  // specific coins
  /\b(bitcoin|btc|ethereum|eth|solana|dogecoin|xrp|cardano|tether)\b/i,
  // tickers: VAS.AX, $VOO, NASDAQ:AAPL
  /\b[A-Z]{2,5}\.(AX|ASX|L|NYSE|NASDAQ)\b/,
  /\$[A-Z]{2,5}\b/,
  /\b(ASX|NYSE|NASDAQ):[A-Z]{1,5}\b/,
];

export function findBannedTerms(text: string): string[] {
  const hits: string[] = [];
  for (const re of BANNED_PATTERNS) {
    const m = text.match(re);
    if (m?.[0]) hits.push(m[0]);
  }
  return hits;
}

export function containsBannedTerms(text: string): boolean {
  return findBannedTerms(text).length > 0;
}

const SPINE = ["foundation", "security", "growth"] as const;

/** Returns every problem found; an empty array means the plan is sound. */
export function postValidate(
  plan: PlanOutput | FreedomPlan,
  metrics: Metrics,
  catalogueIds: readonly string[],
): string[] {
  const problems: string[] = [];
  const p = (msg: string) => problems.push(msg);

  // ---- ids
  const regionIds = plan.regions.map((r) => r.id);
  const stepIds = plan.steps.map((s) => s.id);
  const bridgeIds = plan.bridges.map((b) => b.id);
  for (const [label, ids] of [
    ["region", regionIds],
    ["step", stepIds],
    ["bridge", bridgeIds],
  ] as const) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) p(`duplicate ${label} ids: ${[...new Set(dupes)].join(", ")}`);
  }
  const regionSet = new Set(regionIds);
  const stepSet = new Set(stepIds);
  const catalogue = new Set(catalogueIds);

  // ---- required regions
  for (const t of SPINE) {
    const n = plan.regions.filter((r) => r.type === t).length;
    if (n !== 1) p(`expected exactly one ${t} region, found ${n}`);
  }
  const cities = plan.regions.filter((r) => r.type === "freedom_city").length;
  if (cities !== 1) p(`expected exactly one freedom_city region, found ${cities}`);

  // ---- regions
  const stepsByRegion = new Map<string, string[]>();
  for (const s of plan.steps) {
    stepsByRegion.set(s.regionId, [...(stepsByRegion.get(s.regionId) ?? []), s.id]);
  }
  for (const r of plan.regions) {
    if (!Number.isInteger(r.relevance) || r.relevance < 1 || r.relevance > 5)
      p(`region ${r.id}: relevance ${r.relevance} is not an integer in 1..5`);
    if (r.progress < 0 || r.progress > 1) p(`region ${r.id}: progress ${r.progress} is not in 0..1`);
    if (r.why.trim().length < 10) p(`region ${r.id}: missing why`);
    for (const id of r.stepIds) {
      if (!stepSet.has(id)) p(`region ${r.id}: stepIds references unknown step ${id}`);
      else if (!(stepsByRegion.get(r.id) ?? []).includes(id)) p(`region ${r.id}: step ${id} belongs to another region`);
    }
    for (const id of stepsByRegion.get(r.id) ?? []) {
      if (!r.stepIds.includes(id)) p(`region ${r.id}: step ${id} is not listed in stepIds`);
    }
    for (const id of r.lessonIds) if (!catalogue.has(id)) p(`region ${r.id}: unknown lessonId ${id}`);
  }

  // ---- steps
  for (const s of plan.steps) {
    if (!regionSet.has(s.regionId)) p(`step ${s.id}: unknown regionId ${s.regionId}`);
    if (s.why.trim().length < 10) p(`step ${s.id}: missing why`);
    if (!Number.isInteger(s.order) || s.order < 1) p(`step ${s.id}: order must be a positive integer`);
    if (s.metric) {
      if (!(s.metric.target > 0)) p(`step ${s.id}: metric target must be > 0`);
      if (s.metric.current < 0) p(`step ${s.id}: metric current must be >= 0`);
    }
  }

  // ---- bridges
  for (const b of plan.bridges) {
    if (!regionSet.has(b.from)) p(`bridge ${b.id}: unknown from ${b.from}`);
    if (!regionSet.has(b.to)) p(`bridge ${b.id}: unknown to ${b.to}`);
    if (b.from === b.to) p(`bridge ${b.id}: from and to are the same region`);
    if (b.why.trim().length < 10) p(`bridge ${b.id}: missing why`);
    if (b.relationship.trim().length < 10) p(`bridge ${b.id}: missing relationship`);
    for (const id of b.requiredStepIds) if (!stepSet.has(id)) p(`bridge ${b.id}: unknown required step ${id}`);
  }

  // ---- graph: acyclic and everything reachable from foundation
  const out = new Map<string, string[]>();
  for (const b of plan.bridges) out.set(b.from, [...(out.get(b.from) ?? []), b.to]);
  const state = new Map<string, "visiting" | "done">();
  let cyclic = false;
  const visit = (id: string) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      cyclic = true;
      return;
    }
    state.set(id, "visiting");
    for (const next of out.get(id) ?? []) visit(next);
    state.set(id, "done");
  };
  for (const id of regionIds) visit(id);
  if (cyclic) p("bridges form a cycle");

  const roots = plan.regions.filter((r) => r.type === "foundation").map((r) => r.id);
  const seen = new Set<string>(roots);
  const queue = [...roots];
  while (queue.length) {
    const id = queue.shift() as string;
    for (const next of out.get(id) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  for (const id of regionIds) if (!seen.has(id)) p(`region ${id} is not reachable from foundation`);

  // ---- priority + next step
  if (!regionSet.has(plan.currentPriorityRegionId)) p(`currentPriorityRegionId ${plan.currentPriorityRegionId} does not exist`);
  const next = plan.steps.find((s) => s.id === plan.nextStepId);
  if (!next) p(`nextStepId ${plan.nextStepId} does not exist`);
  else if (next.regionId !== plan.currentPriorityRegionId)
    p(`nextStepId ${plan.nextStepId} is not in the priority region ${plan.currentPriorityRegionId}`);

  // ---- education, not advice
  const texts: Array<[string, string]> = [
    ["profileSummary.headline", plan.profileSummary.headline],
    ...plan.profileSummary.tags.map((t, i): [string, string] => [`profileSummary.tags[${i}]`, t]),
    ["freedomCity.title", plan.freedomCity.title],
    ["freedomCity.narrative", plan.freedomCity.narrative],
    ...plan.freedomCity.pillars.map((t, i): [string, string] => [`freedomCity.pillars[${i}]`, t]),
    ...plan.regions.flatMap((r): Array<[string, string]> => [
      [`region ${r.id}.exploreTitle`, r.exploreTitle],
      [`region ${r.id}.proTitle`, r.proTitle],
      [`region ${r.id}.summary`, r.summary],
      [`region ${r.id}.why`, r.why],
    ]),
    ...plan.steps.flatMap((s): Array<[string, string]> => [
      [`step ${s.id}.title`, s.title],
      [`step ${s.id}.description`, s.description],
      [`step ${s.id}.why`, s.why],
    ]),
    ...plan.bridges.flatMap((b): Array<[string, string]> => [
      [`bridge ${b.id}.relationship`, b.relationship],
      [`bridge ${b.id}.why`, b.why],
      [`bridge ${b.id}.requirement`, b.requirement],
    ]),
  ];
  for (const [where, text] of texts) {
    const hits = findBannedTerms(text);
    if (hits.length) p(`${where}: contains advice/product language (${hits.join(", ")})`);
  }

  // ---- light metrics sanity: currency metrics can't be wildly beyond anything in the profile
  const ceiling = Math.max(metrics.savings, metrics.monthlyIncome * 12, metrics.debt, 1000) * 50;
  for (const s of plan.steps) {
    if (s.metric && s.metric.unit === metrics.currency && s.metric.target > ceiling)
      p(`step ${s.id}: metric target ${s.metric.target} is implausible for this profile`);
  }

  return problems;
}

export function assertValid(plan: PlanOutput | FreedomPlan, metrics: Metrics, catalogueIds: readonly string[]): void {
  const problems = postValidate(plan, metrics, catalogueIds);
  if (problems.length) throw new ValidationError(problems);
}
