"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { useApi, useLesson } from "@free-me/api-client";
import { Markdown } from "@/components/markdown";
import { Button, ErrorNote, Spinner } from "@/components/ui";

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const lesson = useLesson(id);
  const [personal, setPersonal] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const personalise = async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setPersonal("");
    setStreaming(true);
    setError(null);
    try {
      let acc = "";
      for await (const chunk of api.personaliseLesson(id, controller.signal)) {
        acc += chunk;
        setPersonal(acc);
      }
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Couldn't personalise this lesson.");
    } finally {
      setStreaming(false);
    }
  };

  if (lesson.isPending) return <Spinner label="Opening lesson…" />;
  if (lesson.isError) return <ErrorNote>{lesson.error.message}</ErrorNote>;
  const l = lesson.data;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link href="/map" className="text-sm text-mist hover:text-parchment">← Back to your map</Link>
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-mist">📚 {l.level} · {l.readingMinutes} min · {l.topics.join(" · ")}</p>
        <h1 className="mt-2 font-display text-4xl">{l.title}</h1>
        <p className="mt-2 text-mist">{l.summary}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-4">
        <p className="flex-1 text-sm text-parchment">Read this as written, or have it rewritten around your goals and level.</p>
        <Button onClick={personalise} disabled={streaming}>{streaming ? "Personalising…" : personal === null ? "Personalise for me" : "Personalise again"}</Button>
        {personal !== null && !streaming && (
          <Button variant="ghost" onClick={() => setPersonal(null)}>Show original</Button>
        )}
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="rounded-3xl border border-white/10 bg-ink-soft/60 p-6 sm:p-8">
        {personal === null ? <Markdown text={l.body} /> : <Markdown text={personal || "…"} />}
        {streaming && <p className="mt-4"><Spinner label="Writing…" /></p>}
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-2xl">Quick check</h2>
        {l.quickCheck.map((q, i) => (
          <details key={i} className="rounded-2xl border border-white/10 p-4">
            <summary className="cursor-pointer font-medium text-parchment">{q.question}</summary>
            <p className="mt-2 text-sm text-parchment/90">{q.answer}</p>
          </details>
        ))}
      </section>
    </article>
  );
}
