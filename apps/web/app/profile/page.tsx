"use client";

import Link from "next/link";
import { useState } from "react";
import { useEditProfile, usePlan } from "@free-me/api-client";
import {
  computeMetrics,
  formatMoney,
  type FreedomProfile,
  type Goal,
  type GoalType,
  type Knowledge,
  type LifeStage,
  type RiskPreference,
} from "@free-me/core";
import { DemoButton } from "@/components/demo-button";
import { StatTile } from "@/components/professional/stat-tile";
import { Button, Card, ErrorNote, SectionTitle, Spinner } from "@/components/ui";

const goalTypes: { value: GoalType; label: string }[] = [
  { value: "travel", label: "✈️ Travel" },
  { value: "home", label: "🏠 Home" },
  { value: "education", label: "📚 Education" },
  { value: "business", label: "💼 Business" },
  { value: "security", label: "🛡️ Security" },
  { value: "investing", label: "📈 Investing" },
  { value: "passive_income", label: "💸 Passive income" },
  { value: "early_retirement", label: "🌅 Independence" },
  { value: "other", label: "🎯 Other" },
];
const lifeStages: { value: LifeStage; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "early_career", label: "Early career" },
  { value: "professional", label: "Professional" },
  { value: "parent", label: "Parent" },
  { value: "other", label: "Other" },
];
const knowledgeLevels: Knowledge[] = ["beginner", "intermediate", "advanced"];
const risks: RiskPreference[] = ["conservative", "moderate", "high"];

const input =
  "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-parchment tabular-nums outline-none focus:border-accent/60";

export default function ProfilePage() {
  const plan = usePlan();

  if (plan.isPending) return <Spinner label="Loading your numbers…" />;
  if (plan.isError) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-mist">Nothing to edit yet — build a plan first, or open one of the demo people.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding/freedom" className="text-accent hover:underline">Start your journey</Link>
          <DemoButton name="vinuy" label="Open Vinuy's numbers" href="/profile" />
        </div>
      </div>
    );
  }
  return <ProfileEditor profile={plan.data.profile} />;
}

/**
 * The form owns a working copy of the profile. Seeding it from the prop at mount — rather
 * than syncing in an effect — keeps a single source of truth while you're typing: your edits
 * are never overwritten by a refetch mid-sentence.
 */
