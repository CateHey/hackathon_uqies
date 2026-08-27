"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "./supabase/browser";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/** Is Supabase Auth configured for this build? (Inlined at build time — no client needed.) */
export const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** The signed-in person, `null` for guests, `undefined` while loading. */
export function useUser(): { user: CurrentUser | null | undefined; signOut: () => Promise<void> } {
  const [user, setUser] = useState<CurrentUser | null | undefined>(AUTH_ENABLED ? undefined : null);
  const qc = useQueryClient();

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let active = true;
    void sb.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ? { id: data.user.id, email: data.user.email ?? null } : null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const sb = supabaseBrowser();
    if (sb) await sb.auth.signOut();
    qc.clear();
    setUser(null);
  };

  return { user, signOut };
}
