import { NextResponse } from "next/server";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noCache = { "Cache-Control": "no-store" };
const error = (message: string, status: number) =>
  NextResponse.json({ ok: false, error: message }, { status, headers: noCache });

async function verifiedUser(request: Request) {
  const token = bearerTokenFromRequest(request);
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  return error ? null : data.user;
}

/** Private status + short-lived MP4 delivery URL, never exposing storage paths to another owner. */
export async function GET(request: Request) {
  try {
    const user = await verifiedUser(request);
    if (!user) return error("Sign in to access render jobs.", 401);
    const db = supabaseAdmin();
    const url = new URL(request.url);
    const jobId = url.searchParams.get("job");
    if (jobId && !uuid.test(jobId)) return error("Invalid job ID.", 400);
    const query = db.from("studio_render_jobs")
      .select("id,project_id,timeline_version_id,status,format,attempt_count,error_code,created_at,updated_at,finished_at,output_bucket,output_path")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(25);
    const { data, error: queryError } = await (jobId ? query.eq("id", jobId) : query);
    if (queryError) return error("Render job lookup is not available.", 503);
    if (jobId && !data?.length) return error("Render job not found.", 404);
    const jobs = (data ?? []).map(({ output_bucket: _bucket, output_path: _path, ...job }) => job);
    if (jobId && (url.searchParams.get("download") === "1" || url.searchParams.get("preview") === "1")) {
      const job = data?.[0];
      if (!job || job.status !== "ready" || job.output_bucket !== "studio-private"
        || typeof job.output_path !== "string"
        || !job.output_path.startsWith(user.id + "/" + job.project_id + "/"))
        return error("Completed MP4 file is not available.", 409);
      const { data: signed, error: signError } = await db.storage.from("studio-private")
        .createSignedUrl(job.output_path, 300, url.searchParams.get("download") === "1" ? { download: "crelavo-studio-export.mp4" } : undefined);
      if (signError || !signed?.signedUrl) return error("Private download could not be generated.", 503);
      return NextResponse.json({ ok: true, job: jobs[0], downloadUrl: signed.signedUrl }, { headers: noCache });
    }
    return NextResponse.json({ ok: true, jobs }, { headers: noCache });
  } catch {
    return error("Render job service is unavailable.", 503);
  }
}

async function workerReady(): Promise<boolean> {
  try {
    const url = new URL(process.env.STUDIO_RENDER_WORKER_URL ?? "");
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const response = await fetch(new URL("/worker/ready", url), {
      headers: { Authorization: "Bearer " + process.env.STUDIO_RENDER_WORKER_KEY },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.ok === true && data?.queueEnabled === true;
  } catch { return false; }
}

/** Worker-gated, non-billable queue reservation. Never claim MP4 generation before a worker is deployed. */
export async function POST(request: Request) {
  try {
    const user = await verifiedUser(request);
    if (!user) return error("Sign in to request MP4 rendering.", 401);
    if (process.env.VERCEL_ENV !== "production" || process.env.STUDIO_AGENT_ISOLATED_PREVIEW === "true" || process.env.STUDIO_MP4_RENDER_ENABLED !== "1"
      || !process.env.STUDIO_RENDER_WORKER_URL
      || !process.env.STUDIO_RENDER_WORKER_KEY)
      return error("MP4 render worker is not enabled. No job or credit charge was created.", 503);
    const body = await request.json().catch(() => null) as
      { projectId?: unknown; timelineVersionId?: unknown; requestId?: unknown } | null;
    if (!body || typeof body.projectId !== "string" || !uuid.test(body.projectId)
      || typeof body.timelineVersionId !== "string" || !uuid.test(body.timelineVersionId)
      || typeof body.requestId !== "string" || !uuid.test(body.requestId))
      return error("Valid project, timeline version and request IDs are required.", 400);
    const db = supabaseAdmin();
    const { data: timeline, error: timelineError } = await db.from("studio_timeline_versions")
      .select("id").eq("id", body.timelineVersionId).eq("project_id", body.projectId)
      .eq("user_id", user.id).maybeSingle();
    if (timelineError || !timeline) return error("Timeline not found for your account.", 404);
    const { data: existing } = await db.from("studio_render_jobs")
      .select("id,status,created_at,project_id,timeline_version_id").eq("user_id", user.id).eq("request_id", body.requestId).maybeSingle();
    if (existing && (existing.project_id !== body.projectId || existing.timeline_version_id !== body.timelineVersionId)) return error("Render request ID conflict.", 409);
    if (existing) return NextResponse.json({ ok: true, reused: true, job: existing, creditsReserved: false }, { headers: noCache });
    if (!(await workerReady())) return error("MP4 render worker is not ready. No job or credit charge was created.", 503);
    const { count, error: countError } = await db.from("studio_render_jobs")
      .select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["queued","processing"]);
    if (countError) return error("Render queue is unavailable.", 503);
    if ((count ?? 0) >= 2) return error("Your active render queue is full (maximum 2).", 429);
    const { data: inserted, error: insertError } = await db.from("studio_render_jobs").insert({
      user_id: user.id, project_id: body.projectId, timeline_version_id: body.timelineVersionId,
      request_id: body.requestId, format: "mp4", status: "queued"
    }).select("id,status,created_at").single();
    if (insertError) {
      // Concurrent duplicate requests may race; return the originally queued job.
      if (insertError.code === "23505") {
        const { data: duplicate } = await db.from("studio_render_jobs")
          .select("id,status,created_at").eq("user_id", user.id).eq("request_id", body.requestId).maybeSingle();
        if (duplicate && (duplicate.project_id !== body.projectId || duplicate.timeline_version_id !== body.timelineVersionId)) return error("Render request ID conflict.", 409);
        if (duplicate) return NextResponse.json({ ok: true, reused: true, job: duplicate, creditsReserved: false }, { headers: noCache });
      }
      return error("Render job could not be queued. No credit charge was made.", 503);
    }
    return NextResponse.json({ ok: true, job: inserted, creditsReserved: false }, { status: 202, headers: noCache });
  } catch {
    return error("Render queue is unavailable. No credit charge was made.", 503);
  }
}
