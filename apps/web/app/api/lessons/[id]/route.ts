import { getLesson } from "@free-me/content";
import { ApiError, handle, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) throw new ApiError(404, "not_found", `No lesson called "${id}".`);
  return json(lesson, { headers: { "cache-control": "public, max-age=3600" } });
});
