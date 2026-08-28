"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSave } from "@free-me/api-client";
import { formatMoney, type Future, type GoalFutures } from "@free-me/core";
import { DemoButton } from "@/components/demo-button";
import { ProgressBar } from "@/components/professional/stat-tile";
import { Card, ErrorNote, SectionTitle, Spinner } from "@/components/ui";

const RATES = [
  { label: "Just saving", value: 0 },
  { label: "3% a year", value: 0.03 },
  { label: "6% a year", value: 0.06 },
  { label: "9% a year", value: 0.09 },
];

export default function SavePage() {
  const [excluded, setExcluded] = useState<string[]>([]);
  const [rate, setRate] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState<number | undefined>(undefined);

  const req = useMemo(
    () => ({
      ...(excluded.length ? { excludeGoalIds: excluded } : {}),
      ...(rate ? { annualRate: rate } : {}),
      ...(monthlyTotal !== undefined ? { monthlyTotal } : {}),
    }),
    [excluded, rate, monthlyTotal],
  );
  const save = useSave(req);

  if (save.isPending) return <Spinner label="Working out your split…" />;
  if (save.isError) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-mist">Tell us your numbers first and we&apos;ll work out what to pay yourself.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding/freedom" className="text-accent hover:underline">Start your plan</Link>
          <DemoButton name="vinuy" label="Try it with Vinuy's numbers" href="/save" />
        </div>
      </div>
    );
  }

  const { pay, goals, currency, surplus, monthlyIncome } = save.data;
  const money = (n: number) => formatMoney(n, currency);
  const max = Math.max(surplus, pay.monthlyTotal, 1);
  const goalById = new Map(goals.map((g) => [g.goalId, g]));
  const toggle = (id: string) =>
    setExcluded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Pay yourself first</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">
          {money(pay.monthlyTotal)} <span className="text-mist">a month, before anything else.</span>
        </h1>
        <p className="mt-2 text-mist">
          {Math.round(pay.shareOfIncome * 100)}% of what you earn. Everything below is split from that.
        </p>
      </header>

      <Card>
        <label className="block space-y-2">
          <span className="flex items-baseline justify-between text-sm">
            <span className="font-medium">What you pay yourself</span>
            <span className="font-display text-lg text-accent tabular-nums">{money(pay.monthlyTotal)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={Math.round(max * 1.5)}
            step={10}
            value={pay.monthlyTotal}
            onChange={(e) => setMonthlyTotal(Number(e.target.value))}
            className="w-full accent-[#FF7A1A]"
            aria-label="Monthly amount you pay yourself"
          />
          <span className="flex justify-between text-xs text-mist">
            <span>$0</span>
            <span>Your spare each month: {money(surplus)}</span>
          </span>
        </label>

        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium">If it grew at…</p>
          <div role="radiogroup" className="flex flex-wrap gap-2">
            {RATES.map((r) => (
              <button
                key={r.value}
                role="radio"
                aria-checked={rate === r.value}
                onClick={() => setRate(r.value)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  rate === r.value ? "border-accent-2 bg-accent-2/10 text-accent-2-soft" : "border-white/10 text-mist hover:text-parchment"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-mist">
            An assumption you choose, not a forecast. Money that can grow faster can also fall — that&apos;s the trade.
          </p>
        </div>
      </Card>

      <section>
        <SectionTitle eyebrow="The split">Where it goes</SectionTitle>
        <ul className="space-y-3">
          {pay.lines.map((l) => (
            <li key={l.key} className="rounded-2xl border border-white/10 bg-ink-soft/60 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-parchment">
                  {goalById.get(l.key)?.emoji ? `${goalById.get(l.key)!.emoji} ` : ""}
                  {l.label}
                </p>
                <p className="font-display text-xl text-accent tabular-nums">{money(l.amount)}<span className="text-sm text-mist">/mo</span></p>
              </div>
              <p className="mt-1 text-sm text-mist">{l.reason}</p>
              {l.target !== undefined && l.current !== undefined && l.target > 0 && (
                <div className="mt-3">
                  <ProgressBar
                    value={l.current / l.target}
                    label={`${money(l.current)} of ${money(l.target)}`}
                    tone={l.onTrack === false ? "accent" : "good"}
                  />
                </div>
              )}
            </li>
          ))}
          {pay.lines.length === 0 && (
            <li className="rounded-2xl border border-white/10 p-4 text-sm text-mist">
              Nothing spare to split this month. That&apos;s the honest answer — and the first thing to change.
            </li>
          )}
        </ul>
      </section>

      {pay.growthGoals.length > 0 && (
        <section>
          <SectionTitle eyebrow="Not a savings goal">Comes from what you build</SectionTitle>
          {pay.growthGoals.map((g) => {
            const detail = goalById.get(g.goalId);
            return (
              <div key={g.goalId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium">{detail?.emoji ? `${detail.emoji} ` : ""}{g.label}</p>
                <p className="mt-1 text-sm text-mist">{g.reason}</p>
                {detail?.growthNote && <p className="mt-2 text-sm text-parchment/90">{detail.growthNote.headline}</p>}
              </div>
            );
          })}
        </section>
      )}

      {goals.length > 1 && (
        <section>
          <SectionTitle eyebrow="What if">Try dropping one</SectionTitle>
          <p className="text-sm text-mist">Switch a goal off and watch the money move to the others.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {goals.map((g) => {
              const off = excluded.includes(g.goalId);
              return (
                <button
                  key={g.goalId}
                  onClick={() => toggle(g.goalId)}
                  aria-pressed={!off}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    off ? "border-white/10 text-mist line-through" : "border-accent/50 bg-accent/10 text-parchment"
                  }`}
                >
                  {g.emoji ? `${g.emoji} ` : ""}{g.label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionTitle eyebrow="Ways to get there">Each goal, honestly</SectionTitle>
        <ul className="space-y-4">
          {goals
            .filter((g) => !excluded.includes(g.goalId))
            .map((g) => (
              <li key={g.goalId}>
                <GoalCard goal={g} currency={currency} monthlyIncome={monthlyIncome} />
              </li>
            ))}
        </ul>
      </section>

      {save.isFetching && <p className="text-xs text-mist">Recalculating…</p>}
      {save.isError && <ErrorNote>Couldn&apos;t recalculate.</ErrorNote>}
    </div>
  );
}

function GoalCard({ goal, currency, monthlyIncome }: { goal: GoalFutures; currency: string; monthlyIncome: number }) {
  const [open, setOpen] = useState(false);
  const money = (n: number) => formatMoney(n, currency);
  const onTrack = goal.today?.works ?? null;

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-parchment">
            {goal.emoji ? `${goal.emoji} ` : ""}{goal.label}
          </p>
          <p className="text-sm text-mist">
            {goal.target !== null ? money(goal.target) : "No amount set"}
            {goal.monthsUntilDeadline !== null && ` · ${goal.monthsUntilDeadline} months to go`}
            {goal.monthly > 0 && ` · ${money(goal.monthly)}/mo`}
          </p>
        </div>
        {onTrack !== null && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              onTrack ? "bg-accent-2/20 text-accent-2" : "bg-accent/20 text-accent-soft"
            }`}
          >
            {onTrack ? "On track" : "Short by then"}
          </span>
        )}
      </div>

      {goal.growthNote && <p className="mt-3 text-sm text-parchment/90">{goal.growthNote.headline}</p>}
      {goal.today && <p className="mt-3 text-sm text-parchment/90">{goal.today.headline}</p>}

      {goal.futures.length > 0 && (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-4 rounded-full border border-white/15 px-4 py-1.5 text-sm hover:bg-white/5"
            aria-expanded={open}
          >
            {open ? "Hide the ways" : `${goal.futures.length} ways to get there`}
          </button>
          {open && (
            <ol className="mt-3 space-y-2">
              {goal.futures.map((f) => (
                <li key={f.kind}>
                  <FutureRow future={f} currency={currency} monthlyIncome={monthlyIncome} />
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function FutureRow({ future, currency, monthlyIncome }: { future: Future; currency: string; monthlyIncome: number }) {
  const money = (n: number) => formatMoney(n, currency);
  const tone = future.works ? "border-accent-2/40 bg-accent-2/5" : "border-white/10 bg-white/5";
  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <p className="text-sm font-medium text-parchment">{future.title}</p>
      <p className="mt-1 text-sm text-mist">{future.headline}</p>
      {future.works && future.kind !== "more_time" && (
        <p className="mt-1 text-xs text-mist tabular-nums">
          Ends at {money(future.outcome.finalBalance)} · puts aside {money(future.outcome.totalContributed)} in total
          {future.levers.monthlyIncome !== monthlyIncome && ` · on ${money(future.levers.monthlyIncome)}/mo income`}
        </p>
      )}
    </div>
  );
}
