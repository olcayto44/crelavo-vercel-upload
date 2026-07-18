import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { normalizeSampleVideos } from "@/lib/sample-video-config";
import { sampleVideos, type SampleVideo } from "@/lib/sample-videos";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "sample_videos";

type ConfigPayload = {
  videos?: SampleVideo[];
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value, updated_at")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;

    const payload = data?.value as ConfigPayload | null;
    const videos = normalizeSampleVideos(payload?.videos);
    return Response.json({ videos, updated_at: data?.updated_at ?? null, fallback: !data });
  } catch (error) {
    return Response.json({ videos: sampleVideos, fallback: true, error: errorMessage(error, "Could not load sample videos") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const body = await request.json();
    const videos = normalizeSampleVideos(body.videos);
    if (!videos.length) return Response.json({ error: "At least one valid sample video is required." }, { status: 400 });

    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: CONFIG_KEY,
        value: { videos },
        description: "Public sample video gallery metadata",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();

    if (error) throw error;
    const payload = data.value as ConfigPayload;
    return Response.json({ videos: normalizeSampleVideos(payload.videos), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save sample videos") }, { status: 500 });
  }
}
