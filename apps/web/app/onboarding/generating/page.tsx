"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGeneratePlan } from "@free-me/api-client";
import { computeMetrics, formatMoney, FreedomProfile } from "@free-me/core";
import { Button, ErrorNote } from "@/components/ui";
import { useUiStore } from "@/lib/store";

const lines = [
  "Reading your freedom statement…",
  "Working out your numbers…",
  "Placing your goals on the map…",
  "Building bridges between them…",
  "Choosing what to learn first…",
  "Naming your Freedom City…",
];

export default function GeneratingPage() {
  const router = useRouter();
  const draft = useUiStore((s) => s.draft);
  const generate = useGeneratePlan();
  const [line, setLine] = useState(0);
  const [slow, setSlow] = useState(false);
  const started = useRef(false);

  const facts = useMemo(() => {
    const parsed = FreedomProfile.safeParse(draft);
    if (!parsed.success) return [];
    const m = computeMetrics(parsed.data);
    const money = (n: number) => formatMoney(n, parsed.data.currency);
    const out = [`💰 ${money(Math.max(0, m.surplus))} left each month`];
    if (m.emergencyMonths !== null) out.push(`🛡️ ${m.emergencyMonths.toFixed(1)} months of expenses saved`);
    out.push(`🎯 ${money(m.emergencyTarget)} buffer target`);
    const behind = m.goalProjections.filter((g) => g.onTrack === false);
    if (behind.length) out.push(`⏱️ ${behind[0]!.label}: needs ${money(behind[0]!.requiredMonthly ?? 0)}/month`);
    return out;
  }, [draft]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    generate.mutate(undefined, { onSuccess: () => router.replace("/map") });
    const t = setInterval(() => setLine((l) => (l + 1) % lines.length), 1800);
    const s = setTimeout(() => setSlow(true), 45_000);
    return () => {
      clearInterval(t);
      clearTimeout(s);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-mist">Step 3 of 3</p>
      <h1 className="font-display text-4xl">Building your world</h1>
      {!generate.isError && (
        <>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-[slide_1.4s_ease-in-out_infinite] rounded-full bg-gold" />
          </div>
          <p aria-live="polite" className="text-mist">{lines[line]}</p>
        </>
      )}
      <ul className="flex flex-wrap justify-center gap-2">
        {facts.map((f, i) => (
          <li key={f} className="rounded-full border border-white/10 px-3 py-1 text-sm text-parchment" style={{ animationDelay: `${i * 300}ms` }}>
            {f}
          </li>
        ))}
      </ul>
      {generate.isError && (
        <div className="space-y-3">
          <ErrorNote>{generate.error.message}</ErrorNote>
          <Button onClick={() => generate.mutate(undefined, { onSuccess: () => router.replace("/map") })}>Try again</Button>
        </div>
      )}
      {slow && generate.isPending && (
        <div className="space-y-3">
          <p className="text-sm text-mist">This is taking longer than usual.</p>
          <Button variant="secondary" onClick={() => generate.mutate({ force: "template" }, { onSuccess: () => router.replace("/map") })}>
            Continue with a guided starter plan
          </Button>
        </div>
      )}
      <style>{`@keyframes slide { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }`}</style>
    </div>
  );
}
