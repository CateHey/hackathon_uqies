/**
 * Create demo accounts in Supabase, each pre-loaded with a persona's journey, so judges
 * can sign in and see a finished map. Idempotent — re-running resets the plans.
 *
 *   pnpm --filter web seed:demo            (password: FreeMe-demo-2026, or DEMO_PASSWORD)
 *
 * Reads apps/web/.env.local itself; nothing is printed except emails and the password.
 */
import { createClient } from "@supabase/supabase-js";
import { demoBundle } from "../lib/demo";
import { PERSONAS } from "../lib/personas";
import { emptySession } from "../lib/repository";
import { sessionIdForUser } from "../lib/repository-supabase";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
} catch {
  // fall through — the check below explains
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}
const PASSWORD = process.env.DEMO_PASSWORD ?? "FreeMe-demo-2026";
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function ensureUser(email: string, name: string): Promise<string> {
  const created = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { demo: true, name },
  });
  if (created.data.user) return created.data.user.id;

  // Already exists → find it and make sure the password/confirmation are as documented.
  const list = await db.auth.admin.listUsers({ perPage: 1000 });
  if (list.error) throw list.error;
  const existing = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) throw created.error ?? new Error(`could not create or find ${email}`);
  const updated = await db.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
  if (updated.error) throw updated.error;
  return existing.id;
}

async function main() {
  console.log(`Seeding ${PERSONAS.length} demo accounts into ${new URL(url ?? "").host}\n`);
  for (const persona of PERSONAS) {
    const userId = await ensureUser(persona.email, persona.name);
    const sessionId = sessionIdForUser(userId);
    const { bundle, source } = demoBundle(persona.key);

    const session = {
      ...emptySession(sessionId),
      profile: bundle.profile,
      plan: bundle.plan,
      metrics: bundle.metrics,
      planMode: "demo" as const,
    };
    const up = await db
      .from("sessions")
      .upsert({ id: sessionId, user_id: userId, data: session, updated_at: session.updatedAt }, { onConflict: "id" });
    if (up.error) throw new Error(`sessions.upsert: ${up.error.message}`);

    const hist = await db.from("plans").insert({
      session_id: sessionId,
      user_id: userId,
      version: bundle.plan.version,
      source: bundle.plan.source,
      mode: "demo",
      plan: bundle.plan,
      metrics: bundle.metrics,
    });
    if (hist.error) throw new Error(`plans.insert: ${hist.error.message}`);

    console.log(`  ${persona.emoji} ${persona.name.padEnd(6)} ${persona.email.padEnd(26)} plan: ${source} · priority ${bundle.plan.currentPriorityRegionId}`);
  }
  console.log(`\nPassword for all demo accounts: ${PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
