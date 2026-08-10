import { isAdminRequest } from "@/lib/admin-guard";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";
import { generateVideoThumbnail } from "@/lib/video-thumbnail";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function safeUrl(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (/^https?:\/\//i.test(text)) return text;
  }
  return "";
}

async function requireProductionAccess(request: Request, production: { user_id?: string | null }) {
  if (isAdminRequest(request)) return { ok: true as const };
  const productionUserId = clean(production.user_id);
  if (!productionUserId) return { ok: false as const, response: Response.json({ error: "Production owner is missing." }, { status: 403 }) };
  const verified = await requireVerifiedRequestUser(request, productionUserId);
  if (!verified.ok) return verified;
  return { ok: true as const };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const supabase = supabaseAdmin();
    const { data: production, error } = await supabase
      .from("production_requests")
      .select("id, user_id, preview_url, delivery_link, output_json")
      .eq("id", id)
      .maybeSingle();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!production) return Response.json({ error: "Production not found." }, { status: 404 });

    const access = await requireProductionAccess(request, production);
    if (!access.ok) return access.response;

    const outputJson = objectValue(production.output_json);
    const existingThumbnail = safeUrl(outputJson.thumbnailUrl, outputJson.thumbnail_url, outputJson.posterUrl, outputJson.poster_url, outputJson.coverUrl, outputJson.cover_url, outputJson.thumbnailImageUrl, outputJson.thumbnail_image_url);
    if (existingThumbnail) {
      return Response.json({ ok: true, reused: true, thumbnailUrl: existingThumbnail, production });
    }

    const videoUrl = safeUrl(outputJson.finalVideoUrl, outputJson.providerFinalUrl, outputJson.deliveryUrl, outputJson.delivery_url, outputJson.previewUrl, outputJson.preview_url, production.delivery_link, production.preview_url, body.videoUrl, body.video_url);
    if (!videoUrl) return Response.json({ error: "No final video URL available for thumbnail generation." }, { status: 400 });

    const timestampSeconds = Number(body.timestampSeconds ?? body.timestamp_seconds ?? 2.5) || 2.5;
    const thumbnailUrl = await generateVideoThumbnail({ productionId: id, videoUrl, timestampSeconds });
    const nextOutput = {
      ...outputJson,
      thumbnailUrl,
      posterUrl: thumbnailUrl,
      coverUrl: thumbnailUrl,
      thumbnailGeneratedAt: new Date().toISOString(),
      thumbnailGeneration: {
        status: "generated_from_final_video",
        sourceVideoUrl: videoUrl,
        timestampSeconds
      }
    };

    const { data: updated, error: updateError } = await supabase
      .from("production_requests")
      .update({ output_json: nextOutput })
      .eq("id", id)
      .select("id, output_json")
      .single();

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
    return Response.json({ ok: true, thumbnailUrl, production: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Thumbnail generation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
