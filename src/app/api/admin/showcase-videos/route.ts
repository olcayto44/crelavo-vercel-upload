import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getFallbackShowcaseVideos, getConfiguredShowcaseVideos, normalizeConfiguredShowcaseVideos, showcaseVideosConfigKey } from "@/lib/showcase-video-config";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();
  try {
    const { data, error } = await supabaseAdmin().from("platform_configs").select("value, updated_at").eq("key", showcaseVideosConfigKey).maybeSingle();
    if (error) throw error;
    const videos = data ? normalizeConfiguredShowcaseVideos((data.value as { videos?: unknown })?.videos, true) : getFallbackShowcaseVideos();
    return Response.json({ videos, updated_at: data?.updated_at ?? null, fallback: !data });
  } catch (error) {
    return Response.json({ videos: getFallbackShowcaseVideos(), fallback: true, error: errorMessage(error, "Could not load showcase videos") });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { return Response.json({ error: "A valid JSON body is required." }, { status: 400 }); }
  if (!isAdminRequest(request, body)) return adminRequiredResponse();
  const videos = normalizeConfiguredShowcaseVideos(body.videos);
  if (Array.isArray(body.videos) && body.videos.length && !videos.length) return Response.json({ error: "At least one valid showcase video is required." }, { status: 400 });
  try {
    const { data, error } = await supabaseAdmin().from("platform_configs").upsert({ key: showcaseVideosConfigKey, value: { videos }, description: "Public showcase video detail pages and SEO metadata", updated_at: new Date().toISOString() }, { onConflict: "key" }).select("value, updated_at").single();
    if (error) throw error;
    return Response.json({ videos: normalizeConfiguredShowcaseVideos((data.value as { videos?: unknown })?.videos), updated_at: data.updated_at });
  } catch (error) { return Response.json({ error: errorMessage(error, "Could not save showcase videos") }, { status: 500 }); }
}
