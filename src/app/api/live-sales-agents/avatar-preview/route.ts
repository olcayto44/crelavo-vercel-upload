import { createHeyGenVideoAgentSession, getHeyGenVideoAgentSession, getHeyGenVideoStatus, normalizeHeyGenVideoAgentArtifacts } from "@/lib/providers/heygen";
import { createMiniMaxH3VideoTask, hasMiniMaxConfig, queryMiniMaxH3VideoTask } from "@/lib/providers/minimax";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function hasHeyGenConfig() {
  return Boolean(process.env.HEYGEN_API_KEY || process.env.HEYGEN_KEY);
}

function routeForAvatarSource(_source: string) {
  return "minimax_live_sales_avatar_preview";
}

function previewPrompt(input: Record<string, unknown>) {
  return [
    "Create a short 8-12 second live sales avatar preview for Crelavo.",
    `Industry: ${clean(input.industry) || "E-commerce / Retail"}.`,
    `Platform: ${clean(input.platform) || "Own website"}.`,
    `Avatar source: ${clean(input.avatar_source) || "Ready avatar"}.`,
    `Avatar role: ${clean(input.avatar_role) || "All-in-one host"}.`,
    `Language: ${clean(input.language) || "English"}.`,
    `Voice/tone: ${clean(input.voice) || "Natural Female"} / ${clean(input.tone) || "Warm"}.`,
    `Product or offer context: ${clean(input.product_info) || "Present the product clearly and invite the customer to ask questions."}`,
    "The output should feel like a premium, professional sales assistant preview, not a generic demo.",
    "Keep the avatar fully inside frame, centered cleanly, with the full head visible and no cropping at the top.",
    "Use the Crelavo brand name only once in the frame, in the top-left area. Do not repeat the Crelavo name anywhere else on the video.",
    "Keep the upper area clean and uncluttered. Do not place any extra heading, duplicate brand text, or text above the avatar head.",
    "Use a calm, confident presentation style, natural lip sync, minimal mechanical motion, and a premium studio look.",
    "Show the avatar introducing the offer and inviting the visitor to ask about product, shipping, price, or order support."
  ].join("\n");
}

function firstPreviewUrl(artifacts: Array<{ previewUrl?: string }>) {
  return artifacts.find((artifact) => artifact.previewUrl)?.previewUrl || "";
}

function sessionRoot(payload: unknown) {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
}

function sessionStatus(payload: unknown) {
  const root = sessionRoot(payload);
  return clean(root.status ?? root.state ?? root.video_status ?? root.videoStatus) || "generating";
}

function firstNestedString(payload: unknown, keys: string[]): string {
  const visited = new WeakSet<object>();
  let found = "";
  walk(payload, (record) => {
    if (found) return;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        found = value.trim();
        return;
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        found = String(value);
        return;
      }
    }
  }, visited);
  return found;
}

