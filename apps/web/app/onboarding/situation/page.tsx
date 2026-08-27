"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useSaveProfile } from "@free-me/api-client";
import { FreedomProfile, type Goal, type GoalType, type Knowledge, type LifeStage, type RiskPreference } from "@free-me/core";
import { Button, ErrorNote } from "@/components/ui";
import { useUiStore } from "@/lib/store";

const goalTypes: { value: GoalType; label: string }[] = [
  { value: "travel", label: "✈️ Travel" },
  { value: "home", label: "🏠 Buy a home" },
  { value: "education", label: "📚 Education" },
  { value: "business", label: "💼 Start a business" },
  { value: "security", label: "🛡️ Financial security" },
  { value: "investing", label: "📈 Investing" },
  { value: "passive_income", label: "💸 Passive income" },
  { value: "early_retirement", label: "🌅 Financial independence" },
  { value: "other", label: "🎯 Something else" },
];

const lifeStages: { value: LifeStage; label: string }[] = [
  { value: "student", label: "🎓 Student" },
  { value: "early_career", label: "🚀 Early career" },
  { value: "professional", label: "💼 Professional" },
  { value: "parent", label: "👨‍👩‍👧 Parent" },
  { value: "other", label: "🧭 Other" },
];

const knowledgeLevels: { value: Knowledge; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "Budgets and buffers are new to me." },
  { value: "intermediate", label: "Intermediate", hint: "I know the basics; investing is the next step." },
  { value: "advanced", label: "Advanced", hint: "I invest already and want a sharper plan." },
];

const risks: { value: RiskPreference; label: string; hint: string }[] = [
  { value: "conservative", label: "Conservative", hint: "I'd rather sleep well than chase returns." },
  { value: "moderate", label: "Moderate", hint: "Some ups and downs are fine for long-term growth." },
  { value: "high", label: "High", hint: "I'm comfortable with big swings for bigger potential." },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-ink-soft px-3 py-2 text-parchment outline-none placeholder:text-mist/50 focus:border-gold/60";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-parchment">{label}</span>
      {hint && <span className="block text-xs text-mist">{hint}</span>}
      {children}
    </label>
  );
}

