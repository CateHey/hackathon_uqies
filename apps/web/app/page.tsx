import Link from "next/link";
import { DemoButton } from "@/components/demo-button";
import { TryLink } from "@/components/try-link";
import { LinkButton } from "@/components/ui";

const steps = [
  { icon: "🎯", title: "Say what freedom means", text: "One sentence. Travel, a home, options — your version." },
  { icon: "🧠", title: "Get your Freedom Profile", text: "Your numbers, goals and knowledge become a map built for you." },
  { icon: "🚀", title: "Take the next step", text: "One clear action at a time, with the why behind every one." },
];

const features: { icon: string; title: string; text: string; href: string; mode?: "explore" | "professional"; cta: string }[] = [
  { icon: "🗺️", title: "Your Freedom Map", text: "Villages, districts and bridges. Finish a step and the next path opens.", href: "/map", mode: "explore", cta: "Open the map" },
  { icon: "❓", title: "Why? on everything", text: "Every region, bridge and step explains itself with your own numbers.", href: "/map/security", cta: "See a why" },
  { icon: "🌉", title: "Bridges = trade-offs", text: "Investing vs. a deposit, saving vs. a trip — the map shows how goals compete.", href: "/map/growth", cta: "Look at a bridge" },
  { icon: "📚", title: "Lessons, personalised", text: "Ten lessons that rewrite themselves around your goals and level.", href: "/learn", cta: "Browse lessons" },
  { icon: "💰", title: "I have money to allocate", text: "Type an amount, get a split with reasons, adjust it, save it to your plan.", href: "/allocate", cta: "Try an allocation" },
  { icon: "⚡", title: "Instant map, AI upgrade", text: "Your map appears in a second; the personalised version arrives in the background.", href: "/onboarding/freedom", cta: "Build your own" },
];

const cardClass =
  "group block h-full w-full rounded-2xl border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]";

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
          No account needed — everything below works as a guest.{" "}
          <Link href="/demo" className="text-accent-2 hover:underline">Or pick one of five personas.</Link>
        </p>
      </section>

      <section className="grid w-full max-w-4xl gap-4 sm:grid-cols-2" aria-label="Two ways to experience your plan">
        <TryLink href="/map" mode="explore" className={`${cardClass} border-accent/30 bg-accent/5 hover:border-accent/60`}>
          <p className="text-2xl" aria-hidden>🎮</p>
          <h2 className="mt-2 font-display text-xl font-semibold">Explore</h2>
          <p className="mt-1 text-sm text-mist">Your journey as a world: villages, districts, bridges — and your own Freedom City at the end.</p>
          <p className="mt-4 text-sm font-semibold text-accent group-hover:underline">Open in Explore mode →</p>
        </TryLink>
        <TryLink href="/map" mode="professional" className={`${cardClass} border-accent-2/30 bg-accent-2/5 hover:border-accent-2/60`}>
          <p className="text-2xl" aria-hidden>📊</p>
          <h2 className="mt-2 font-display text-xl font-semibold">Professional</h2>
          <p className="mt-1 text-sm text-mist">The same plan as a plain dashboard: position, priorities, next steps, and what to learn.</p>
          <p className="mt-4 text-sm font-semibold text-accent-2 group-hover:underline">Open in Professional mode →</p>
        </TryLink>
      </section>

      <section className="w-full max-w-5xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-mist">What&apos;s inside</p>
          <h2 className="mt-1 font-display text-3xl font-semibold">Try every feature right now.</h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="h-full">
              {f.mode === undefined && f.href.startsWith("/onboarding") ? (
                <Link href={f.href} className={`${cardClass} border-white/10 bg-ink-soft/70 hover:border-white/25`}>
                  <FeatureBody {...f} />
                </Link>
              ) : (
                <TryLink href={f.href} mode={f.mode} className={`${cardClass} border-white/10 bg-ink-soft/70 hover:border-white/25`}>
                  <FeatureBody {...f} />
                </TryLink>
              )}
            </li>
          ))}
        </ul>
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

      <p className="font-display text-2xl font-semibold text-parchment/90">
        Your journey doesn&apos;t change. <span className="text-brand">How you experience it does.</span>
      </p>
    </div>
  );
}

function FeatureBody({ icon, title, text, cta }: { icon: string; title: string; text: string; cta: string }) {
  return (
    <>
      <p className="text-2xl" aria-hidden>{icon}</p>
      <h3 className="mt-2 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-mist">{text}</p>
      <p className="mt-3 text-sm font-semibold text-accent-soft group-hover:underline">{cta} →</p>
    </>
  );
}
