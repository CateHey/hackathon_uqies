"use client";

import { BRAND, DISCLAIMER } from "@free-me/core";
import { useUiStore } from "@/lib/store";

export function DisclaimerBanner() {
  const seen = useUiStore((s) => s.disclaimerSeen);
  const dismiss = useUiStore((s) => s.setDisclaimerSeen);
  if (seen) return null;
  return (
    <div role="note" className="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-parchment">
      <p>
        <span className="mr-2">ℹ️</span>
        {DISCLAIMER}
      </p>
      <button onClick={dismiss} className="shrink-0 rounded-full px-3 py-1 text-xs text-mist hover:bg-white/10 hover:text-parchment">
        Got it
      </button>
    </div>
  );
}

export function DisclaimerFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-mist">
      {BRAND.short} provides general financial education, not personal financial advice.
    </footer>
  );
}
