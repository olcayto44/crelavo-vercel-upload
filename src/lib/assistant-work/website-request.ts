import { handleWebsiteAssistant } from "./website";
import { GET as creditsGet } from "@/app/api/credits/route";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { supabaseAdmin } from "@/lib/supabase";
export async function executeWebsiteRequest(request: Request, body: Record<string, unknown>, user: { id: string; email?: string }) {
  // Shared billing boundary: every caller of this adapter must fail closed until
  // Website Builder is migrated from the legacy /api/credits/spend endpoint to
  // an atomic reserve / settle / release ledger. Never accept a render flag or
  // a direct render action, even from another authenticated API route.
  if (body.action === "render" || body.render === true) {
    return { status: 503, payload: { ok: false, code: "website_atomic_billing_required", executionReady: false, safeToRetryAutomatically: false } };
  }
  const headers = new Headers(request.headers);
  return handleWebsiteAssistant(body, user, {
    db: supabaseAdmin(),
    pack: id => { const pack = getCategory("website")?.packs.find(pack => pack.id === id); return pack && typeof pack.credits === "number" ? { credits: pack.credits, label: pack.label } : undefined; },
    balance: async () => { const url = new URL("/api/credits", request.url); url.searchParams.set("user_id", user.id); const response = await creditsGet(new Request(url, { headers })); const data = await response.json(); if (!response.ok) throw new Error(data.error || "credit_read_failed"); return Number(data.available ?? data.balance ?? 0); },
    // Never fall back to /api/credits/spend. This adapter must remain unusable
    // for debits until an atomic production-credit ledger is integrated.
    spend: async () => ({ ok: false, charged: 0, error: "website_atomic_billing_required" })
  });
}
