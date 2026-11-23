import { requireUser } from "./auth";
import { BUCKET, SIGNED_URL_TTL_SEC, getAdmin } from "./config";
import { isUuid } from "./validate";




const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** İç hata ayrıntıları (stderr, yollar) kullanıcıya gösterilmez; yalnızca kod ve güvenli mesaj. */
const MESSAGES: Record<string, string> = {
  SOURCE_NOT_READY: "Seçilen videolardan biri artık hazır değil veya bu projeye ait değil.",
  CLIP_INVALID: "Videolardan biri okunamadı.",
  PROBE_FAILED: "Videolardan biri okunamadı.",
  CLIP_TOO_LARGE: "Videolardan biri izin verilen boyutu aşıyor.",
  SOURCE_MISSING: "Videolardan birinin kaynağı bulunamadı.",
  LEASE_EXPIRED: "Birleştirme tamamlanamadı. Lütfen tekrar deneyin.",
};

/** Yalnızca durumu okur; iş başlatmaz, worker'ı tetiklemez. */
export async function GET(req: Request): Promise<Response> {
  const user = await requireUser(req);
  if (!user) return json(401, { error: "UNAUTHORIZED" });

  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!isUuid(jobId)) return json(400, { error: "INVALID_JOB_ID" });

  const admin = getAdmin();
  const { data: job, error: lookupError } = await admin
    .from("merge_jobs")
    .select("id,production_id,status,progress,attempt,max_attempts,output_path,duration_seconds,error_code,created_at,finished_at")
    .eq("id", jobId)
    .eq("user_id", user.id) // başkasının işi 404 döner, varlığı sızmaz
    .maybeSingle();
  if(lookupError)return json(503,{ok:false,error:"STATUS_UNAVAILABLE"});
  if (!job) return json(404, { error: "NOT_FOUND" });

  const base = { jobId: job.id, ok:true, productionId:job.production_id, status: job.status==="done"?"ready":job.status==="processing"?"queued":job.status, progress: job.progress, createdAt: job.created_at };

  if (job.status === "done" && job.output_path) {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(job.output_path, SIGNED_URL_TTL_SEC);
    if (error || !data?.signedUrl) return json(200, { ...base, status: "ready", output: null, error: { code: "URL_UNAVAILABLE" } });
    return json(200, {
      ...base,
      files:[],mediaKind:"video",mediaUrl:data.signedUrl,media:{kind:"video",url:data.signedUrl},
      output: { url: data.signedUrl, durationSeconds: job.duration_seconds, expiresInSeconds: SIGNED_URL_TTL_SEC },
    });
  }
  if (job.status === "failed") {
    const code = job.error_code ?? "UNKNOWN";
    return json(200, { ...base, error: { code, message: MESSAGES[code] ?? "Birleştirme tamamlanamadı. Lütfen tekrar deneyin." } });
  }
  return json(200, base);
}
