"use client";

import Link from "next/link";
import { useState } from "react";
import { useAllocate, usePlan, useProgress } from "@free-me/api-client";
import { formatMoney, type AllocationBucket } from "@free-me/core";
import { DemoButton } from "@/components/demo-button";
import { Button, Card, ErrorNote, SectionTitle, Spinner } from "@/components/ui";

const FLEX = "flexible";

export default function AllocatePage() {
  const plan = usePlan();
  const allocate = useAllocate();
  const progress = useProgress();
  const [amount, setAmount] = useState("1000");
  const [buckets, setBuckets] = useState<AllocationBucket[] | null>(null);
  const [saved, setSaved] = useState(false);

  if (plan.isPending) return <Spinner label="Loading…" />;
  if (plan.isError) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-mist">Build your map first, then come back with money to allocate — or try it on Sarah&apos;s journey.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding/freedom" className="text-accent hover:underline">Start your journey</Link>
          <DemoButton name="vinuy" label="Try it with Vinuy's plan" href="/allocate" />
        </div>
      </div>
    );
  }
  const { profile, plan: p } = plan.data;
  const money = (n: number) => formatMoney(n, profile.currency);
  const total = Number(amount) || 0;

  const suggest = () => {
    setSaved(false);
    allocate.mutate({ amount: Math.round(total) }, { onSuccess: (d) => setBuckets(d.allocation.buckets) });
  };

  /** Move money between a bucket and "flexible" so the total never changes. */
  const setBucket = (key: string, next: number) => {
    if (!buckets) return;
    const current = buckets.find((b) => b.key === key);
    if (!current) return;
    const delta = Math.round(next) - current.amount;
    let flex = buckets.find((b) => b.key === FLEX);
    const list = flex ? buckets : [...buckets, (flex = { key: FLEX, label: "Flexible savings", amount: 0, reason: "Kept available for whatever comes next." })];
    const flexNext = flex.amount - delta;
    if (flexNext < 0) return;
    setBuckets(list.map((b) => (b.key === key ? { ...b, amount: b.amount + delta } : b.key === FLEX ? { ...b, amount: flexNext } : b)));
  };

  const save = async () => {
    if (!buckets) return;
    for (const b of buckets) {
      if (b.key === FLEX || b.amount <= 0) continue;
      const step = p.steps.find((s) => s.regionId === b.key && s.kind === "save" && s.metric && s.status !== "done");
      if (!step?.metric) continue;
      await progress.mutateAsync({ type: "step_metric", stepId: step.id, current: step.metric.current + b.amount });
    }
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">💰 I have money to allocate</p>
        <h1 className="mt-1 font-display text-4xl">What should I do with it?</h1>
        <p className="mt-2 text-mist">A suggested split across your plan. Change anything — it&apos;s your money and your call.</p>
      </div>

      <Card>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (total > 0) suggest();
          }}
        >
          <label className="flex-1 space-y-1">
            <span className="text-sm text-parchment">Amount ({profile.currency})</span>
            <input type="number" inputMode="decimal" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-lg" />
          </label>
          <Button type="submit" disabled={allocate.isPending || total <= 0}>{allocate.isPending ? "Thinking…" : "Suggest a split"}</Button>
        </form>
        {allocate.isError && <ErrorNote>{allocate.error.message}</ErrorNote>}
      </Card>

      {buckets && (
        <section className="space-y-3">
          <SectionTitle eyebrow={allocate.data?.source === "ai" ? "Suggested for you" : "A simple split"}>{money(buckets.reduce((s, b) => s + b.amount, 0))} across {buckets.length} buckets</SectionTitle>
          {allocate.data?.allocation.summary && <p className="text-sm text-mist">{allocate.data.allocation.summary}</p>}
          {buckets.map((b) => (
            <div key={b.key} className="rounded-2xl border border-white/10 bg-ink-soft/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-parchment">{b.label}</p>
                <p className="font-display text-xl text-accent">{money(b.amount)}</p>
              </div>
              <p className="mt-1 text-sm text-mist">{b.reason}</p>
              {b.key !== FLEX && (
                <input type="range" min={0} max={total} step={10} value={b.amount} onChange={(e) => setBucket(b.key, Number(e.target.value))} className="mt-3 w-full accent-[#FF7A1A]" aria-label={`Amount for ${b.label}`} />
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={progress.isPending || saved}>{saved ? "Saved ✓" : progress.isPending ? "Saving…" : "Save to my plan"}</Button>
            {saved && <Link href="/map" className="text-sm text-accent hover:underline">See your map update →</Link>}
          </div>
          {progress.isError && <ErrorNote>{progress.error.message}</ErrorNote>}
        </section>
      )}
    </div>
  );
}
