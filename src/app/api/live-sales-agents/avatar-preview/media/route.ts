import { getHeyGenVideoAgentSession, getHeyGenVideoStatus, normalizeHeyGenVideoAgentArtifacts } from "@/lib/providers/heygen";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

const clean = (value: unknown) => String(value ?? "").trim();

function walk(value: unknown, visit: (record: Record<string, unknown>) => void, seen = new WeakSet<object>()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) { value.forEach((item) => walk(item, visit, seen)); return; }
  const record = value as Record<string, unknown>;
  visit(record);
  Object.values(record).forEach((nested) => walk(nested, visit, seen));
}

function firstUrl(value: unknown) {
  let found = "";
  walk(value, (record) => {
    if (found) return;
    for (const key of ["url", "video_url", "videoUrl", "download_url", "downloadUrl", "preview_url", "previewUrl"]) {
      if (typeof record[key] === "string" && /^https:\/\//i.test(record[key] as string)) { found = record[key] as string; return; }
    }
  });
  return found;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const userId = clean(params.get("user_id"));
    const agentId = clean(params.get("agent_id"));
    if (!userId || !agentId) return Response.json({ error: "user_id and agent_id are required." }, { status: 400 });
    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;
    const { data: agent, error } = await supabaseAdmin().from("live_sales_agents").select("metadata").eq("agent_id", agentId).eq("user_id", userId).maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!agent) return Response.json({ error: "Live sales agent not found." }, { status: 404 });
    const metadata = agent.metadata && typeof agent.metadata === "object" ? agent.metadata as Record<string, unknown> : {};
    const preview = metadata.avatarPreview && typeof metadata.avatarPreview === "object" ? metadata.avatarPreview as Record<string, unknown> : {};
    let mediaUrl = clean(preview.previewUrl);
    const sessionId = clean(preview.sessionId ?? preview.session_id);
    if (sessionId && clean(preview.provider) === "heygen") {
      const sessionResult = await getHeyGenVideoAgentSession(sessionId);
      mediaUrl = firstUrl(normalizeHeyGenVideoAgentArtifacts(sessionResult)) || firstUrl(sessionResult) || mediaUrl;
      if (!mediaUrl && clean(preview.videoId)) {
        const videoResult = await getHeyGenVideoStatus(clean(preview.videoId));
        mediaUrl = firstUrl(normalizeHeyGenVideoAgentArtifacts(videoResult)) || firstUrl(videoResult);
      }
    }
    if (!mediaUrl) return Response.json({ error: "Avatar preview media is not ready." }, { status: 404 });
    const upstream = await fetch(mediaUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) return Response.json({ error: `Avatar preview media unavailable: ${upstream.status}` }, { status: 502 });
    return new Response(upstream.body, { headers: { "Content-Type": upstream.headers.get("content-type") || "video/mp4", "Content-Disposition": "inline; filename=avatar-preview.mp4", "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not open avatar preview." }, { status: 500 });
  }
}
