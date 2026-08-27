import { cookies } from "next/headers";
import { emptySession, getRepository, type StoredSession } from "./repository";
import { sessionIdForUser } from "./repository-supabase";
import { currentUserId } from "./supabase/server";

export const SESSION_COOKIE = "fm_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** The anonymous session id from the cookie; created on first contact when `create` is true. */
async function guestId(create: boolean): Promise<string | null> {
  const jar = await cookies();
  let id = jar.get(SESSION_COOKIE)?.value ?? null;
  if (!id && create) {
    id = crypto.randomUUID();
    jar.set(SESSION_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return id;
}

/** Signed-in people own "user:<uuid>"; everyone else has a guest cookie session. */
export async function getSessionId(): Promise<string> {
  const userId = await currentUserId();
  if (userId) return sessionIdForUser(userId);
  return (await guestId(true)) as string;
}

/**
 * Load the session for this request. The first time a signed-in person arrives with a
 * guest session that already holds a profile, that work is carried over to their account.
 */
export async function loadSession(): Promise<StoredSession> {
  const repo = getRepository();
  const userId = await currentUserId();

  if (userId) {
    const id = sessionIdForUser(userId);
    const existing = await repo.get(id);
    if (existing) return existing;

    const guest = await guestId(false);
    const guestSession = guest ? await repo.get(guest) : null;
    if (guest && guestSession?.profile) {
      const migrated = await repo.upsert({ ...guestSession, id });
      await repo.delete(guest);
      return migrated;
    }
    return emptySession(id);
  }

  const id = (await guestId(true)) as string;
  return (await repo.get(id)) ?? emptySession(id);
}

export async function saveSession(session: StoredSession): Promise<StoredSession> {
  return getRepository().upsert(session);
}
