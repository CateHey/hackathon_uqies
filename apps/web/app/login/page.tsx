"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, ErrorNote } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { AUTH_ENABLED } from "@/lib/use-user";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-ink-soft px-3 py-2 text-parchment outline-none placeholder:text-mist/50 focus:border-accent/60";

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!AUTH_ENABLED) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold">Accounts aren&apos;t set up yet</h1>
        <p className="text-mist">You can still build and use your map as a guest — it lives in this browser.</p>
        <Link href="/onboarding/freedom" className="text-accent hover:underline">Start your journey →</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
      }
      // A different person may now own the session: drop any cached plan.
      qc.clear();
      router.push("/map");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-8 py-10">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-mist">🪙 PAYF</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-mist">
          {mode === "signin" ? "Your map, your progress — on every device." : "Keep your map and progress safe across devices."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-ink-soft/70 p-6">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input type="email" required autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <ErrorNote>{error}</ErrorNote>}
        {notice && <p className="rounded-xl border border-accent-2/40 bg-accent-2/10 p-3 text-sm">{notice}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="w-full text-center text-sm text-mist hover:text-parchment"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-mist">
        Or{" "}
        <Link href="/onboarding/freedom" className="text-accent hover:underline">
          continue as a guest
        </Link>{" "}
        — you can create an account later and keep everything.
      </p>
    </div>
  );
}
