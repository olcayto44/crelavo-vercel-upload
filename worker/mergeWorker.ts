/**
 * Birleştirme worker'ı. FFmpeg çalıştırabilen gerçek bir sunucuda çalışır (VPS, Docker, Railway/Render).
 * Vercel/serverless fonksiyonlarında ÇALIŞTIRMAYIN: süre ve disk sınırları FFmpeg'e uygun değildir.
 *
 *   npx tsx worker/mergeWorker.ts          # sürekli çalışır (kuyruğu dinler)
 *   npx tsx worker/mergeWorker.ts --once   # kuyruk boşalana kadar işler, çıkar (cron için)
 */
import { randomUUID } from "node:crypto";
import { readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { LEASE_SEC } from "../src/lib/merge/config.ts";
import { assertFfmpeg } from "../src/lib/merge/ffmpeg.ts";
import { claimJob } from "../src/lib/merge/jobs.ts";
import type { LeaseGuard } from "../src/lib/merge/lease.ts";
import { ShutdownError, processJob } from "../src/lib/merge/process.ts";

const workerId = `${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
const once = process.argv.includes("--once");
const POLL_MS = Number(process.env.MERGE_POLL_MS) || 5000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const log = (event: string, data: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), worker: workerId, event, ...data }));

let stopping = false;
let current: LeaseGuard | undefined;

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    if (stopping) process.exit(1); // ikinci sinyal: zorla çık
    stopping = true;
    log("shutdown_requested", { signal: sig, runningJob: Boolean(current) });
    current?.abort(new ShutdownError()); // FFmpeg/indirme durur, iş kuyruğa geri bırakılır
  });
}

/** 6 saatten eski artık geçici klasörleri temizler (çöken önceki süreçlerden kalanlar). */
async function cleanupStaleWorkDirs(): Promise<void> {
  const root = os.tmpdir();
  for (const name of await readdir(root).catch(() => [] as string[])) {
    if (!name.startsWith("merge-")) continue;
    const full = path.join(root, name);
    const age = Date.now() - (await stat(full).then((s) => s.mtimeMs).catch(() => Date.now()));
    if (age > 6 * 3600_000) await rm(full, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function main(): Promise<void> {
  const version = await assertFfmpeg(); // FFmpeg yoksa/eksikse burada net hatayla durur
  log("worker_start", { ffmpeg: version, leaseSec: LEASE_SEC, once });
  await cleanupStaleWorkDirs();

  let claimFailures = 0;
  while (!stopping) {
    let job;
    try {
      job = await claimJob(workerId, LEASE_SEC);
      claimFailures = 0;
    } catch (err) {
      claimFailures++;
      log("claim_failed", { error: String(err), failures: claimFailures });
      await sleep(Math.min(60_000, 2000 * 2 ** Math.min(claimFailures, 5)));
      continue;
    }
    if (!job) {
      if (once) break;
      await sleep(POLL_MS);
      continue;
    }
    await processJob(job, workerId, (g) => (current = g));
    current = undefined;
  }
  log("worker_stop");
}

main().catch((err) => {
  console.error(JSON.stringify({ event: "worker_fatal", error: String(err) }));
  process.exit(1);
});
