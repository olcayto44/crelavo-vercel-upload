import { requireUser } from "@/lib/merge/auth";
import { MAX_ACTIVE_JOBS_PER_USER, getAdmin } from "@/lib/merge/config";
import { loadReadyProductions } from "@/lib/merge/sources";
import { orderHash, parseMergeBody } from "@/lib/merge/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

async function findExisting(userId: string, projectId: string, hash: string) {
  const { data } = await getAdmin()
    .from("merge_jobs")
    .select("id,status,production_id")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("order_hash", hash)
    .in("status", ["queued", "processing", "done"])
    .order("created_at", { ascending: false })
    .limit(1);
  return (data?.[0] as { id: string; status: string; production_id:string|null } | undefined) ?? null;
}

const existingResponse = (job: { id: string; status: string; production_id:string|null }) =>
  json(job.status === "done" ? 200 : 202, { ok:true, jobId: job.id, productionId:job.production_id, status: job.status==="done"?"ready":"queued", deduplicated: true });

export async function POST(req: Request): Promise<Response> {
  const user = await requireUser(req);
  if (!user) return json(401, { error: "UNAUTHORIZED" });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: "INVALID_JSON" });
  }
  const parsed = parseMergeBody(raw);
  if ("error" in parsed) return json(400, { error: "INVALID_REQUEST", message: parsed.error });
  const { projectId, productionIds } = parsed;

  const hash = orderHash(user.id, projectId, productionIds);

  // 1) Aynı sıralama zaten varsa yeni iş açma (çift tıklama, yenileme, tekrar gönderim).
  const existing = await findExisting(user.id, projectId, hash);
  if (existing) return existingResponse(existing);

  // 2) Kullanıcı başına aktif iş sınırı.
  const admin = getAdmin();
  const { count } = await admin
    .from("merge_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["queued", "processing"]);
  if ((count ?? 0) >= MAX_ACTIVE_JOBS_PER_USER) {
    return json(429, { error: "TOO_MANY_ACTIVE_JOBS", message: "Devam eden birleştirmeleriniz bitince tekrar deneyin." });
  }

  // 3) Yalnız aynı kullanıcı + proje + 'ready' videolar.
  let invalidIds:string[];
  try{({invalidIds}=await loadReadyProductions(admin,{userId:user.id,projectId,ids:productionIds}));}
  catch{return json(503,{ok:false,error:"SOURCE_LOOKUP_FAILED"});}
  if (invalidIds.length) {
    return json(422, { error: "INVALID_PRODUCTIONS", message: "Bazı videolar hazır değil veya bu projeye ait değil.", invalidIds });
  }

  // 4) Kalıcı kuyruğa yaz. Eşzamanlı iki istek gelirse benzersiz indeks ikincisini reddeder.
  const {data,error}=await admin.rpc("enqueue_merge_job",{p_user:user.id,p_project:projectId,p_ids:productionIds,p_hash:hash});
  if (error) {
    if (error.code === "23505") {
      const again = await findExisting(user.id, projectId, hash);
      if (again) return existingResponse(again);
    }
    console.error("merge enqueue failed", error.code);
    return json(500, { error: "ENQUEUE_FAILED" });
  }
  return json(202, { ok:true, jobId: data.id, productionId:data.production_id, status: "queued" });
}
