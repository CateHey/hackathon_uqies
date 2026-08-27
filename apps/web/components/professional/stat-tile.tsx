/**
 * Figures, not charts. Stat tile and meter follow the data-viz contract: label in
 * sentence case, value in the UI sans (semibold), status carried by icon + label —
 * never by colour alone — and a meter track that is a lighter step of its own fill.
 */

type Tone = "neutral" | "good" | "warn";

const toneIcon: Record<Tone, string> = { neutral: "", good: "✓", warn: "!" };
const toneClass: Record<Tone, string> = { neutral: "text-mist", good: "text-success", warn: "text-warning" };

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  hero = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  /** Exactly one per view: the number the dashboard leads with. */
  hero?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-ink-soft/70 p-4 ${hero ? "sm:col-span-2" : ""}`}>
      <p className="text-xs uppercase tracking-[0.15em] text-mist">{label}</p>
      <p className={`mt-1 font-semibold text-parchment ${hero ? "text-5xl" : "text-2xl"}`}>{value}</p>
      {hint && (
        <p className={`mt-1 flex items-center gap-1.5 text-xs ${toneClass[tone]}`}>
          {toneIcon[tone] && (
            <span aria-hidden className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${tone === "good" ? "bg-success/20" : "bg-warning/20"}`}>
              {toneIcon[tone]}
            </span>
          )}
          {hint}
        </p>
      )}
    </div>
  );
}

export function ProgressBar({ value, label, tone = "accent" }: { value: number; label?: string; tone?: "accent" | "good" }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const fill = tone === "good" ? "bg-success" : "bg-gold";
  const track = tone === "good" ? "bg-success/20" : "bg-gold/20";
  return (
    <div className="space-y-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-2 overflow-hidden rounded-full ${track}`}>
        <div className={`h-full rounded-full ${fill} transition-[width] duration-700`} style={{ width: `${pct}%` }} />
      </div>
      {label && (
        <p className="flex justify-between text-xs text-mist">
          <span>{label}</span>
          <span className="tabular-nums">{pct}%</span>
        </p>
      )}
    </div>
  );
}
