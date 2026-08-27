import { handle, json } from "@/lib/api";
import { planMode } from "@/lib/ai";
import { repositoryStatus, supabaseConfigured } from "@/lib/repository";
import { supabasePublicConfig } from "@/lib/supabase/server";

export const GET = handle(async () => {
  const status = await repositoryStatus();
  const dbReady = status.kind === "supabase" || !supabaseConfigured();
  return json(
    {
      ok: true,
      mode: planMode(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      db: status.kind,
      dbReady,
      dbError: status.error,
      auth: Boolean(supabasePublicConfig()),
    },
    { headers: { "cache-control": "no-store" } },
  );
});
