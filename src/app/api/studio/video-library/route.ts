import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
const obj = (input: unknown): Record<string, unknown> =>
  input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
function safeVideoUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password ||
      /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|169\.254\.)/i.test(url.hostname)) return null;
    if (/placeholder|preview\.html|manifest|readme|\.(?:json|png|jpe?g|svg|gif|webp|pdf|html)(?:$|\?)/i.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}
function finalUrl(row: Record<string, unknown>): string | null {
  const output = obj(row.output_json);
  for (const candidate of [output.finalVideoUrl, output.final_video_url, output.providerFinalUrl, output.videoUrl, output.video_url,
    output.previewUrl, output.rawVisualPreviewUrl, row.preview_url, row.delivery_link]) {
    const url = safeVideoUrl(candidate);
    if (url) return url;
  }
  return null;
}
function videoSpecs(row: Record<string, unknown>) {
 const output=obj(row.output_json);
 const plan=obj(output.genericVideoPlan);
 const visual=obj(output.visualJob);
 const text=(value:unknown,max=80)=>typeof value==="string"&&value.trim()?value.trim().slice(0,max):null;
 const duration=Number(plan.durationSeconds??output.requestedDurationSeconds);
 return {
  model:text(visual.model??output.model??plan.model),
  provider:text(plan.provider??visual.provider??output.provider),
  durationSeconds:Number.isFinite(duration)&&duration>0&&duration<=7200?duration:null,
  aspectRatio:text(plan.aspectRatio??output.aspectRatio,12),
  quality:text(output.quality??visual.quality??output.resolution,30)
 };
}
function scenes(row: Record<string, unknown>, primary: string) {
  const output = obj(row.output_json);
  const entries = [output.scenes, output.videoScenes, output.clips, output.timelineClips]
    .find(Array.isArray);
  const values = Array.isArray(entries) ? entries.slice(0, 20) : [];
  const clips = values.flatMap((candidate, index) => {
    const scene = obj(candidate);
    const url = safeVideoUrl(scene.videoUrl ?? scene.url ?? scene.outputUrl ?? scene.previewUrl);
    if (!url) return [];
    const duration = Number(scene.durationSeconds ?? scene.duration ?? 0);
    return [{
      id: String(scene.id ?? index).slice(0, 80),
      title: typeof scene.title === "string" ? scene.title.slice(0, 100) : `Scene ${index + 1}`,
      url, durationSeconds: Number.isFinite(duration) && duration >= 0 && duration <= 3600 ? duration : null
    }];
  });
  return clips.length ? clips : [{ id: "final", title: "Final video", url: primary, durationSeconds: null }];
}
export async function GET(request: Request) {
  const token = bearerTokenFromRequest(request);
  if (!token) return reply({ ok: false, code: "sign_in" }, 401);
  const admin = supabaseAdmin();
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return reply({ ok: false, code: "sign_in" }, 401);
  const limit = rateLimit({ key: "studio-video-library:" + auth.user.id, limit: 30, windowMs: 60_000 });
  if (!limit.allowed) return reply({ ok: false, code: "rate_limit" }, 429);
  const { data, error } = await admin.from("production_requests")
    .select("id,title,status,production_type,package_id,created_at,preview_url,delivery_link,output_json")
    .eq("user_id", auth.user.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) return reply({ ok: false, code: "video_library_unavailable" }, 503);
  const projects = (data ?? []).filter((item) =>
    /video|clip|avatar|film|short|reel/i.test(String(item.production_type ?? "") + " " + String(item.package_id ?? "")))
    .flatMap(item => {
      const videoUrl = finalUrl(item);
      if (!videoUrl) return [];
      return [{
        id: item.id, title: String(item.title ?? "Video project").slice(0, 140),
        videoUrl, scenes: scenes(item, videoUrl), specs: videoSpecs(item),
        createdAt: item.created_at
      }];
    }).slice(0, 30);
  return reply({ ok: true, projects });
}
