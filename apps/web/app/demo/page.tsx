import type { Metadata } from "next";
import { personas as profiles } from "@free-me/core";
import { DemoButton } from "@/components/demo-button";
import { PERSONAS, personaFacts } from "@/lib/personas";

export const metadata: Metadata = {
  title: "Demo personas",
  description: "Five finished journeys you can open without signing up.",
};

/** Five ready-made journeys — each opens a plan the model generated for that person. */
export default function DemoPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Demo</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Five people, five maps.</h1>
        <p className="mt-2 text-mist">
          Same product, same brain — a completely different journey for each. Open one, flip between Explore and
          Professional, tick a step, ask &ldquo;Why?&rdquo;.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {PERSONAS.map((p) => (
          <li key={p.key} className="flex flex-col justify-between rounded-2xl border border-white/10 bg-ink-soft/70 p-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>{p.emoji}</span>
                <div>
                  <h2 className="font-display text-2xl font-semibold">{p.name}</h2>
                  <p className="text-sm text-mist">{p.headline}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-parchment/90">{p.story}</p>
              <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm italic text-parchment/80">
                &ldquo;{profiles[p.key].freedomStatement}&rdquo;
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {personaFacts(p.key).map((f) => (
                  <li key={f} className="rounded-full border border-white/10 px-3 py-1 text-xs text-mist">{f}</li>
                ))}
              </ul>
            </div>
            <div className="mt-5">
              <DemoButton name={p.key} label={`Open ${p.name}'s journey →`} />
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-mist">
        Plans are generated once with the model and cached; opening a persona loads it into your session instantly. Demo
        accounts (email above, password shared by the team) hold the same journeys behind a login.
      </p>
    </div>
  );
}
