import { createHeyGenTalkingVideo, createHeyGenVideoAgentSession, getHeyGenAvatars, getHeyGenV3Video, getHeyGenVideoAgentSession, getHeyGenVideoStatus, getHeyGenVoices, getHeyGenVoicesV3, listHeyGenAvatarLooks, listHeyGenAvatarLooksExpanded, listHeyGenVideoAgentStyles, searchHeyGenSounds } from "@/lib/providers/heygen";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "avatars";

  try {
if (action === "brand_avatar_proxy") {
  const directUrl = "https://files2.heygen.ai/aws_pacific/avatar_tmp/7d64cde279b94a299de0eb0a02ea72e4/v05da9514522743039a8c4e8b76c19522/b0578cda37b142c3bcc882bb97efec8d.mp4?response-content-disposition=attachment%3B+filename%2A%3DUTF-8%27%27Crelavo%2520Brand%2520Face%2520-%2520Digital%2520Solution%2520Expert.mp4%3B&x-s=vp&Expires=1787416123&Signature=NYYNfFkNxyNB5OYfOFvmr7f8oqL~4wXHRcpdprqO1zORRpu4tCVJftvmYPNOrc6iqbEiG0xgMGeTuediqqkTjcmgvj9fRHDFMeOQchyb1F4lr0yzo8JGlQUKGOcPSf4fjVg3tempXA10pNUYrXT3bbUrcmhXPieBpzLCRrj4nMwjAG18OupY6WjvcLNYnvp5arzUKaLkBN5zfstwjmO8bWYRUoftdWCiy-Odq~AINifnRmIuxnfHZL1NYlmYDh99EoKKW~ZxkbTp7cFiwyRIjO~hdZUwjGSO~cSC-14GyW~VHe1yIMIRdTbDowX-Qtg96Vrl3TVzmGtuLYDLsb14ql__&Key-Pair-Id=K38HBHX5LX3X2H";
  const videoResponse = await fetch(directUrl, { cache: "no-store" });
  if (!videoResponse.ok || !videoResponse.body) return Response.json({ error: "Brand avatar video fetch failed." }, { status: 502 });
  return new Response(videoResponse.body, {
    headers: {
      "Content-Type": videoResponse.headers.get("content-type") || "video/mp4",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
    if (action === "voices") {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 50) || 50));
      const token = url.searchParams.get("token") || undefined;
      const [v2, v3] = await Promise.allSettled([getHeyGenVoices(), getHeyGenVoicesV3({ limit, token })]);
      return Response.json({
        action,
        result: {
          sources: {
            v2: v2.status === "fulfilled" ? v2.value : { error: v2.reason instanceof Error ? v2.reason.message : "v2 voices failed" },
            v3: v3.status === "fulfilled" ? v3.value : { error: v3.reason instanceof Error ? v3.reason.message : "v3 voices failed" }
          }
        }
      });
    }
  if (action === "avatar_looks" || action === "looks") {
    const publicTab = String(url.searchParams.get("publicTab") || url.searchParams.get("category") || "").trim().toUpperCase();
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 50) || 50));
    const expanded = url.searchParams.get("expanded") !== "false";
    const looksRequest = expanded ? listHeyGenAvatarLooksExpanded({ limit }) : listHeyGenAvatarLooks({
      ownership: url.searchParams.get("ownership") as "public" | "private" | null || undefined,
      avatar_type: url.searchParams.get("avatar_type") as "studio_avatar" | "digital_twin" | "photo_avatar" | null || undefined,
      group_id: url.searchParams.get("group_id") || undefined,
      limit,
      token: url.searchParams.get("token") || undefined
    });
    const [looks, avatars] = await Promise.allSettled([looksRequest, getHeyGenAvatars()]);
    return Response.json({
      action: "avatar_looks",
      publicTab: publicTab || null,
      note: publicTab ? "HeyGen does not expose publicTab as an official API filter; use tags/name/avatar_type from this response for UI-side category filtering." : undefined,
      result: {
        sources: {
          looks: looks.status === "fulfilled" ? looks.value : { error: looks.reason instanceof Error ? looks.reason.message : "avatar looks failed" },
          avatars: avatars.status === "fulfilled" ? avatars.value : { error: avatars.reason instanceof Error ? avatars.reason.message : "avatars failed" }
        }
      }
    });
  }
    if (action === "sounds" || action === "music") {
      const query = String(url.searchParams.get("query") || "upbeat electronic").trim() || "upbeat electronic";
      const type = url.searchParams.get("type") === "sound_effects" ? "sound_effects" : "music";
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20) || 20));
      return Response.json({ action: "sounds", result: await searchHeyGenSounds({ query, type, limit, token: url.searchParams.get("token") || undefined }) });
    }
    if (action === "video_agent_styles" || action === "styles") {
      return Response.json({ action: "video_agent_styles", result: await listHeyGenVideoAgentStyles({ tag: url.searchParams.get("tag") || undefined, limit: Number(url.searchParams.get("limit") || 50) || 50, token: url.searchParams.get("token") || undefined }) });
    }
    if (action === "video_agent_status") {
      const sessionId = url.searchParams.get("session_id") || "";
      if (!sessionId) return Response.json({ error: "session_id is required." }, { status: 400 });
      return Response.json({ action, result: await getHeyGenVideoAgentSession(sessionId) });
    }
    if (action === "v3_video_status") {
      const videoId = url.searchParams.get("video_id") || "";
      if (!videoId) return Response.json({ error: "video_id is required." }, { status: 400 });
      return Response.json({ action, result: await getHeyGenV3Video(videoId) });
    }
    if (action === "status") {
      const videoId = url.searchParams.get("video_id") || "";
      if (!videoId) return Response.json({ error: "video_id is required." }, { status: 400 });
      return Response.json({ action, result: await getHeyGenVideoStatus(videoId) });
    }
    return Response.json({ action: "avatars", result: await getHeyGenAvatars() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HeyGen request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action ?? body.mode_action ?? "video_agent").trim();
    if (action === "video_agent" || action === "v3_video_agent") {
      const result = await createHeyGenVideoAgentSession({
        prompt: String(body.prompt ?? "Create a short product demo video."),
        mode: "generate",
        avatar_id: body.avatar_id ?? body.heygen_avatar_id ?? undefined,
        voice_id: body.voice_id ?? body.heygen_voice_id ?? undefined,
        style_id: body.style_id ?? body.heygen_style_id ?? undefined,
        brand_kit_id: body.brand_kit_id ?? body.heygen_brand_kit_id ?? undefined,
        orientation: body.orientation === "landscape" ? "landscape" : "portrait",
        files: Array.isArray(body.files) ? body.files : undefined,
        callback_id: body.callback_id ?? undefined,
        callback_url: body.callback_url ?? undefined,
        incognito_mode: body.incognito_mode !== false
      });
      return Response.json({ action: "video_agent", result });
    }
    const result = await createHeyGenTalkingVideo(body);
    return Response.json({ action: "generate", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HeyGen video generation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
