"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ApiClientError, useApi, useLoadDemo } from "@free-me/api-client";
import { useUiStore, type Mode } from "@/lib/store";

/**
 * "Try it without signing up": makes sure a journey exists in this browser's session
 * (loading Sarah's if there is none), optionally switches the mode, then navigates.
 */
export function TryLink({
  href,
  mode,
  className = "",
  children,
}: {
  href: string;
  mode?: Mode;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const api = useApi();
  const loadDemo = useLoadDemo();
  const setMode = useUiStore((s) => s.setMode);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      if (mode) setMode(mode);
      try {
        await api.getPlan();
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 404) await loadDemo.mutateAsync("vinuy");
        else throw e;
      }
      router.push(href);
    } catch {
      router.push("/demo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={go} disabled={busy} aria-busy={busy} className={`${className} ${busy ? "opacity-70" : ""}`}>
      {children}
    </button>
  );
}
