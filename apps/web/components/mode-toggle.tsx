"use client";

import { motion } from "framer-motion";
import { useUiStore, type Mode } from "@/lib/store";

const options: { value: Mode; label: string; icon: string }[] = [
  { value: "explore", label: "Explore", icon: "🎮" },
  { value: "professional", label: "Professional", icon: "📊" },
];

/** The one control that turns the world into a dashboard. Same plan, different face. */
export function ModeToggle() {
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);
  return (
    <div role="radiogroup" aria-label="View mode" className="relative flex rounded-full border border-white/10 bg-ink-soft p-1">
      {options.map((o) => {
        const selected = o.value === mode;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={selected}
            onClick={() => setMode(o.value)}
            className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition ${selected ? "text-ink" : "text-mist hover:text-parchment"}`}
          >
            {selected && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 -z-10 rounded-full bg-gold"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="mr-1.5">{o.icon}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
