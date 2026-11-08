import { handleWebsiteAssistant } from "./website";
import { GET as creditsGet } from "@/app/api/credits/route";
import { POST as creditsSpend } from "@/app/api/credits/spend/route";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { supabaseAdmin } from "@/lib/supabase";
export async function executeWebsiteRequest(request: Request, body: Record<string, unknown>, user: { id: string; email?: string }) {
  const headers = new Headers(request.headers);
  return handleWebsiteAssistant(body, user, {
    db: supabaseAdmin(),
    pack: id => { const pack = getCategory("website")?.packs.find(pack => pack.id === id); return pack && typeof pack.credits === "number" ? { credits: pack.credits, label: pack.label } : undefined; },
    balance: async () => { const url = new URL("/api/credits", request.url); url.searchParams.set("user_id", user.id); const response = await creditsGet(new Request(url, { headers })); const data = await response.json(); if (!response.ok) throw new Error(data.error || "credit_read_failed"); return Number(data.available ?? data.balance ?? 0); },
    spend: async (amount, session) => { const creditHeaders = new Headers(headers); creditHeaders.set("Content-Type", "application/json"); const response = await creditsSpend(new Request(new URL("/api/credits/spend", request.url), { method: "POST", headers: creditHeaders, body: JSON.stringify({ user_id: user.id, amount, session, type: "website" }) })); const data = await response.json(); return { ok: response.ok && data.ok !== false, balance: Number(data.available ?? data.balance ?? 0), charged: Number(data.spent ?? 0), error: data.error }; }
  });
}
