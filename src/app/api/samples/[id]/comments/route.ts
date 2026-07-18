import { getAdminEmail, isAdminRequest } from "@/lib/admin-guard";
import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectPublicCommentText } from "@/lib/security";
import { commentsForSample, createStoredComment, loadSampleEngagement, saveSampleEngagement } from "@/lib/sample-engagement-store";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await loadSampleEngagement();
    return Response.json({ comments: commentsForSample(payload, id) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load sample comments") }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const ip = clientIpFromRequest(request);
  const limit = rateLimit({ key: `sample-comment:${ip}`, limit: 30, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  try {
    const { id } = await context.params;
    const body = await request.json();
    const text = String(body.text ?? "").trim();
    const authorName = String(body.author_name ?? body.authorName ?? "Guest").trim() || "Guest";
    const parentCommentId = String(body.parent_comment_id ?? body.parentCommentId ?? "").trim() || null;
    const isAdmin = Boolean(getAdminEmail(request, body) && isAdminRequest(request, body));

    if (!text) return Response.json({ error: "Comment text is required." }, { status: 400 });
    if (text.length > 1000) return Response.json({ error: "Comment is too long." }, { status: 400 });
    const suspicious = rejectPublicCommentText([text, authorName]);
    if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });

    const payload = await loadSampleEngagement();
    const comment = createStoredComment({ sampleId: id, parentCommentId, author: authorName, role: isAdmin ? "admin" : "user", text });
    payload.comments.push(comment);
    await saveSampleEngagement(payload);

    return Response.json({ comment, comments: commentsForSample(payload, id) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save sample comment") }, { status: 500 });
  }
}