function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl border p-3 text-left transition ${value === o.value ? "border-gold bg-gold/10" : "border-white/10 hover:border-white/30"}`}
        >
          <span className="block text-sm font-medium text-parchment">{o.label}</span>
          {o.hint && <span className="block text-xs text-mist">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

const num = (v: string) => (v === "" ? undefined : Number(v));
const str = (v: number | undefined) => (v === undefined || Number.isNaN(v) ? "" : String(v));

export default function SituationPage() {
  const router = useRouter();
  const draft = useUiStore((s) => s.draft);
  const setDraft = useUiStore((s) => s.setDraft);
  const save = useSaveProfile();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const goals: Goal[] = draft.goals?.length
    ? draft.goals
    : [{ id: "g1", type: "travel", label: "", priority: 1 }];
  const setGoals = (next: Goal[]) => setDraft({ goals: next.map((g, i) => ({ ...g, priority: i + 1 })) });

  const steps = ["About you", "Your money", "Your goals", "How you think"];

  const submit = () => {
    const candidate = { ...draft, goals: goals.map((g) => ({ ...g, label: g.label.trim() || goalTypes.find((t) => t.value === g.type)?.label.replace(/^\S+\s/, "") || "Goal" })) };
    const parsed = FreedomProfile.safeParse(candidate);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => `${i.path.join(" › ") || "form"}: ${i.message}`));
      return;
    }
    setErrors([]);
    setDraft(parsed.data);
    save.mutate(parsed.data, {
      onSuccess: () => router.push("/onboarding/generating"),
      onError: (e) => setErrors([e.message]),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Step 2 of 3 · {steps[step]}</p>
        <h1 className="mt-2 font-display text-4xl">Tell us about yourself.</h1>
        <p className="mt-2 text-mist">Rough numbers are fine. Everything stays on your device and our server only — nothing is shared.</p>
      </div>

      <ol className="flex gap-2 text-xs text-mist">
        {steps.map((s, i) => (
          <li key={s} className={`flex-1 border-t-2 pt-1 ${i <= step ? "border-gold text-parchment" : "border-white/10"}`}>
            {s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-5">
          <Field label="Your age">
            <input type="number" inputMode="numeric" min={13} max={100} className={inputClass} value={str(draft.age)} onChange={(e) => setDraft({ age: num(e.target.value) })} />
          </Field>
          <Field label="Life stage">
            <Choice options={lifeStages} value={draft.lifeStage} onChange={(v) => setDraft({ lifeStage: v })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" hint="Two-letter code">
              <input className={inputClass} maxLength={2} value={draft.country ?? ""} onChange={(e) => setDraft({ country: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Currency" hint="Three-letter code">
              <input className={inputClass} maxLength={3} value={draft.currency ?? ""} onChange={(e) => setDraft({ currency: e.target.value.toUpperCase() })} />
            </Field>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Monthly income" hint="After tax, roughly">
            <input type="number" inputMode="decimal" min={0} className={inputClass} value={str(draft.monthlyIncome)} onChange={(e) => setDraft({ monthlyIncome: num(e.target.value) })} />
          </Field>
          <Field label="Monthly expenses" hint="Rent, food, transport, everything">
            <input type="number" inputMode="decimal" min={0} className={inputClass} value={str(draft.monthlyExpenses)} onChange={(e) => setDraft({ monthlyExpenses: num(e.target.value) })} />
          </Field>
          <Field label="Savings" hint="What you have right now">
            <input type="number" inputMode="decimal" min={0} className={inputClass} value={str(draft.savings)} onChange={(e) => setDraft({ savings: num(e.target.value) })} />
          </Field>
          <Field label="Debt" hint="Credit cards, loans — not HECS-HELP">
            <input type="number" inputMode="decimal" min={0} className={inputClass} value={str(draft.debt)} onChange={(e) => setDraft({ debt: num(e.target.value) })} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {goals.map((g, i) => (
            <div key={g.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-mist">Goal {i + 1}{i === 0 ? " · most important" : ""}</span>
                {goals.length > 1 && (
                  <button type="button" className="text-xs text-mist hover:text-danger" onClick={() => setGoals(goals.filter((x) => x.id !== g.id))}>
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Type">
                  <select className={inputClass} value={g.type} onChange={(e) => setGoals(goals.map((x) => (x.id === g.id ? { ...x, type: e.target.value as GoalType } : x)))}>
                    {goalTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="What is it?">
                  <input className={inputClass} placeholder="Trip to Japan" value={g.label} onChange={(e) => setGoals(goals.map((x) => (x.id === g.id ? { ...x, label: e.target.value } : x)))} />
                </Field>
                <Field label="Target amount" hint="Optional">
                  <input type="number" inputMode="decimal" min={0} className={inputClass} value={str(g.targetAmount)} onChange={(e) => setGoals(goals.map((x) => (x.id === g.id ? { ...x, targetAmount: num(e.target.value) } : x)))} />
                </Field>
                <Field label="By when" hint="Optional">
                  <input type="date" className={inputClass} value={g.targetDate ?? ""} onChange={(e) => setGoals(goals.map((x) => (x.id === g.id ? { ...x, targetDate: e.target.value || undefined } : x)))} />
                </Field>
              </div>
            </div>
          ))}
          {goals.length < 6 && (
            <Button variant="secondary" type="button" onClick={() => setGoals([...goals, { id: `g${Date.now()}`, type: "security", label: "", priority: goals.length + 1 }])}>
              + Add another goal
            </Button>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Field label="How would you describe your financial knowledge?">
            <Choice options={knowledgeLevels} value={draft.knowledge} onChange={(v) => setDraft({ knowledge: v })} />
          </Field>
          <Field label="How do you feel about risk?">
            <Choice options={risks} value={draft.risk} onChange={(v) => setDraft({ risk: v })} />
          </Field>
          <Field label="Anything else that matters?" hint="Optional — e.g. “security before risk”, “I want to enjoy my twenties”">
            <textarea rows={3} className={inputClass} value={draft.priorities ?? ""} onChange={(e) => setDraft({ priorities: e.target.value.slice(0, 500) || undefined })} />
          </Field>
        </div>
      )}

      {errors.length > 0 && (
        <ErrorNote>
          <ul className="list-disc space-y-1 pl-4">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </ErrorNote>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" type="button" onClick={() => (step === 0 ? router.push("/onboarding/freedom") : setStep(step - 1))}>
          ← Back
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={() => setStep(step + 1)}>Continue →</Button>
        ) : (
          <Button type="button" onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Create my Freedom Profile →"}
          </Button>
        )}
      </div>
    </div>
  );
}
