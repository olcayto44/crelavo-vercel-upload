import { createHash } from "node:crypto";
import { MAX_CLIPS, MIN_CLIPS } from "./merge.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export type ParsedMergeBody = { projectId: string; productionIds: string[] } | { error: string };

/**
 * { projectId: uuid, productionIds: uuid[2..12] }. Sıra korunur.
 * Aynı sahne iki kez eklenebilir (tekrar eden plan); istemiyorsanız burada tekrarları reddedin.
 */
export function parseMergeBody(body: unknown): ParsedMergeBody {
  if (!body || typeof body !== "object") return { error: "Geçersiz istek gövdesi" };
  const { projectId, productionIds } = body as Record<string, unknown>;
  if (!isUuid(projectId)) return { error: "projectId geçerli bir UUID olmalı" };
  if (!Array.isArray(productionIds)) return { error: "productionIds bir dizi olmalı" };
  if (productionIds.length < MIN_CLIPS || productionIds.length > MAX_CLIPS) {
    return { error: `En az ${MIN_CLIPS}, en fazla ${MAX_CLIPS} sahne seçilmeli` };
  }
  if (!productionIds.every(isUuid)) return { error: "productionIds yalnızca UUID içermeli" };
  return { projectId: projectId.toLowerCase(), productionIds: productionIds.map((i) => i.toLowerCase()) };
}

/** Aynı kullanıcı + proje + aynı SIRA aynı özeti verir (sıra değişirse özet değişir). */
export function orderHash(userId: string, projectId: string, ids: string[]): string {
  return createHash("sha256").update([userId, projectId, ...ids].join("|")).digest("hex");
}
