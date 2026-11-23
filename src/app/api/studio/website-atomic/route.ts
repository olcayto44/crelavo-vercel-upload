import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { bearerTokenFromRequest } from "@/lib/supabase";
import { rateLimit } from "@/lib/security";
import { isolatedDatabaseTarget } from "@/lib/studio-agent/environment-policy";
import { createWebsiteCreditLedger } from "@/lib/assistant-work/website-credit-ledger";
import { runIsolatedWebsiteGeneration } from "@/lib/assistant-work/website-atomic-runner";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { websitePlanHash, normalizeAssistantWebsiteBrief } from "@/lib/assistant-work/website-brief";
import { websiteView } from "@/lib/studio-agent/website-preview";
import { buildDeliveryEntries, buildDeliveryZip, buildDeliveryReadme } from "@/lib/automatic-delivery-builder";

// This route is ONLY for an isolated Preview database. It is deliberately
// unreachable in Production and when the isolated test opt-in is absent.
// It does not migrate or modify Production Supabase and is not a launch switch.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const Id = z.string().uuid();
const Render = z.strictObject({ productionId: Id, planHash: z.string().regex(/^[a-f0-9]{64}$/) });

const respond = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
function allowed() {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.STUDIO_AGENT_WEBSITE_ATOMIC_TEST_ENABLED === "true" &&
    process.env.STUDIO_AGENT_ISOLATED_PREVIEW !== "true" &&
    isolatedDatabaseTarget();
}
function isolatedDB() {
  return createClient(process.env.STUDIO_AGENT_TEST_DATABASE_URL!, process.env.STUDIO_AGENT_TEST_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
async function authenticate(request: Request) {
  if (!allowed()) return null;
  const token = bearerTokenFromRequest(request);
  if (!token) return null;
  const db = isolatedDB();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return { db, user: data.user };
}
const notReady = () => respond({ ok: false, code: "isolated_website_atomic_disabled", executionReady: false }, 503);

export async function POST(request: Request) {
  if (!allowed()) return notReady();
  if (Number(request.headers.get("content-length") || 0) > 5000) return respond({ ok: false, code: "request_too_large" }, 413);
  const auth = await authenticate(request);
  if (!auth) return respond({ ok: false, code: "sign_in" }, 401);
  if (!rateLimit({ key: "isolated-website-atomic:" + auth.user.id, limit: 4, windowMs: 60000 }).allowed) {
    return respond({ ok: false, code: "rate_limit" }, 429);
  }
  const parsed = Render.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return respond({ ok: false, code: "invalid_request" }, 400);
  const { productionId, planHash } = parsed.data;
  const { data: row, error } = await auth.db.from("production_requests")
    .select("id,user_id,production_type,estimated_credits,output_json,status")
    .eq("id", productionId).eq("user_id", auth.user.id)
    .eq("production_type", "website").maybeSingle();
  if (error) return respond({ ok: false, code: "isolated_website_storage_unavailable" }, 503);
  if (!row) return respond({ ok: false, code: "website_project_not_found" }, 404);
  const state = row.output_json?.websiteAssistant;
  if (row.status === "ready" && row.output_json?.websiteBillingMode === "atomic_v1") {
    return respond({ ok: true, state: "already_ready", productionId, charged: false });
  }
  const pack = getCategory("website")?.packs.find(p => p.id === state?.packId);
  const brief = normalizeAssistantWebsiteBrief(state?.brief);
  if (state?.phase !== "approved" || state?.planHash !== planHash ||
      state?.approvedHash !== planHash || websitePlanHash(brief, String(state?.packId || "")) !== planHash ||
      !pack || /admin|commerce|checkout/i.test(pack.label) ||
      !Number.isSafeInteger(pack.credits) || pack.credits! <= 0 ||
      state.credits !== pack.credits || row.estimated_credits !== pack.credits) {
    return respond({ ok: false, code: "approved_current_plan_required" }, 409);
  }
  const ledger = createWebsiteCreditLedger((name, args) => auth.db.rpc(name, args));
  const loadReserved = async (id: string, userId: string) => {
    const result = await auth.db.from("production_requests")
      .select("id,user_id,output_json").eq("id", id).eq("user_id", userId)
      .eq("production_type", "website").maybeSingle();
    if (result.error || !result.data) throw new Error("reserved_website_unavailable");
    const w = result.data.output_json?.websiteAssistant;
    return { userId: result.data.user_id, productionId: result.data.id,
      phase: w?.phase, planHash: w?.planHash, approvedHash: w?.approvedHash,
      packId: w?.packId, credits: w?.credits, brief: w?.brief };
  };
  try {
    const result = await runIsolatedWebsiteGeneration({
      userId: auth.user.id, productionId, planHash, credits: pack.credits!,
    }, { ledger, loadReserved });
    return respond({ ok: result.state === "ready" || result.state === "already_reserved_or_finished",
      state: result.state, productionId, charged: result.charged,
      ...(result.state === "ready" ? { preview: "/api/studio/website-atomic?productionId=" + productionId + "&file=preview",
        delivery: "/api/studio/website-atomic?productionId=" + productionId + "&file=zip" } : {}),
    }, result.state === "ready" ? 200 : result.state === "generation_failed" ? 502 : 409);
  } catch {
    // An exception after reserve must never trigger an automatic second attempt.
    return respond({ ok: false, code: "website_reconciliation_required",
      safeToRetryAutomatically: false }, 503);
  }
}
export async function GET(request: Request) {
  if (!allowed()) return notReady();
  const auth = await authenticate(request);
  if (!auth) return respond({ ok: false, code: "sign_in" }, 401);
  const query = new URL(request.url).searchParams;
  const id = Id.safeParse(query.get("productionId"));
  const file = query.get("file");
  if (!id.success || !["preview", "zip", "source", "readme"].includes(String(file))) {
    return respond({ ok: false, code: "invalid_request" }, 400);
  }
  if (!rateLimit({ key: "isolated-website-download:" + auth.user.id, limit: 30, windowMs: 60000 }).allowed) {
    return respond({ ok: false, code: "rate_limit" }, 429);
  }
  const { data, error } = await auth.db.from("production_requests").select("*")
    .eq("id", id.data).eq("user_id", auth.user.id)
    .eq("production_type", "website").maybeSingle();
  if (error) return respond({ ok: false, code: "isolated_website_storage_unavailable" }, 503);
  if (!data) return respond({ ok: false, code: "website_project_not_found" }, 404);
  if (data.status !== "ready" || data.output_json?.websiteBillingMode !== "atomic_v1" ||
      data.reserved_credits !== 0 || !Array.isArray(data.output_json?.websiteFiles)) {
    return respond({ ok: false, code: "website_delivery_not_ready" }, 409);
  }
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none'; form-action 'none'; base-uri 'none'" };
  if (file === "preview") {
    const page = query.get("page") || "index.html";
    if (!/^[a-z0-9][a-z0-9-]{0,79}\.html$/.test(page)) return respond({ ok: false, code: "invalid_page" }, 400);
    const view = websiteView(data, page);
    if (view.state !== "ready" || !view.html) return respond({ ok: false, code: view.reason || "preview_unavailable" }, 409);
    return new Response(view.html, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  }
  if (file === "zip") {
    const archive = buildDeliveryZip(buildDeliveryEntries(data));
    return new Response(archive, { headers: { ...headers, "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="website-delivery.zip"' } });
  }
  if (file === "source") {
    return new Response(JSON.stringify(data.output_json.websiteFiles, null, 2), { headers: { ...headers,
      "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="website-source.json"' } });
  }
  return new Response(buildDeliveryReadme(data), { headers: { ...headers,
    "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="README.md"' } });
}
