# Supabase

Free Me uses Supabase for Postgres (sessions + plan history) and Auth (email/password, optional Google).

## Apply the schema (once per project)

Option A — SQL editor (no CLI needed):
1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the contents of `migrations/0001_init.sql` → **Run**.

Option B — CLI:
```
npx supabase login
npx supabase link --project-ref <your-project-ref>
pnpm db:push
```

Check it worked: `curl http://localhost:3000/api/health` → `"db":"supabase","dbReady":true`, or run
`pnpm db:test` (a round-trip test that is skipped when Supabase isn't configured).

## Auth settings for the hackathon

- **Authentication → Providers → Email**: enabled. For a demo, turn **Confirm email** off so sign-up works without
  an inbox; turn it back on before anything public.
- Google / Apple can be added later (Phase 6 needs Apple for iOS).

## What lives where

| Table | Purpose |
|---|---|
| `sessions` | one document per guest cookie or signed-in user — the `StoredSession` the app already uses |
| `plans` | append-only history of every plan generated, with token usage (cost tracking) |

The API writes with the **service-role key** (server only). Row-level security lets a signed-in person read only
their own rows if a client ever talks to Supabase directly.
