import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/merge/auth";
import { BUCKET, getAdmin } from "@/lib/merge/config";
import { isUuid } from "@/lib/merge/validate";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const LIMIT = 50 * 1024 * 1024;
const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return reply(401, { error: "UNAUTHORIZED" });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { error: "INVALID_JSON" }); }
  if (!body || !isUuid(body.projectId)) return reply(400, { error: "INVALID_PROJECT" });
  const projectId = body.projectId.toLowerCase(), admin = getAdmin();
  try {
    if (body.action === "prepare") {
      if (typeof body.name !== "string" || !/\.mp4$/i.test(body.name) || body.name.length > 255 ||
          !Number.isSafeInteger(body.size) || Number(body.size) < 1 || Number(body.size) > LIMIT)
        return reply(400, { message: "Only MP4 files up to 50 MB are supported." });
      const created = await admin.from("assistant_media_projects").upsert({ id: projectId, user_id: user.id }, { onConflict: "id", ignoreDuplicates: true });
      if (created.error) return reply(503, { error: "PROJECT_CREATE_FAILED" });
      const owned = await admin.from("assistant_media_projects").select("id").eq("id", projectId).eq("user_id", user.id).maybeSingle();
      if (owned.error || !owned.data) return reply(403, { error: "PROJECT_NOT_OWNED" });
      const quota = await admin.from("production_requests").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("input_json->>projectId", projectId).eq("request_metadata->>source", "scene_upload");
      if (quota.error) return reply(503, { error: "UPLOAD_LOOKUP_FAILED" });
      if ((quota.count ?? 0) >= 12) return reply(429, { message: "Maximum 12 uploads per project." });
      const productionId = randomUUID(), storagePath = `uploads/${user.id}/${projectId}/${productionId}.mp4`;
      const title = body.name.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 255);
      const inserted = await admin.from("production_requests").insert({
        id: productionId, user_id: user.id, production_type: "video", title, prompt: "User uploaded video",
        status: "draft", generation_status: "awaiting_upload", automation_status: "assistant_managed",
        estimated_credits: 0, reserved_credits: 0,
        input_json: { projectId, uploadPath: storagePath, uploadSize: body.size },
        output_json: {}, request_metadata: { source: "scene_upload" },
      });
      if (inserted.error) return reply(503, { error: "UPLOAD_RECORD_FAILED" });
      const signed = await admin.storage.from(BUCKET).createSignedUploadUrl(storagePath, { upsert: false });
      if (signed.error || !signed.data) {
        await admin.from("production_requests").delete().eq("id", productionId).eq("user_id", user.id).eq("status", "draft");
        return reply(503, { error: "UPLOAD_URL_FAILED" });
      }
      return reply(200, { productionId, signedUrl: signed.data.signedUrl });
    }
    if (!isUuid(body.productionId)) return reply(400, { error: "INVALID_PRODUCTION" });
    const loaded = await admin.from("production_requests").select("id,title,status,input_json,request_metadata")
      .eq("id", body.productionId).eq("user_id", user.id).eq("input_json->>projectId", projectId)
      .eq("request_metadata->>source", "scene_upload").maybeSingle();
    if (loaded.error || !loaded.data) return reply(404, { error: "UPLOAD_NOT_FOUND" });
    const row = loaded.data, storagePath = `uploads/${user.id}/${projectId}/${row.id}.mp4`;
    if (row.input_json?.uploadPath !== storagePath) return reply(409, { error: "UPLOAD_PATH_MISMATCH" });
    if (body.action !== "complete") return reply(400, { error: "INVALID_ACTION" });
    if (!["draft", "ready"].includes(row.status)) return reply(409, { error: "INVALID_UPLOAD_STATE" });
    const dir = storagePath.slice(0, storagePath.lastIndexOf("/")), name = storagePath.slice(storagePath.lastIndexOf("/") + 1);
    const listed = await admin.storage.from(BUCKET).list(dir, { search: name, limit: 10 });
    const object = listed.data?.find(item => item.name === name);
    if (listed.error || !object || Number(object.metadata?.size) !== Number(row.input_json.uploadSize) ||
        Number(object.metadata?.size) > LIMIT || object.metadata?.mimetype !== "video/mp4")
      return reply(422, { message: "Upload size or type could not be verified." });
    const media = await admin.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
    if (media.error || !media.data) return reply(503, { error: "PREVIEW_URL_FAILED" });
    const output = { assistant: true, media: { kind: "video", storagePath }, files: [] };
    const updated = await admin.from("production_requests").update({ status: "ready", generation_status: "ready",
      output_json: output, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("user_id", user.id).in("status", ["draft", "ready"]).select("id").maybeSingle();
    if (updated.error || !updated.data) return reply(409, { error: "UPLOAD_FINALIZE_FAILED" });
    return reply(200, { productionId: row.id, title: row.title, mediaUrl: media.data.signedUrl, mediaKind: "video", status: "ready" });
  } catch { return reply(503, { message: "Upload service unavailable. Please retry." }); }
}
