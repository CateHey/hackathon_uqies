import Link from "next/link";
import { BRAND } from "@free-me/core";
import { DemoButton } from "@/components/demo-button";
import { TryLink } from "@/components/try-link";
import { LinkButton } from "@/components/ui";

const steps = [
  { icon: "🎯", title: "Name what you're saving for", text: "One goal or five. An amount, and a date if you have one." },
  { icon: "🪙", title: "See what to put aside", text: "The split across your goals, worked out from what you actually earn." },
  { icon: "🧭", title: "Find the way there", text: "Behind? See what it takes: save more, earn more, or take longer." },
];

const features: { icon: string; title: string; text: string; href: string; cta: string; demo?: boolean }[] = [
  { icon: "🪙", title: "Your monthly split", text: "Safety net first, then each goal by how close its deadline is, then what's left over.", href: "/save", cta: "See the split" },
  { icon: "🧭", title: "Ways to get there", text: "Save a bigger share, earn more, grow into it, or take longer — with the real number on each.", href: "/save", cta: "Explore the futures" },
  { icon: "🖼️", title: "Vision board", text: "Every goal with a picture and how far along you are. Edit what you've already set aside.", href: "/vision", cta: "Open the board" },
  { icon: "🔀", title: "What if you dropped one", text: "Switch a goal off and watch the money move to the ones that are left.", href: "/save", cta: "Try a scenario" },
  { icon: "🗺️", title: "The journey map", text: "The same plan as a world you move through — or as a plain dashboard.", href: "/map", cta: "Open the map" },
  { icon: "📚", title: "Lessons, personalised", text: "Ten short lessons that rewrite themselves around your goals and level.", href: "/learn", cta: "Browse lessons" },
];

const cardClass =
  "group block h-full w-full rounded-2xl border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-14 py-10 text-center">
      <section className="max-w-3xl space-y-7">
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
          <span aria-hidden>🪙</span> {BRAND.short}
        </p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] text-parchment sm:text-7xl">
          Pay <span className="text-brand">yourself</span> first.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-mist sm:text-xl">
          {BRAND.tagline} Tell us what you&apos;re saving for and we&apos;ll work out what to put aside each month —
          and, when the numbers don&apos;t work, exactly what would change that.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <LinkButton href="/onboarding/freedom" className="!px-7 !py-3 !text-base">Start your plan 🪙</LinkButton>
          <DemoButton name="vinuy" label="See Vinuy's plan" href="/save" />
        </div>
        <p className="text-sm text-mist">
          No account needed — everything below works as a guest.{" "}
          <Link href="/demo" className="text-accent-2 hover:underline">Or meet all five people.</Link>
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

      <section className="w-full max-w-5xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-mist">What&apos;s inside</p>
          <h2 className="mt-1 font-display text-3xl font-semibold">Try every part of it right now.</h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="h-full">
              <TryLink href={f.href} className={`${cardClass} border-white/10 bg-ink-soft/70 hover:border-white/25`}>
                <p className="text-2xl" aria-hidden>{f.icon}</p>
                <h3 className="mt-2 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-mist">{f.text}</p>
                <p className="mt-3 text-sm font-semibold text-accent-soft group-hover:underline">{f.cta} →</p>
              </TryLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="w-full max-w-3xl rounded-2xl border border-accent-2/30 bg-accent-2/5 p-6 text-left">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-2-soft">The part most apps skip</p>
        <p className="mt-2 text-lg text-parchment">
          When a goal doesn&apos;t work, PAYF says so — and shows what would.
        </p>
        <p className="mt-2 text-sm text-mist">
          &ldquo;It would take about 26% growth a year to arrive on time — far beyond what any plan should count on.
          The amount or the date has to move.&rdquo;
        </p>
      </section>

      <p className="font-display text-2xl font-semibold text-parchment/90">
        Before the bills, before the rest. <span className="text-brand">Pay yourself first.</span>
      </p>
    </div>
  );
}
