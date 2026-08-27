import { cookies } from "next/headers";
import { emptySession, getRepository, type StoredSession } from "./repository";

export const SESSION_COOKIE = "fm_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Reads the session cookie, creating one on first contact. Anonymous until Phase 4 adds accounts. */
export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(SESSION_COOKIE)?.value;
  if (!id) {
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

export async function loadSession(): Promise<StoredSession> {
  const id = await getSessionId();
  return (await getRepository().get(id)) ?? emptySession(id);
}

export async function saveSession(session: StoredSession): Promise<StoredSession> {
  return getRepository().upsert(session);
}
