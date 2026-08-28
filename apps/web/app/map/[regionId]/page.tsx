"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useProgress, usePlan, useWhy } from "@free-me/api-client";
import { formatMoney, regionPlainLabel, type Step } from "@free-me/core";
import { lessons } from "@free-me/content";
import { regionEmoji } from "@free-me/tokens";
import { ProgressBar } from "@/components/professional/stat-tile";
import { Badge, Button, Card, ErrorNote, SectionTitle, Spinner, Stars } from "@/components/ui";
import { useUiStore } from "@/lib/store";

export default function RegionPage() {
  const { regionId } = useParams<{ regionId: string }>();
  const router = useRouter();
  const mode = useUiStore((s) => s.mode);
  const plan = usePlan();
  const why = useWhy();
  const progress = useProgress();
  const [toast, setToast] = useState<string | null>(null);

  if (plan.isPending) return <Spinner label="Loading…" />;
  if (plan.isError) {
    router.replace("/map");
    return null;
  }
  const { plan: p, profile } = plan.data;
  const region = p.regions.find((r) => r.id === regionId);
  if (!region) {
    return (
      <div className="py-16 text-center">
        <p className="text-mist">That place isn&apos;t on your map.</p>
        <Link href="/map" className="text-accent hover:underline">Back to the map</Link>
      </div>
    );
  }
  const title = mode === "explore" ? region.exploreTitle : region.proTitle;
  const steps = p.steps.filter((s) => s.regionId === region.id).sort((a, b) => a.order - b.order);
  const regionLessons = region.lessonIds.map((id) => lessons.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => Boolean(l));
  const bridgesOut = p.bridges.filter((b) => b.from === region.id);
  const bridgesIn = p.bridges.filter((b) => b.to === region.id);
  const name = (id: string) => {
    const r = p.regions.find((x) => x.id === id);
    return r ? (mode === "explore" ? r.exploreTitle : r.proTitle) : id;
  };

  const send = (event: Parameters<typeof progress.mutate>[0]) =>
    progress.mutate(event, {
      onSuccess: (data) => {
        const unlocked = data.unlockedBridgeIds.map((id) => p.bridges.find((b) => b.id === id)).filter(Boolean);
        if (unlocked.length) setToast(`🌉 New path open — ${unlocked.map((b) => `${name(b!.from)} → ${name(b!.to)}`).join(", ")}`);
        else if (data.completedRegionIds.length) setToast(`✓ ${data.completedRegionIds.map(name).join(", ")} complete`);
      },
    });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/map" className="text-sm text-mist hover:text-parchment">← Back to your {mode === "explore" ? "map" : "plan"}</Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl">{regionEmoji[region.type]}</span>
          <h1 className="font-display text-4xl">{title}</h1>
          <Badge status={region.status} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">{regionPlainLabel(region.type)}</p>
        <p className="text-mist">{region.summary}</p>
        <p className="text-sm text-mist">Relevance for you: <Stars value={region.relevance} /></p>
      </header>

      {toast && (
        <div role="status" className="rounded-2xl border border-accent/40 bg-accent/10 p-3 text-sm text-parchment">
          {toast}
          <button onClick={() => setToast(null)} className="ml-3 text-xs text-mist hover:text-parchment">dismiss</button>
        </div>
      )}

      <Card>
        <SectionTitle eyebrow="Why this is on your map">Because…</SectionTitle>
        <p className="text-parchment/90">{region.why}</p>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="secondary" disabled={why.isPending} onClick={() => why.mutate({ itemType: "region", itemId: region.id })}>
            {why.isPending ? "Thinking…" : "Why? — explain it for me"}
          </Button>
          {why.data && <span className="text-xs text-mist">{why.data.source === "ai" ? "Explained for you" : "From your plan"}</span>}
        </div>
        {why.isError && <ErrorNote>{why.error.message}</ErrorNote>}
        {why.data && <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-parchment/90">{why.data.explanation}</p>}
      </Card>

      <section>
        <SectionTitle eyebrow="Steps">{steps.length ? "What to do here" : "Nothing to do here yet"}</SectionTitle>
        <div className="mt-2">
          <ProgressBar value={region.progress} label="Region progress" />
        </div>
        <ul className="mt-4 space-y-3">
          {steps.map((s) => (
            <li key={s.id}>
              <StepCard step={s} currency={profile.currency} busy={progress.isPending} onStatus={(status) => send({ type: "step_status", stepId: s.id, status })} onMetric={(current) => send({ type: "step_metric", stepId: s.id, current })} />
            </li>
          ))}
        </ul>
        {progress.isError && <ErrorNote>{progress.error.message}</ErrorNote>}
      </section>

      {regionLessons.length > 0 && (
        <section>
          <SectionTitle eyebrow="Learn before you continue">Lessons for this area</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {regionLessons.map((l) => (
              <li key={l.id}>
                <Link href={`/lessons/${l.id}`} className="block rounded-2xl border border-white/10 p-4 hover:border-accent/50">
                  <p className="text-xs uppercase tracking-wider text-mist">📚 {l.level} · {l.readingMinutes} min</p>
                  <p className="mt-1 font-medium">{l.title}</p>
                  <p className="mt-1 text-sm text-mist">{l.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(bridgesIn.length > 0 || bridgesOut.length > 0) && (
        <section>
          <SectionTitle eyebrow="Bridges">How this connects</SectionTitle>
          <ul className="space-y-2">
            {[...bridgesIn, ...bridgesOut].map((b) => (
              <li key={b.id} className="rounded-2xl border border-white/10 p-4 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  <span aria-hidden>{b.status === "unlocked" ? "🌉" : "⋯"}</span>
                  <Link href={`/map/${b.from}`} className="hover:text-accent">{name(b.from)}</Link>
                  <span className="text-mist">→</span>
                  <Link href={`/map/${b.to}`} className="hover:text-accent">{name(b.to)}</Link>
                  <Badge status={b.status} />
                </p>
                <p className="mt-1 text-parchment/90">{b.relationship}</p>
                {b.status === "locked" && <p className="mt-1 text-xs text-mist">Suggested next: {b.requirement}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StepCard({ step, currency, busy, onStatus, onMetric }: { step: Step; currency: string; busy: boolean; onStatus: (status: Step["status"]) => void; onMetric: (current: number) => void }) {
  const [amount, setAmount] = useState(step.metric ? String(step.metric.current) : "");
  const [open, setOpen] = useState(false);
  const done = step.status === "done";
  const fmt = (n: number) => (step.metric?.unit === currency ? formatMoney(n, currency) : `${n} ${step.metric?.unit ?? ""}`);
  return (
    <div className={`rounded-2xl border p-4 ${done ? "border-success/30 bg-success/5" : "border-white/10 bg-ink-soft/50"}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={done} disabled={busy} onChange={(e) => onStatus(e.target.checked ? "done" : "todo")} aria-label={`Mark ${step.title} ${done ? "not done" : "done"}`} className="mt-1 h-5 w-5 accent-[#FF7A1A]" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`font-medium ${done ? "text-mist line-through" : "text-parchment"}`}>{step.title}</p>
            <div className="flex items-center gap-2">
              <Badge status={step.status} />
              <button onClick={() => setOpen((o) => !o)} className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/5">Why?</button>
            </div>
          </div>
          <p className="mt-1 text-sm text-mist">{step.description}</p>
          {open && <p className="mt-2 rounded-xl bg-white/5 p-3 text-sm text-parchment/90">{step.why}</p>}
          {step.metric && (
            <div className="mt-3 space-y-2">
              <ProgressBar value={step.metric.target > 0 ? step.metric.current / step.metric.target : 0} label={`${step.metric.label}: ${fmt(step.metric.current)} of ${fmt(step.metric.target)}`} />
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(amount);
                  if (Number.isFinite(n) && n >= 0) onMetric(n);
                }}
              >
                <label className="text-xs text-mist" htmlFor={`m-${step.id}`}>Update amount</label>
                <input id={`m-${step.id}`} type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-32 rounded-lg border border-white/10 bg-ink px-2 py-1 text-sm" />
                <Button variant="secondary" type="submit" disabled={busy} className="!px-3 !py-1 text-xs">Save</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
