import { handle, json } from "@/lib/api";
import { planMode } from "@/lib/ai";

export const GET = handle(async () =>
  json({
    ok: true,
    mode: planMode(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  }),
);
