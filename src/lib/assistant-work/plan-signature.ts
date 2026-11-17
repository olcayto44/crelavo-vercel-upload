import { createHmac, timingSafeEqual } from "node:crypto";
export type AssistantPlan = { reply: string; visualDirection: string; spokenScript: string };
export function canonicalPlan(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalPlan).join(",") + "]";
  return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonicalPlan((value as Record<string, unknown>)[key])).join(",") + "}";
}
function secret() { const key = process.env.ASSISTANT_PLAN_SIGNING_SECRET; if (!key || key.length < 32) throw new Error("assistant_plan_signing_unavailable"); return key; }
export function signAssistantPlan(value: unknown) { return createHmac("sha256", secret()).update(canonicalPlan(value)).digest("hex"); }
export function verifyAssistantPlan(value: unknown, signature: string) {
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(signAssistantPlan(value), "hex"));
}
