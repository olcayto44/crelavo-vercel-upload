import { createHeyGenVideoAgentSession, getHeyGenVideoAgentSession, normalizeHeyGenVideoAgentArtifacts } from "@/lib/providers/heygen";

type HeyGenAgentRequest = {
  userMessage?: string;
  prompt?: string;
  sessionId?: string;
  orientation?: "portrait" | "landscape";
  files?: Array<{ type: "url"; url: string } | { type: "asset_id"; asset_id: string }>;
};

function sessionRoot(payload: unknown) {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
}

function firstSessionId(payload: unknown) {
  const root = sessionRoot(payload);
  return String(root.session_id ?? root.sessionId ?? root.id ?? "").trim();
}

function firstStatus(payload: unknown) {
  const root = sessionRoot(payload);
  return String(root.status ?? root.state ?? "generating").trim();
}

function firstReply(payload: unknown, fallback: string) {
  const root = sessionRoot(payload);
  const direct = String(root.chat_message ?? root.chatMessage ?? root.message ?? root.reply ?? "").trim();
  if (direct) return direct;
  return fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as HeyGenAgentRequest;
    const userMessage = String(body.userMessage ?? body.prompt ?? "").trim();
    if (!userMessage) return Response.json({ error: "userMessage is required." }, { status: 400 });

    const result = await createHeyGenVideoAgentSession({
      prompt: userMessage,
      mode: "generate",
      orientation: body.orientation === "landscape" ? "landscape" : "portrait",
      files: Array.isArray(body.files) ? body.files : undefined,
      incognito_mode: true
    });

    const sessionId = firstSessionId(result);
    const status = firstStatus(result);
    const artifacts = normalizeHeyGenVideoAgentArtifacts(result);
    return Response.json({
      reply: firstReply(result, sessionId ? `HeyGen Video Agent session started: ${sessionId}` : "HeyGen Video Agent request was accepted."),
      sessionId,
      status,
      artifacts,
      raw: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HeyGen Video Agent request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") || url.searchParams.get("session_id") || "";
    if (!sessionId) return Response.json({ error: "sessionId is required." }, { status: 400 });
    const result = await getHeyGenVideoAgentSession(sessionId);
    return Response.json({
      reply: firstReply(result, `HeyGen Video Agent session status: ${firstStatus(result)}`),
      sessionId,
      status: firstStatus(result),
      artifacts: normalizeHeyGenVideoAgentArtifacts(result),
      raw: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HeyGen Video Agent status failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
