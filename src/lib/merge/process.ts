import { mkdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET, HEARTBEAT_SEC, LEASE_SEC, MAX_CLIP_BYTES, allowedHosts, getAdmin } from "./config.ts";
import { downloadFile } from "./download.ts";
import { LeaseLostError, MergeError, errorInfo } from "./errors.ts";
import { completeJob, failJob, heartbeat, requeueJob, saveCheckpoint, saveProgress, type Checkpoint, type MergeJob } from "./jobs.ts";
import { LeaseGuard } from "./lease.ts";
import { mergeClips } from "./merge.ts";
import { loadReadyProductions, resolveDownloadUrl } from "./sources.ts";

/** Worker kapanırken iş geri bırakılır (deneme hakkı harcanmaz). */
export class ShutdownError extends Error {
  constructor() {
    super("Worker kapanıyor");
    this.name = "ShutdownError";
  }
}

const log = (event: string, data: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...data }));

export const workDirFor = (jobId: string) => path.join(os.tmpdir(), `merge-${jobId}`);
export const outputPathFor = (job: Pick<MergeJob, "id" | "user_id" | "project_id" | "lease_token">) =>
  `merges/${job.user_id}/${job.project_id}/${job.id}/${job.lease_token}.mp4`;

/** Sahiplik kaybı: DB yazması reddedildiyse iş artık bizim değil. */
const own = (ok: boolean) => {
  if (!ok) throw new LeaseLostError("DB yazması reddedildi: iş artık bu worker'a ait değil");
};

async function objectExists(admin: SupabaseClient, objectPath: string, expectedSize?: number): Promise<boolean> {
  const dir = path.posix.dirname(objectPath);
  const name = path.posix.basename(objectPath);
  const { data, error } = await admin.storage.from(BUCKET).list(dir, { search: name, limit: 5 });
  if (error) return false;
  const hit = data?.find((o: { name: string }) => o.name === name);
  if (!hit) return false;
  const size = (hit as { metadata?: { size?: number } | null }).metadata?.size;
  return expectedSize && size ? size === expectedSize : true;
}

