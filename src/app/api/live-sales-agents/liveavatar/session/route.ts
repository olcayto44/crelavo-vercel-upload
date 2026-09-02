import { requireVerifiedRequestUser } from "@/lib/supabase";

const clean = (value: unknown) => String(value ?? "").trim();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = clean(body.user_id);
    const agentId = clean(body.agent_id);
    if (!userId || !agentId) return Response.json({ error: "user_id and agent_id are required." }, { status: 400 });

    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;

    const apiKey = clean(process.env.HEYGEN_API_KEY || process.env.HEYGEN_KEY);
    const avatarId = clean(process.env.HEYGEN_LIVEAVATAR_AVATAR_ID || process.env.HEYGEN_STREAMING_AVATAR_ID);
    const contextId = clean(process.env.HEYGEN_LIVEAVATAR_CONTEXT_ID);
    const voiceId = clean(process.env.HEYGEN_LIVEAVATAR_VOICE_ID);
    if (!apiKey) return Response.json({ error: "HeyGen API key is not configured." }, { status: 503 });
    if (!avatarId) return Response.json({ error: "HeyGen LiveAvatar avatar ID is not configured." }, { status: 503 });
    if (!voiceId && !contextId) return Response.json({ error: "HeyGen LiveAvatar voice or context configuration is missing." }, { status: 503 });

    const persona: Record<string, unknown> = { language: clean(body.language) || "en" };
    if (voiceId) persona.voice_id = voiceId;
    if (contextId) persona.context_id = contextId;

    const response = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ mode: "FULL", avatar_id: avatarId, avatar_persona: persona })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
      const upstreamMessage = clean(detail.message || detail.error || detail.detail);
      return Response.json({ error: upstreamMessage ? `HeyGen LiveAvatar token isteği başarısız oldu: ${upstreamMessage}` : "HeyGen LiveAvatar token isteği başarısız oldu.", status: response.status }, { status: response.status });
    }

    const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
    const sessionId = clean(data.session_id || data.sessionId);
    const sessionToken = clean(data.session_token || data.sessionToken || data.token);
    if (!sessionId || !sessionToken) return Response.json({ error: "HeyGen LiveAvatar returned an incomplete session token." }, { status: 502 });

    return Response.json({ provider: "heygen_liveavatar", agent_id: agentId, session_id: sessionId, session_token: sessionToken, mode: "FULL" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not create HeyGen LiveAvatar session." }, { status: 500 });
  }
}
