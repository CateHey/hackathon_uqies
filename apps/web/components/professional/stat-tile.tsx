export function StatTile({ label, value, hint, tone = "neutral" }: { label: string; value: string; hint?: string; tone?: "neutral" | "good" | "warn" }) {
  const toneClass = tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : "text-parchment";
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft/70 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-mist">{label}</p>
      <p className={`mt-1 font-display text-2xl ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="space-y-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      {label && (
        <p className="flex justify-between text-xs text-mist">
          <span>{label}</span>
          <span>{pct}%</span>
        </p>
      )}
    </div>
  );
}