function ProfileEditor({ profile }: { profile: FreedomProfile }) {
  const edit = useEditProfile();
  const [draft, setDraft] = useState<FreedomProfile>(profile);
  const [saved, setSaved] = useState(false);

  const money = (n: number) => formatMoney(n, draft.currency);
  const live = computeMetrics(draft);
  const set = (patch: Partial<FreedomProfile>) => {
    setDraft({ ...draft, ...patch });
    setSaved(false);
  };
  const setGoal = (id: string, patch: Partial<Goal>) =>
    set({ goals: draft.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  const num = (v: string) => (v === "" ? 0 : Math.max(0, Number(v)));

  const save = () =>
    edit.mutate(draft, {
      onSuccess: () => setSaved(true),
    });

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Your numbers</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Change anything. Keep your map.</h1>
        <p className="mt-2 text-mist">
          Every figure below is what your plan is built from. Edit it and the position updates straight away.
        </p>
      </header>

      {/* Live figures, recomputed from the form as you type — before you even save. */}
      <section>
        <SectionTitle eyebrow="As you type">What these numbers mean</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Monthly surplus"
            value={money(live.surplus)}
            hint={live.savingsRate === null ? "No income yet" : `${Math.round(live.savingsRate * 100)}% saving rate`}
            tone={live.surplus > 0 ? "good" : "warn"}
          />
          <StatTile
            label="Emergency fund"
            value={live.emergencyMonths === null ? "—" : `${live.emergencyMonths.toFixed(1)} months`}
            hint={live.emergencyGap === 0 ? "Target covered" : `${money(live.emergencyGap)} short`}
            tone={live.emergencyGap === 0 ? "good" : "warn"}
          />
          <StatTile label="Savings" value={money(draft.savings)} hint={live.spareSavings > 0 ? `${money(live.spareSavings)} beyond the buffer` : "All of it is buffer"} />
          <StatTile
            label="Debt"
            value={money(draft.debt)}
            hint={draft.debt === 0 ? "Debt-free" : live.monthsToClearDebt ? `~${live.monthsToClearDebt} months to clear` : "No surplus to clear it"}
            tone={draft.debt === 0 ? "good" : "warn"}
          />
        </div>
      </section>

      <Card>
        <SectionTitle eyebrow="Money">Each month</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly income" hint="After tax">
            <input type="number" min={0} className={input} value={draft.monthlyIncome} onChange={(e) => set({ monthlyIncome: num(e.target.value) })} />
          </Field>
          <Field label="Monthly expenses" hint="Everything you spend">
            <input type="number" min={0} className={input} value={draft.monthlyExpenses} onChange={(e) => set({ monthlyExpenses: num(e.target.value) })} />
          </Field>
          <Field label="Savings" hint="What you have right now">
            <input type="number" min={0} className={input} value={draft.savings} onChange={(e) => set({ savings: num(e.target.value) })} />
          </Field>
          <Field label="Debt" hint="Cards and loans">
            <input type="number" min={0} className={input} value={draft.debt} onChange={(e) => set({ debt: num(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle eyebrow="Goals">What you&apos;re saving for</SectionTitle>
        <ul className="space-y-4">
          {draft.goals.map((g, i) => (
            <li key={g.id} className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-mist">
                  Goal {i + 1}{i === 0 ? " · most important" : ""}
                </span>
                {draft.goals.length > 1 && (
                  <button
                    className="text-xs text-mist hover:text-danger"
                    onClick={() => set({ goals: draft.goals.filter((x) => x.id !== g.id).map((x, n) => ({ ...x, priority: n + 1 })) })}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="What is it?">
                  <input className={input} value={g.label} onChange={(e) => setGoal(g.id, { label: e.target.value })} />
                </Field>
                <Field label="Type">
                  <select className={input} value={g.type} onChange={(e) => setGoal(g.id, { type: e.target.value as GoalType })}>
                    {goalTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Target amount" hint="Optional">
                  <input
                    type="number"
                    min={0}
                    className={input}
                    value={g.targetAmount ?? ""}
                    onChange={(e) => setGoal(g.id, { targetAmount: e.target.value === "" ? undefined : num(e.target.value) })}
                  />
                </Field>
                <Field label="By when" hint="Optional">
                  <input
                    type="date"
                    className={input}
                    value={g.targetDate ?? ""}
                    onChange={(e) => setGoal(g.id, { targetDate: e.target.value || undefined })}
                  />
                </Field>
              </div>
              {(() => {
                const p = live.goalProjections.find((x) => x.goalId === g.id);
                if (!p?.targetAmount) return null;
                return (
                  <p className="mt-3 text-sm text-mist">
                    {p.onTrack === false && p.requiredMonthly
                      ? `Behind — ${money(p.requiredMonthly)} a month would get there by your date.`
                      : p.onTrack === true
                        ? `On track — about ${p.monthsToTarget} months at your current pace.`
                        : p.monthsToTarget !== null
                          ? `About ${p.monthsToTarget} months at your current pace.`
                          : "No surplus yet, so this one waits on capacity."}
                  </p>
                );
              })()}
            </li>
          ))}
        </ul>
        {draft.goals.length < 6 && (
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() =>
              set({
                goals: [...draft.goals, { id: `g-${Date.now()}`, type: "security", label: "New goal", priority: draft.goals.length + 1 }],
              })
            }
          >
            + Add a goal
          </Button>
        )}
      </Card>

      <Card>
        <SectionTitle eyebrow="About you">Context</SectionTitle>
        <div className="space-y-4">
          <Field label="What does freedom mean to you?">
            <textarea rows={2} className={input} value={draft.freedomStatement} onChange={(e) => set({ freedomStatement: e.target.value.slice(0, 500) })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age">
              <input type="number" min={13} max={100} className={input} value={draft.age} onChange={(e) => set({ age: Number(e.target.value) || draft.age })} />
            </Field>
            <Field label="Life stage">
              <select className={input} value={draft.lifeStage} onChange={(e) => set({ lifeStage: e.target.value as LifeStage })}>
                {lifeStages.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Financial knowledge">
              <select className={input} value={draft.knowledge} onChange={(e) => set({ knowledge: e.target.value as Knowledge })}>
                {knowledgeLevels.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Risk preference">
              <select className={input} value={draft.risk} onChange={(e) => set({ risk: e.target.value as RiskPreference })}>
                {risks.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Card>

      {edit.isError && <ErrorNote>{edit.error.message}</ErrorNote>}

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-ink/90 p-4 backdrop-blur">
        <Button onClick={save} disabled={edit.isPending}>
          {edit.isPending ? "Saving…" : saved ? "Saved ✓" : "Save my numbers"}
        </Button>
        {saved && (
          <>
            <span className="text-sm text-accent-2">Your position updated.</span>
            <Link href="/map" className="text-sm text-accent hover:underline">Go to your map →</Link>
          </>
        )}
        <span className="ml-auto text-xs text-mist">Your map is kept — it just offers to rebuild.</span>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-parchment">{label}</span>
      {hint && <span className="block text-xs text-mist">{hint}</span>}
      {children}
    </label>
  );
}
