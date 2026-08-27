import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { PlanBundle, type PlanBundle as PlanBundleT } from "@free-me/core";
import type { StoredSession } from "./repository";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

/** Parse and validate a JSON body with a shared schema; 400 on failure. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    throw new ApiError(400, "validation_error", detail);
  }
  return result.data;
}

/** The profile + plan + metrics trio every plan-aware route returns; 404 until a plan exists. */
export function bundleFrom(session: StoredSession): PlanBundleT {
  if (!session.profile) throw new ApiError(404, "no_profile", "No profile yet — complete onboarding first.");
  if (!session.plan || !session.metrics) throw new ApiError(404, "no_plan", "No plan yet — generate one first.");
  return PlanBundle.parse({ profile: session.profile, plan: session.plan, metrics: session.metrics });
}

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

/** Wraps a route handler so every failure becomes a typed `{ code, message }` JSON error. */
export function handle<Ctx = unknown>(fn: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return json({ code: e.code, message: e.message }, { status: e.status });
      if (e instanceof ZodError) return json({ code: "validation_error", message: e.message }, { status: 400 });
      if (e instanceof Error && e.name === "NotFoundError") return json({ code: "not_found", message: e.message }, { status: 404 });
      console.error("[api]", e);
      return json({ code: "internal_error", message: "Something went wrong on our side." }, { status: 500 });
    }
  };
}

/** Turn an async text iterator into a streamed text/plain response. */
export function textStream(iter: AsyncIterable<string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of iter) controller.enqueue(encoder.encode(chunk));
      } catch (e) {
        console.error("[api] stream interrupted", e);
        controller.enqueue(encoder.encode("\n\n_(The personalised version was interrupted — the original lesson is still available above.)_"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
