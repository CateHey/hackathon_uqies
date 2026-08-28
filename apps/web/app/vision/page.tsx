"use client";

import Link from "next/link";
import { useState } from "react";
import { usePlan, useSave, useUpdateGoal } from "@free-me/api-client";
import { formatMoney, type GoalFutures } from "@free-me/core";
import { DemoButton } from "@/components/demo-button";
import { Button, ErrorNote, Spinner } from "@/components/ui";

/** A small, deliberate set — enough to make a goal yours without becoming an emoji keyboard. */
const EMOJI = ["⚽", "🏠", "🎓", "✈️", "🚀", "🏝️", "🏢", "🚗", "💍", "👶", "🎸", "🐕", "🧗", "🎯", "💻", "🌏"];

export default function VisionPage() {
  const save = useSave();
  const plan = usePlan();

  if (save.isPending) return <Spinner label="Opening your board…" />;
  if (save.isError) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-mist">Your board fills up once you&apos;ve told us what you&apos;re saving for.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding/freedom" className="text-accent hover:underline">Start your plan</Link>
          <DemoButton name="vinuy" label="See Vinuy's board" href="/vision" />
        </div>
      </div>
    );
  }

  const { goals, currency } = save.data;
  const statement = plan.data?.profile.freedomStatement;

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Your vision</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">What you&apos;re paying yourself for.</h1>
        {statement && <p className="mt-3 text-lg italic text-parchment/90">&ldquo;{statement}&rdquo;</p>}
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => (
          <li key={g.goalId}>
            <VisionCard goal={g} currency={currency} />
          </li>
        ))}
      </ul>

      {goals.length === 0 && (
        <p className="text-mist">No goals yet. Add one and it appears here.</p>
      )}

      <p className="text-xs text-mist">
        Amounts you&apos;ve already set aside are yours to edit — nothing here is guessed once you&apos;ve told us.
      </p>
    </div>
  );
}

function VisionCard({ goal, currency }: { goal: GoalFutures; currency: string }) {
  const update = useUpdateGoal();
  const [editing, setEditing] = useState(false);
  const [balance, setBalance] = useState(String(Math.round(goal.current)));
  const money = (n: number) => formatMoney(n, currency);

  const pct = goal.target && goal.target > 0 ? Math.min(1, goal.current / goal.target) : 0;
  const onTrack = goal.today?.works ?? null;
  const growth = goal.fundedBy === "growth";

  const ring = 2 * Math.PI * 34;
  const tone = growth ? "#8B97A6" : onTrack === false ? "#FF7A1A" : "#3DDC84";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-ink-soft/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0" role="img" aria-label={`${Math.round(pct * 100)}% of the way there`}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#1F2A33" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={tone}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - pct)}
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dashoffset 700ms ease" }}
            />
            <text x="40" y="46" textAnchor="middle" fontSize="22">{goal.emoji ?? "🎯"}</text>
          </svg>
          <div>
            <p className="font-medium text-parchment">{goal.label}</p>
            <p className="text-sm text-mist tabular-nums">
              {money(goal.current)}{goal.target !== null && ` of ${money(goal.target)}`}
            </p>
            <p className="text-xs text-mist">
              {Math.round(pct * 100)}%
              {goal.monthsUntilDeadline !== null && ` · ${goal.monthsUntilDeadline} months left`}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 flex-1 text-sm text-mist">
        {growth
          ? goal.growthNote?.headline
          : onTrack === false
            ? goal.today?.headline
            : goal.monthly > 0
              ? `${money(goal.monthly)} a month goes here.`
              : "Nothing going here this month."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => setEditing((e) => !e)}>
          {editing ? "Close" : "Edit"}
        </Button>
        <Link href="/save" className="text-xs text-accent hover:underline">Ways to get there →</Link>
      </div>

      {editing && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(balance);
              if (Number.isFinite(n) && n >= 0) update.mutate({ id: goal.goalId, patch: { currentBalance: n } });
            }}
          >
            <label className="flex-1 space-y-1">
              <span className="text-xs text-mist">Already set aside for this</span>
              <input
                type="number"
                min={0}
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-ink px-2 py-1 text-sm tabular-nums"
              />
            </label>
            <Button type="submit" variant="secondary" className="!px-3 !py-1 text-xs" disabled={update.isPending}>
              Save
            </Button>
          </form>

          <div>
            <p className="text-xs text-mist">Picture it</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {EMOJI.map((e) => (
                <button
                  key={e}
                  onClick={() => update.mutate({ id: goal.goalId, patch: { emoji: e } })}
                  aria-label={`Use ${e}`}
                  className={`rounded-lg px-2 py-1 text-lg transition hover:bg-white/10 ${goal.emoji === e ? "bg-accent/20" : ""}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          {update.isError && <ErrorNote>{update.error.message}</ErrorNote>}
        </div>
      )}
    </div>
  );
}
