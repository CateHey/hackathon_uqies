import Link from "next/link";
import { lessons } from "@free-me/content";

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">Learn</p>
        <h1 className="mt-1 font-display text-4xl">What you need, when you need it.</h1>
        <p className="mt-2 text-mist">Every lesson can be rewritten for your goals and level from inside the lesson.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => (
          <li key={l.id}>
            <Link href={`/lessons/${l.id}`} className="block h-full rounded-2xl border border-white/10 bg-ink-soft/60 p-4 hover:border-accent/50">
              <p className="text-xs uppercase tracking-wider text-mist">📚 {l.level} · {l.readingMinutes} min</p>
              <p className="mt-1 font-medium text-parchment">{l.title}</p>
              <p className="mt-1 text-sm text-mist">{l.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
