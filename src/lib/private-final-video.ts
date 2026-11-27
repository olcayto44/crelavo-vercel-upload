import { readBoundedVideo, verifyMp4Bytes } from "@/lib/verified-mp4";
import { assertFfmpegAvailable } from "@/lib/ffmpeg-runtime";
import { supabaseAdmin } from "@/lib/supabase";

export const PRIVATE_FINAL_BUCKET = "studio-final-private";
export function privateVideoDeliveryPath(id: string) { return "/api/productions/" + id + "/delivery?file=video"; }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function privateVideoObject(owner: string, job: string, hash: string) {
  if (!uuid.test(owner) || !uuid.test(job) || !/^[0-9a-f]{64}$/.test(hash)) throw Error("invalid_private_video_identity");
  return owner + "/" + job + "/" + hash + ".mp4";
}
export async function persistPrivateFinalVideo(owner: string, job: string, source: string) {
  if (process.env.CRELAVO_ATOMIC_LEGACY_VIDEO_SETTLEMENT_ENABLED !== "true") throw Error("private_video_settlement_disabled");
  const allowed = new Set((process.env.CRELAVO_FINAL_VIDEO_SOURCE_HOSTS ?? "").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean));
  const url = new URL(source);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !allowed.has(url.hostname.toLowerCase())) throw Error("provider_video_host_unapproved");
  const bytes = await readBoundedVideo(await fetch(url, {cache:"no-store", redirect:"error", signal:AbortSignal.timeout(30000)}));
  const proof = await verifyMp4Bytes(bytes, assertFfmpegAvailable());
  const object = privateVideoObject(owner,job,proof.sha256);
  const db = supabaseAdmin();
  const bucket = await db.storage.getBucket(PRIVATE_FINAL_BUCKET);
  if (bucket.error || !bucket.data || bucket.data.public !== false) throw Error("private_video_bucket_unverified");
  const store = db.storage.from(PRIVATE_FINAL_BUCKET);
  const saved = await store.upload(object,new Uint8Array(bytes),{contentType:"video/mp4",upsert:false,cacheControl:"0"});
  if (saved.error) {
    const old = await store.download(object);
    if (old.error || !old.data || old.data.size !== bytes.length) throw Error("private_video_persistence_unverified");
    const oldProof = await verifyMp4Bytes(Buffer.from(await old.data.arrayBuffer()),assertFfmpegAvailable());
    if (oldProof.sha256 !== proof.sha256) throw Error("private_video_identity_conflict");
  }
  return { storedUrl:privateVideoDeliveryPath(job), privateVideo:{bucket:PRIVATE_FINAL_BUCKET,object,sha256:proof.sha256}, mediaProof:proof };
}
