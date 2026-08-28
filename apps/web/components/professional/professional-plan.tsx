"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney, orderRegions, regionPlainLabel, type PlanBundle, type Step } from "@free-me/core";
import { lessons } from "@free-me/content";
import { regionEmoji } from "@free-me/tokens";
import { Badge, Card, SectionTitle, Stars } from "../ui";
import { ProgressBar, StatTile } from "./stat-tile";

/** 📊 Professional mode: the same plan object as a plain dashboard. */
export function ProfessionalPlan({ bundle }: { bundle: PlanBundle }) {
  const { plan, metrics, profile } = bundle;
  const money = (n: number) => formatMoney(n, profile.currency);
  const ordered = orderRegions(plan);
  const priority = plan.regions.find((r) => r.id === plan.currentPriorityRegionId);
  const reachable = new Set(plan.regions.filter((r) => r.status !== "locked").map((r) => r.id));
  const nextSteps: Step[] = ordered
    .filter((r) => reachable.has(r.id))
    .flatMap((r) => plan.steps.filter((s) => s.regionId === r.id && s.status !== "done").sort((a, b) => a.order - b.order))
    .slice(0, 5);
  const activeLessons = (priority?.lessonIds ?? []).map((id) => lessons.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Your financial plan</p>
        <h1 className="mt-1 font-display text-3xl">{plan.profileSummary.headline}</h1>
        <ul className="mt-2 flex flex-wrap gap-2">
          {plan.profileSummary.tags.map((t) => (
            <li key={t} className="rounded-full border border-white/10 px-3 py-1 text-xs text-parchment">{t}</li>
          ))}
        </ul>
      </div>

      <section>
        <SectionTitle eyebrow="Current position">Where you are</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile
            hero
            label="Emergency fund"
            value={metrics.emergencyMonths === null ? "—" : `${metrics.emergencyMonths.toFixed(1)} months`}
            hint={
              metrics.emergencyGap === 0
                ? `Covers your ${metrics.emergencyTargetMonths}-month target (${money(metrics.emergencyTarget)})`
                : `${money(metrics.emergencyGap)} short of a ${metrics.emergencyTargetMonths}-month target (${money(metrics.emergencyTarget)})`
            }
            tone={metrics.emergencyGap === 0 ? "good" : "warn"}
          />
          <StatTile label="Savings" value={money(metrics.savings)} hint={metrics.spareSavings > 0 ? `${money(metrics.spareSavings)} beyond your buffer` : "All of it counts towards your buffer"} tone={metrics.spareSavings > 0 ? "good" : "neutral"} />
          <StatTile
            label="Monthly surplus"
            value={money(metrics.surplus)}
            hint={metrics.savingsRate === null ? "No income yet" : `${Math.round(metrics.savingsRate * 100)}% saving rate · ${metrics.capacity}`}
            tone={metrics.surplus > 0 ? "good" : "warn"}
          />
          <StatTile
            label="Debt"
            value={money(metrics.debt)}
            hint={metrics.debt === 0 ? "Debt-free" : metrics.monthsToClearDebt ? `~${metrics.monthsToClearDebt} months to clear at current surplus` : "No surplus to clear it yet"}
            tone={metrics.debt === 0 ? "good" : "warn"}
          />
        </div>
      </section>

      {priority && (
        <Card>
          <SectionTitle eyebrow="Current priority">
            {regionEmoji[priority.type]} {priority.proTitle}
            <span className="ml-2 align-middle text-sm font-normal text-mist">· {regionPlainLabel(priority.type)}</span>
          </SectionTitle>
          <p className="text-sm text-parchment/90">{priority.why}</p>
          <div className="mt-3">
            <ProgressBar value={priority.progress} label="Progress" />
          </div>
          <Link href={`/map/${priority.id}`} className="mt-3 inline-block text-sm text-accent hover:underline">Open this priority →</Link>
        </Card>
      )}

      <section>
        <SectionTitle eyebrow="Your next steps">What to do</SectionTitle>
        <ol className="space-y-3">
          {nextSteps.map((s, i) => (
            <li key={s.id}>
              <StepRow step={s} index={i + 1} regionTitle={plan.regions.find((r) => r.id === s.regionId)?.proTitle ?? ""} currency={profile.currency} />
            </li>
          ))}
          {nextSteps.length === 0 && <li className="text-sm text-mist">Everything on your map is done. Time to revisit what freedom means to you.</li>}
        </ol>
      </section>

      <section>
        <SectionTitle eyebrow="Your paths">Where you could go</SectionTitle>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-mist">
              <tr>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2">Relevance</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Why</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((r) => (
                <tr key={r.id} className="border-t border-white/5 align-top">
                  <td className="px-4 py-3">
                    <Link href={`/map/${r.id}`} className="font-medium text-parchment hover:text-accent">
                      {regionEmoji[r.type]} {r.proTitle}
                    </Link>
                    <span className="block text-xs text-mist">{regionPlainLabel(r.type)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3"><Stars value={r.relevance} /></td>
                  <td className="whitespace-nowrap px-4 py-3"><Badge status={r.status} /></td>
                  <td className="px-4 py-3 text-mist">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {activeLessons.length > 0 && (
        <section>
          <SectionTitle eyebrow="Learning">Your next learning step</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {activeLessons.map((l) => (
              <li key={l.id}>
                <Link href={`/lessons/${l.id}`} className="block rounded-2xl border border-white/10 p-4 hover:border-accent/50">
                  <p className="text-xs uppercase tracking-wider text-mist">📚 {l.level} · {l.readingMinutes} min</p>
                  <p className="mt-1 font-medium text-parchment">{l.title}</p>
                  <p className="mt-1 text-sm text-mist">{l.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card>
        <SectionTitle eyebrow="Your definition of freedom">{plan.freedomCity.title}</SectionTitle>
        <ul className="flex flex-wrap gap-2">
          {plan.freedomCity.pillars.map((p) => (
            <li key={p} className="rounded-full bg-accent/15 px-3 py-1 text-sm text-accent">{p}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-parchment/90">{plan.freedomCity.narrative}</p>
      </Card>
    </div>
  );
}

function StepRow({ step, index, regionTitle, currency }: { step: Step; index: number; regionTitle: string; currency: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-mist">Priority {index} · {regionTitle}</p>
          <p className="mt-1 font-medium text-parchment">{step.title}</p>
          <p className="text-sm text-mist">{step.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={step.status} />
          <button onClick={() => setOpen((o) => !o)} className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/5">Why?</button>
        </div>
      </div>
      {step.metric && (
        <div className="mt-3">
          <ProgressBar
            value={step.metric.target > 0 ? step.metric.current / step.metric.target : 0}
            label={`${step.metric.label}: ${step.metric.unit === currency ? formatMoney(step.metric.current, currency) : step.metric.current} of ${step.metric.unit === currency ? formatMoney(step.metric.target, currency) : step.metric.target}`}
          />
        </div>
      )}
      {open && <p className="mt-3 text-sm text-parchment/90">{step.why}</p>}
    </div>
  );
}