function walk(value: unknown, visit: (record: Record<string, unknown>) => void, seen = new WeakSet<object>()) {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit, seen);
    return;
  }
  const record = value as Record<string, unknown>;
  visit(record);
  for (const nested of Object.values(record)) walk(nested, visit, seen);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = clean(searchParams.get("user_id"));
    const agentId = clean(searchParams.get("agent_id"));
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
    if (!agentId) return Response.json({ error: "agent_id is required." }, { status: 400 });

    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;

    const supabase = supabaseAdmin();
    const { data: agent, error: loadError } = await supabase
      .from("live_sales_agents")
      .select("*")
      .eq("agent_id", agentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!agent) return Response.json({ error: "Live sales agent not found." }, { status: 404 });

    const metadata = agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata) ? agent.metadata as Record<string, unknown> : {};
    const previousPreview = metadata.avatarPreview && typeof metadata.avatarPreview === "object" && !Array.isArray(metadata.avatarPreview)
      ? metadata.avatarPreview as Record<string, unknown>
      : {};
    const provider = clean(previousPreview.provider);
    const sessionId = clean(previousPreview.sessionId ?? previousPreview.session_id);

    if (!previousPreview || !provider) return Response.json({ error: "Avatar preview has not been started yet." }, { status: 400 });
    if (provider === "minimax") {
      if (!sessionId) return Response.json({ error: "MiniMax task id is missing." }, { status: 400 });
      const result = await queryMiniMaxH3VideoTask(sessionId);
      const task = result.task ?? {};
      const nextPreview = { ...previousPreview, provider: "minimax", route: "minimax_live_sales_avatar_preview", status: clean(task.status) || "running", sessionId, videoId: sessionId, previewUrl: clean(task.content?.url) || clean(previousPreview.previewUrl), checkedAt: new Date().toISOString(), rawTask: task };
      const { data, error } = await supabase.from("live_sales_agents").update({ metadata: { ...metadata, avatarPreview: nextPreview }, updated_at: new Date().toISOString() }).eq("agent_id", agentId).select("*").single();
      if (error) throw error;
      return Response.json({ avatar_preview: nextPreview, agent: data, raw: result });
    }
    if (provider !== "heygen") return Response.json({ avatar_preview: previousPreview, agent });
    if (!sessionId) return Response.json({ error: "HeyGen session id is missing." }, { status: 400 });

    const result = await getHeyGenVideoAgentSession(sessionId);
    const artifacts = normalizeHeyGenVideoAgentArtifacts(result);
    const currentStatus = sessionStatus(result);
    const videoId = firstNestedString(result, ["video_id", "videoId", "id", "resource_id", "resourceId", "output_video_id", "outputVideoId"]);
    let videoPreviewUrl = firstPreviewUrl(artifacts) || clean(previousPreview.previewUrl);

    if (currentStatus === "completed" && !videoPreviewUrl && videoId) {
      try {
        const videoStatus = await getHeyGenVideoStatus(videoId);
        const videoArtifacts = normalizeHeyGenVideoAgentArtifacts(videoStatus);
        videoPreviewUrl = firstPreviewUrl(videoArtifacts) || firstNestedString(videoStatus, ["url", "video_url", "videoUrl", "download_url", "downloadUrl", "preview_url", "previewUrl"]);
        artifacts.push(...videoArtifacts);
      } catch {
        // keep the session preview result even if the secondary lookup fails
      }
    }

    const nextPreview = {
      ...previousPreview,
      provider: "heygen",
      status: currentStatus,
      sessionId,
      videoId: videoId || clean(previousPreview.videoId),
      previewUrl: videoPreviewUrl,
      artifacts,
      checkedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("live_sales_agents")
      .update({ metadata: { ...metadata, avatarPreview: nextPreview }, updated_at: new Date().toISOString() })
      .eq("agent_id", agentId)
      .select("*")
      .single();
    if (error) throw error;

    return Response.json({ avatar_preview: nextPreview, agent: data, raw: result });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not refresh avatar preview status.") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = clean(body.user_id);
    const agentId = clean(body.agent_id);
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
    if (!agentId) return Response.json({ error: "agent_id is required." }, { status: 400 });

    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;

    const supabase = supabaseAdmin();
    const { data: agent, error: loadError } = await supabase
      .from("live_sales_agents")
      .select("*")
      .eq("agent_id", agentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!agent) return Response.json({ error: "Live sales agent not found. Save the avatar setup first." }, { status: 404 });

    const providerRoute = routeForAvatarSource(agent.avatar_source || body.avatar_source || "Ready avatar");
    const metadata = agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata) ? agent.metadata as Record<string, unknown> : {};
    const requestedAt = new Date().toISOString();

    if (providerRoute === "minimax_live_sales_avatar_preview") {
      if (!hasMiniMaxConfig()) {
        const avatarPreview = { provider: "minimax", route: providerRoute, status: "waiting_minimax_provider_config", requestedAt, prompt: previewPrompt(agent), message: "MiniMax API configuration is required before avatar preview generation can start." };
        const { data, error } = await supabase.from("live_sales_agents").update({ metadata: { ...metadata, avatarPreview }, updated_at: requestedAt }).eq("agent_id", agentId).select("*").single();
        if (error) throw error;
        return Response.json({ avatar_preview: avatarPreview, agent: data }, { status: 424 });
      }
      const result = await createMiniMaxH3VideoTask({ content: [{ type: "text", text: previewPrompt(agent) }], resolution: "768P", duration: 10, ratio: "9:16" });
      const sessionId = clean(result.task_id ?? result.request_id);
      if (!sessionId) throw new Error("MiniMax avatar preview did not return a task id.");
      const avatarPreview = { provider: "minimax", route: providerRoute, status: "queued", sessionId, videoId: sessionId, previewUrl: "", requestedAt, prompt: previewPrompt(agent), message: "MiniMax avatar preview generation started." };
      const { data, error } = await supabase.from("live_sales_agents").update({ metadata: { ...metadata, avatarPreview }, updated_at: requestedAt }).eq("agent_id", agentId).select("*").single();
      if (error) throw error;
      return Response.json({ avatar_preview: avatarPreview, agent: data, raw: result });
    }

    if (!hasHeyGenConfig()) {
      const avatarPreview = {
        provider: "heygen",
        route: providerRoute,
        status: "waiting_provider_config",
        requestedAt,
        prompt: previewPrompt(agent),
        message: "HeyGen API key is not configured in this environment. Provider preview route is ready, but production cannot start until provider credentials are available."
      };
      const { data, error } = await supabase
        .from("live_sales_agents")
        .update({ metadata: { ...metadata, avatarPreview }, updated_at: requestedAt })
        .eq("agent_id", agentId)
        .select("*")
        .single();
      if (error) throw error;
      return Response.json({ avatar_preview: avatarPreview, agent: data });
    }

    const result = await createHeyGenVideoAgentSession({
      prompt: previewPrompt(agent),
      mode: "generate",
      orientation: "portrait",
      incognito_mode: true
    });
    const root = result && typeof result === "object" ? result as Record<string, unknown> : {};
    const dataRoot = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
    const sessionId = clean(dataRoot.session_id ?? dataRoot.sessionId ?? dataRoot.id);
    const status = clean(dataRoot.status ?? dataRoot.state) || "generating";
    const artifacts = normalizeHeyGenVideoAgentArtifacts(result);
    const avatarPreview = {
      provider: "heygen",
      route: providerRoute,
      status,
      sessionId,
      previewUrl: firstPreviewUrl(artifacts),
      artifacts,
      requestedAt,
      prompt: previewPrompt(agent)
    };

    const { data, error } = await supabase
      .from("live_sales_agents")
      .update({ metadata: { ...metadata, avatarPreview }, updated_at: requestedAt })
      .eq("agent_id", agentId)
      .select("*")
      .single();
    if (error) throw error;

    return Response.json({ avatar_preview: avatarPreview, agent: data, raw: result });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not start avatar preview.") }, { status: 500 });
  }
}
