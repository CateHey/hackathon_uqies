import { DemoButton } from "@/components/demo-button";
import { LinkButton } from "@/components/ui";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-12 py-12 text-center">
      <section className="max-w-2xl space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Free Me</p>
        <h1 className="font-display text-5xl leading-tight text-parchment sm:text-6xl">
          Discover <span className="text-gold">your</span> path to financial freedom.
        </h1>
        <p className="text-lg text-mist">
          Financial advice is everywhere. Personal direction isn&apos;t. Tell us what freedom means to you and we&apos;ll turn
          it into a journey you can actually see, understand and follow.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <LinkButton href="/onboarding/freedom">Start your journey</LinkButton>
          <DemoButton name="sarah" label="See Sarah's journey" />
        </div>
      </section>

      <section className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-ink-soft/70 p-6 text-left">
          <p className="text-2xl">🎮</p>
          <h2 className="mt-2 font-display text-xl">Explore</h2>
          <p className="mt-1 text-sm text-mist">Your journey as a world: villages, districts, bridges — and your own Freedom City at the end.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-soft/70 p-6 text-left">
          <p className="text-2xl">📊</p>
          <h2 className="mt-2 font-display text-xl">Professional</h2>
          <p className="mt-1 text-sm text-mist">The same plan as a plain dashboard: position, priorities, next steps, and what to learn.</p>
        </div>
      </section>

      <p className="font-display text-xl text-parchment/80">Your journey doesn&apos;t change. How you experience it does.</p>
    </div>
  );
}