/** Bir işi baştan sona çalıştırır. Hata/lease kaybı/kapanış durumlarını kendisi yönetir; fırlatmaz. */
export async function processJob(job: MergeJob, workerId: string, onGuard?: (g: LeaseGuard) => void): Promise<void> {
  workerId = job.lease_token;
  const guard = new LeaseGuard(() => heartbeat(job.id, workerId, LEASE_SEC), {
    leaseMs: LEASE_SEC * 1000,
    intervalMs: HEARTBEAT_SEC * 1000,
  });
  onGuard?.(guard);
  const workDir = workDirFor(job.id + "-" + job.lease_token);
  let cleanup = false;
  guard.start();
  log("job_start", { jobId: job.id, attempt: job.attempt, clips: job.production_ids.length });
  try {
    await runPipeline(job, workerId, guard, workDir);
    cleanup = true;
    log("job_done", { jobId: job.id });
  } catch (err) {
    cleanup = await handleError(job, workerId, guard, err);
  } finally {
    guard.stop();
    if (cleanup) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** true: iş sonlandı (geçici dosyalar silinebilir). false: dosyalar bir sonraki deneme için kalsın. */
async function handleError(job: MergeJob, workerId: string, guard: LeaseGuard, err: unknown): Promise<boolean> {
  const reason = guard.signal.aborted ? guard.signal.reason : err;
  const swallow = (p: Promise<unknown>) => p.catch((e) => log("db_write_failed", { jobId: job.id, error: String(e) }));

  if (err instanceof ShutdownError || reason instanceof ShutdownError) {
    log("job_released_on_shutdown", { jobId: job.id });
    await swallow(requeueJob(job, workerId, { delaySec: 0, refundAttempt: true }));
    return false;
  }
  if (err instanceof LeaseLostError || reason instanceof LeaseLostError) {
    // Başka worker devraldı ya da devralacak. Failed/queued YAZMIYORUZ; indirme ve FFmpeg zaten durdu.
    log("job_lease_lost", { jobId: job.id, reason: (reason as Error)?.message });
    return false;
  }

  const info = errorInfo(err);
  const exhausted = job.attempt >= job.max_attempts;
  if (!info.retriable || exhausted) {
    log("job_failed", { jobId: job.id, ...info, exhausted });
    await swallow(failJob(job.id, workerId, info.code, info.message));
    return true;
  }
  const delaySec = Math.min(300, 30 * 2 ** (job.attempt - 1));
  log("job_retry_scheduled", { jobId: job.id, ...info, delaySec });
  await swallow(requeueJob(job, workerId, { code: info.code, message: info.message, delaySec }));
  return false;
}

async function runPipeline(job: MergeJob, workerId: string, guard: LeaseGuard, workDir: string): Promise<void> {
  const admin = getAdmin();
  const signal = guard.signal;
  const cp: Checkpoint = { ...job.checkpoint, downloaded: { ...(job.checkpoint?.downloaded ?? {}) } };
  const outputPath = outputPathFor(job);

  // İlerleme yalnızca bilgi amaçlı: seyrek yazılır, hata işi bozmaz.
  let lastPct = -1;
  let lastAt = 0;
  const progress = (pct: number) => {
    const p = Math.round(pct);
    if (p === lastPct || (Date.now() - lastAt < 2000 && p < 99)) return;
    lastPct = p;
    lastAt = Date.now();
    saveProgress(job.id, workerId, p).catch(() => undefined);
  };

  // 1) Kuyrukta beklerken durum değişmiş olabilir: sahiplik ve 'ready' yeniden doğrulanır.
  const { rows, invalidIds } = await loadReadyProductions(admin, {
    userId: job.user_id,
    projectId: job.project_id,
    ids: job.production_ids,
  });
  if (invalidIds.length) {
    throw new MergeError("SOURCE_NOT_READY", `Hazır olmayan veya erişilemeyen videolar: ${invalidIds.join(", ")}`, false);
  }
  guard.throwIfLost();

  // 2) Önceki deneme yüklemeyi bitirmişse FFmpeg'i atlayıp sonlandır.
  if (cp.uploaded && cp.outputPath === outputPath && (await objectExists(admin, outputPath, cp.sizeBytes))) {
    guard.throwIfLost();
    log("resume_from_upload", { jobId: job.id });
    own(await completeJob(job.id, workerId, { outputPath, durationSeconds: cp.durationSeconds ?? 0, sizeBytes: cp.sizeBytes ?? 0 }));
    return;
  }

  // 3) İndirme (0-20%). Aynı makinede boyutu eşleşen yerel dosya yeniden indirilmez.
  await mkdir(workDir, { recursive: true });
  const files: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    guard.throwIfLost();
    const dest = path.join(workDir, `clip-${String(i).padStart(2, "0")}.mp4`);
    const known = cp.downloaded![String(i)];
    const have = await stat(dest).then((s) => s.size).catch(() => -1);
    if (!(known && have === known)) {
      const url = await resolveDownloadUrl(admin, rows[i]);
      cp.downloaded![String(i)] = await downloadFile(url, dest, {
        signal,
        maxBytes: MAX_CLIP_BYTES,
        allowedHosts: allowedHosts(),
        allowHttp: process.env.MERGE_ALLOW_HTTP === "1", // yalnızca yerel test; üretimde ayarlamayın
      });
      own(await saveCheckpoint(job.id, workerId, cp));
    }
    files.push(dest);
    progress(((i + 1) / rows.length) * 20);
  }

  // 4) Birleştirme (20-95%)
  const out = path.join(workDir, "merged.mp4");
  await rm(out, { force: true });
  const merged = await mergeClips({ clipPaths: files, outPath: out, signal, onProgress: (p) => progress(20 + p * 0.75) });
  guard.throwIfLost();

  // 5) Yükleme (95-100%). Deterministik yol + upsert: tekrar denemede güvenli.
  progress(96);
  const body = await readFile(out); // ~yüzlerce MB'a kadar uygundur; çok büyükse resumable (TUS) yüklemeye geçin
  const { error } = await admin.storage.from(BUCKET).upload(outputPath, body, {
    contentType: "video/mp4",
    upsert: false,
    cacheControl: "3600",
  });
  if (error) throw new MergeError("UPLOAD_FAILED", `Storage yüklemesi başarısız: ${error.message}`, true);
  guard.throwIfLost();

  cp.uploaded = true;
  cp.outputPath = outputPath;
  cp.durationSeconds = merged.output.durationSec;
  cp.sizeBytes = merged.output.sizeBytes;
  own(await saveCheckpoint(job.id, workerId, cp));

  // 6) Sonlandır: lease sahibi değilsek 'done' yazılmaz.
  own(
    await completeJob(job.id, workerId, {
      outputPath,
      durationSeconds: merged.output.durationSec,
      sizeBytes: merged.output.sizeBytes,
    }),
  );
}
