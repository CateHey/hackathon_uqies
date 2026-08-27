import { getLesson } from "@free-me/content";
import { personaliseLesson } from "@free-me/ai";
import { ApiError, bundleFrom, handle, textStream } from "@/lib/api";
import { getAiClient, planMode } from "@/lib/ai";
import { loadSession } from "@/lib/session";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) throw new ApiError(404, "not_found", `No lesson called "${id}".`);
  const session = await loadSession();
  const { profile, plan, metrics } = bundleFrom(session);

  if (planMode() !== "ai") {
    // No model available: stream the original with a short personal framing so the UI behaves identically.
    return textStream(framedOriginal(lesson.body, plan.profileSummary.headline, profile.freedomStatement));
  }
  return textStream(personaliseLesson({ lesson, profile, plan, metrics }, { client: getAiClient() }));
});

async function* framedOriginal(body: string, headline: string, freedomStatement: string): AsyncIterable<string> {
  yield `_Reading as: ${headline}. You said: "${freedomStatement}"_\n\n`;
  for (const paragraph of body.split(/\n\n/)) {
    yield `${paragraph}\n\n`;
    await new Promise((r) => setTimeout(r, 40));
  }
}
