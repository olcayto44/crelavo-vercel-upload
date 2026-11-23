import { createWriteStream } from "node:fs";
import { rename, rm } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { MergeError } from "./errors.ts";

export interface DownloadOptions {
  signal?: AbortSignal;
  maxBytes: number;
  /** Boşsa host kontrolü yapılmaz. Girdi "example.com" ise alt alan adlarını da kabul eder. */
  allowedHosts?: string[];
  timeoutMs?: number;
  /** Sadece testler için. Üretimde https zorunlu. */
  allowHttp?: boolean;
}

export function assertAllowedUrl(raw: string, opts: Pick<DownloadOptions, "allowedHosts" | "allowHttp">): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new MergeError("SOURCE_URL_INVALID", "Kaynak URL geçersiz", false);
  }
  if (u.protocol !== "https:" && !(opts.allowHttp && u.protocol === "http:")) {
    throw new MergeError("SOURCE_URL_INVALID", "Kaynak URL https olmalı", false);
  }
  const hosts = opts.allowedHosts?.filter(Boolean) ?? [];
  if (hosts.length && !hosts.some((h) => u.hostname === h || u.hostname.endsWith("." + h))) {
    throw new MergeError("SOURCE_HOST_NOT_ALLOWED", `İzin verilmeyen kaynak sunucusu: ${u.hostname}`, false);
  }
  return u;
}

/** Dosyayı `dest`'e indirir (önce .part, bitince atomik rename). İndirilen bayt sayısını döndürür. */
export async function downloadFile(rawUrl: string, dest: string, opts: DownloadOptions): Promise<number> {
  const timeout = opts.timeoutMs ?? 5 * 60_000;
  const timeoutSignal = AbortSignal.timeout(timeout);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeoutSignal]) : timeoutSignal;
  const part = dest + ".part";

  try {
    let url = assertAllowedUrl(rawUrl, opts);
    let res: Response | undefined;
    // Yönlendirmeleri elle takip ediyoruz: her adımda host kontrolü (SSRF koruması).
    for (let hop = 0; hop < 4; hop++) {
      res = await fetch(url, { signal, redirect: "manual" });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = assertAllowedUrl(new URL(res.headers.get("location")!, url).toString(), opts);
        await res.body?.cancel();
        res = undefined;
        continue;
      }
      break;
    }
    if (!res) throw new MergeError("DOWNLOAD_FAILED", "Çok fazla yönlendirme", false);
    if (!res.ok || !res.body) {
      await res.body?.cancel();
      // 4xx (süresi dolmuş link, yetki) genelde kalıcıdır; 5xx/429 geçicidir.
      const transient = res.status >= 500 || res.status === 429 || res.status === 408;
      throw new MergeError("DOWNLOAD_FAILED", `Kaynak indirilemedi (HTTP ${res.status})`, transient);
    }
    const declared = Number(res.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > opts.maxBytes) {
      await res.body.cancel();
      throw new MergeError("CLIP_TOO_LARGE", `Klip çok büyük (${declared} bayt)`, false);
    }

    let written = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        written += chunk.length;
        if (written > opts.maxBytes) cb(new MergeError("CLIP_TOO_LARGE", "Klip izin verilen boyutu aştı", false));
        else cb(null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(res.body as never), counter, createWriteStream(part), { signal });

    if (Number.isFinite(declared) && declared > 0 && written !== declared) {
      throw new MergeError("DOWNLOAD_INCOMPLETE", `İndirme eksik (${written}/${declared} bayt)`, true);
    }
    if (written === 0) throw new MergeError("DOWNLOAD_INCOMPLETE", "İndirilen dosya boş", true);
    await rename(part, dest);
    return written;
  } catch (err) {
    await rm(part, { force: true });
    if (err instanceof MergeError) throw err;
    // Dış sinyal (lease kaybı / kapanış) abort ettiyse sebebini aynen ilet.
    if (opts.signal?.aborted) throw opts.signal.reason ?? err;
    if (timeoutSignal.aborted) throw new MergeError("DOWNLOAD_TIMEOUT", `İndirme ${Math.round(timeout / 1000)} sn içinde bitmedi`, true);
    throw new MergeError("DOWNLOAD_FAILED", `İndirme hatası: ${err instanceof Error ? err.message : err}`, true, { cause: err });
  }
}
