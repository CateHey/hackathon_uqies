import Link from "next/link";
import { DemoButton } from "@/components/demo-button";
import { LinkButton } from "@/components/ui";

const steps = [
  { icon: "🎯", title: "Say what freedom means", text: "One sentence. Travel, a home, options — your version." },
  { icon: "🧠", title: "Get your Freedom Profile", text: "Your numbers, goals and knowledge become a map built for you." },
  { icon: "🚀", title: "Take the next step", text: "One clear action at a time, with the why behind every one." },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-14 py-10 text-center">
      <section className="max-w-3xl space-y-7">
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
          <span aria-hidden>🚀</span> Free Me
        </p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] text-parchment sm:text-7xl">
          Discover <span className="text-brand">your</span> path to financial freedom.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-mist sm:text-xl">
          Financial advice is everywhere. Personal direction isn&apos;t. Tell us what freedom means to you and we&apos;ll turn
          it into a journey you can actually see, understand and follow.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <LinkButton href="/onboarding/freedom" className="!px-7 !py-3 !text-base">Start your journey 🚀</LinkButton>
          <DemoButton name="sarah" label="See Sarah's journey" />
        </div>
        <p className="text-sm text-mist">
          or <Link href="/demo" className="text-accent-2 hover:underline">pick one of five personas</Link>
        </p>
      </section>

      <section className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-soft/70 p-6 text-left">
            <span className="absolute inset-x-0 top-0 h-1 bg-brand" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">Step {i + 1}</p>
            <p className="mt-3 text-2xl" aria-hidden>{s.icon}</p>
            <h2 className="mt-2 font-display text-xl font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-mist">{s.text}</p>
          </div>
        ))}
      </section>

      <section className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-left">
          <p className="text-2xl" aria-hidden>🎮</p>
          <h2 className="mt-2 font-display text-xl font-semibold">Explore</h2>
          <p className="mt-1 text-sm text-mist">Your journey as a world: villages, districts, bridges — and your own Freedom City at the end.</p>
        </div>
        <div className="rounded-2xl border border-accent-2/30 bg-accent-2/5 p-6 text-left">
          <p className="text-2xl" aria-hidden>📊</p>
          <h2 className="mt-2 font-display text-xl font-semibold">Professional</h2>
          <p className="mt-1 text-sm text-mist">The same plan as a plain dashboard: position, priorities, next steps, and what to learn.</p>
        </div>
      </section>

      <p className="font-display text-2xl font-semibold text-parchment/90">
        Your journey doesn&apos;t change. <span className="text-brand">How you experience it does.</span>
      </p>
    </div>
  );
}
