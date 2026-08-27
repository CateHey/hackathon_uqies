import { bundleFrom, handle, json } from "@/lib/api";
import { loadSession } from "@/lib/session";

export const GET = handle(async () => {
  const session = await loadSession();
  return json(bundleFrom(session));
});
