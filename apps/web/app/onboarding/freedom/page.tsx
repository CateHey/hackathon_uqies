"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useUiStore } from "@/lib/store";

const examples = [
  "I want to be able to travel without worrying about money.",
  "Owning my own place and not having to answer to a landlord.",
  "Leaving a job I don't love without panicking about rent.",
  "Enough saved that a surprise bill is just a bill.",
  "Building wealth while I'm young so I have options later.",
];

export default function FreedomPage() {
  const router = useRouter();
  const draft = useUiStore((s) => s.draft);
  const setDraft = useUiStore((s) => s.setDraft);
  const [value, setValue] = useState(draft.freedomStatement ?? "");
  const ok = value.trim().length >= 10;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Step 1 of 3</p>
        <h1 className="mt-2 font-display text-4xl">🕊️ What does freedom mean to you?</h1>
        <p className="mt-2 text-mist">There is no universal path. Yours starts with your answer.</p>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 500))}
        rows={4}
        placeholder="For me, freedom means…"
        className="w-full rounded-2xl border border-white/10 bg-ink-soft p-4 text-lg text-parchment outline-none placeholder:text-mist/60 focus:border-gold/60"
      />

      <div className="flex flex-wrap gap-2">
        {examples.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setValue(e)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-left text-sm text-mist hover:border-gold/50 hover:text-parchment"
          >
            {e}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!ok}
          onClick={() => {
            setDraft({ freedomStatement: value.trim() });
            router.push("/onboarding/situation");
          }}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
