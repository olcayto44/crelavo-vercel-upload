import { z } from "zod";
import {paidWebsiteScopeAllowed} from "../website-paid-scope";
import {websitePageManifest} from "../website-engine";
import {productionCreditCheck} from "../studio-agent/production-credit-policy";
import {preparePaidWebsiteAI,generatePaidWebsiteArtifact} from "./website-paid-ai";
import {createWebsiteMediaJournal} from "./website-media-journal";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { supabaseAdmin } from "@/lib/supabase";
import { websitePlanHash, normalizeAssistantWebsiteBrief, missingWebsiteBrief, unsupportedWebsiteScope, websiteEngineInput } from "./website-brief";
import { createWebsiteCreditLedger } from "./website-credit-ledger";
import { websiteCreditDeliveryProof } from "./website-paid-delivery";
import { runIsolatedWebsiteGeneration } from "./website-atomic-runner";

// Explicitly disabled until a reviewed Vercel Production release enables the switch.
// Never reuse the mock/isolated test database or the legacy non-atomic spend API.
export function websitePaidProductionEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.VERCEL_ENV === "production" &&
    env.CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED === "true" &&
    env.STUDIO_AGENT_ISOLATED_PREVIEW !== "true" &&
    Boolean(env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL);
}

// First Production release is canary-only. No configured users = no paid generation.
export function websitePaidCanaryAllowed(userId: string, env: NodeJS.ProcessEnv = process.env) {
  if (!z.string().uuid().safeParse(userId).success) return false;
  if(env.VERCEL_ENV==="production"&&env.CRELAVO_WEBSITE_PUBLIC_PAID_ENABLED==="true")return true;
  const raw = String(env.CRELAVO_WEBSITE_ATOMIC_CANARY_USER_IDS || "").trim();
  if (!raw || raw.length > 5000) return false;
  const entries = raw.split(",").map(id => id.trim().toLowerCase());
  if (entries.length > 25 || entries.some(id => !z.string().uuid().safeParse(id).success)) return false;
  return entries.includes(userId.toLowerCase());
}

// Live acceptance: the configured owner can test using their own verified customer
// account. Never trust an email sent in a request body or grant a credit exemption.
export async function websitePaidLiveAccountAllowed(userId:string){
  if(websitePaidCanaryAllowed(userId))return true;
  const owner=String(process.env.ADMIN_EMAIL??"").trim().toLowerCase();
  if(!owner||!websitePaidProductionEnabled()||!z.string().uuid().safeParse(userId).success)return false;
  const {data,error}=await supabaseAdmin().auth.admin.getUserById(userId);
  return !error&&Boolean(data.user?.email_confirmed_at||data.user?.confirmed_at)&&data.user?.email?.trim().toLowerCase()===owner;
}
const inputSchema = z.strictObject({
  productionId: z.string().uuid(),
  planHash: z.string().regex(/^[a-f0-9]{64}$/),
});

const reply = (payload: Record<string, unknown>, status: number) => ({
  status, payload: { ...payload, executionReady: status === 200, safeToRetryAutomatically: false },
});

export async function executePaidWebsiteProduction(raw: unknown, user: { id: string }) {
  if (!websitePaidProductionEnabled()) {
    return reply({ ok: false, code: "website_atomic_production_not_enabled" }, 503);
  }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return reply({ ok: false, code: "website_render_invalid_request" }, 400);
  if (!(await websitePaidLiveAccountAllowed(user.id)))
    return reply({ ok: false, code: "website_paid_canary_account_not_enabled" }, 403);
  const { productionId, planHash } = parsed.data;
  const db = supabaseAdmin();
  const { data: row, error } = await db.from("production_requests")
    .select("id,user_id,production_type,status,reserved_credits,estimated_credits,output_json")
    .eq("id", productionId).eq("user_id", user.id)
    .eq("production_type", "website").maybeSingle();
  if (error) return reply({ ok: false, code: "website_production_database_unavailable" }, 503);
  if (!row) return reply({ ok: false, code: "website_project_not_found" }, 404);
  const state = row.output_json?.websiteAssistant;
  // A ready flag alone is not payment proof; repeated calls cannot claim success
  // without a matching, durably settled reservation.
  if (row.status === "ready" && row.output_json?.websiteBillingMode === "atomic_v1") {
    const { data: settlement, error: settlementError } = await db
      .from("website_credit_reservations").select("state,credits,plan_hash")
      .eq("production_id", productionId).eq("user_id", user.id).maybeSingle();
    if (settlementError || settlement?.plan_hash !== planHash || state?.planHash !== planHash || !websiteCreditDeliveryProof(row, settlement))
      return reply({ ok: false, code: "website_generation_reconciliation_required" }, 409);
    return reply({ ok: true, state: "already_ready", productionId, charged: 0 }, 200);
  }
  if (!["approved","awaiting_payment"].includes(state?.phase) || state?.planHash !== planHash || state?.approvedHash !== planHash)
    return reply({ ok: false, code: "website_current_approval_required" }, 409);
  const pack = getCategory("website")?.packs.find(p => p.id === state.packId);
  const credits = pack?.credits;
  const brief = normalizeAssistantWebsiteBrief(state.brief);
  if (!pack || typeof credits !== "number" || !Number.isSafeInteger(credits) || credits <= 0 ||
      (/admin|commerce|checkout/i.test(pack.label)&&state.packId!=="website_basic_admin") ||
      state.credits !== credits || row.estimated_credits !== credits ||
      websitePlanHash(brief, String(state.packId)) !== planHash ||
      missingWebsiteBrief(brief).length || unsupportedWebsiteScope(brief,String(state.packId)).length||!paidWebsiteScopeAllowed(state.packId,brief.features)) {
    return reply({ ok: false, code: "website_approved_package_or_brief_changed" }, 409);
  }
  if(state.packId==="landing_page"&&websitePageManifest(brief.pages).length!==1)return reply({ok:false,code:"website_package_page_limit"},422);
  if(state.phase==="approved"){
  const {data:wallet,error:walletError}=await db.from("credit_balances").select("balance,reserved").eq("user_id",user.id).maybeSingle();
  if(walletError)return reply({ok:false,code:"website_credit_balance_unavailable"},503);
  const available=Math.max(0,Number(wallet?.balance??0)-Number(wallet?.reserved??0));
  const check=productionCreditCheck(credits,available);
  if(!check.ok)return reply(check,check.status);
  try{const budget=preparePaidWebsiteAI(websiteEngineInput(brief),process.env,state.packId);if(budget.pageImageCount){const ready=await db.rpc("website_media_journal_ready");if(ready.error||ready.data!==true)throw Error("website_media_journal_unavailable");}}catch{return reply({ok:false,code:"website_ai_provider_or_scope_unavailable"},503);}

  }
  const ledger = createWebsiteCreditLedger(async (name, args) => {
    const { data, error } = await db.rpc(name, args);
    return { data, error };
  });
  const loadReserved = async (id: string, ownerId: string): Promise<unknown> => {
    const { data: project, error: loadError } = await db.from("production_requests")
      .select("id,user_id,production_type,output_json").eq("id", id).eq("user_id", ownerId)
      .eq("production_type", "website").maybeSingle();
    if (loadError || !project) throw new Error("website_owned_project_unavailable");
    const saved = project.output_json?.websiteAssistant;
    return { productionId: project.id, userId: project.user_id, phase: saved?.phase,
      planHash: saved?.planHash, approvedHash: saved?.approvedHash, packId: saved?.packId,
      credits: saved?.credits, brief: saved?.brief };
  };
  try {
    const result = await runIsolatedWebsiteGeneration(
      { userId: user.id, productionId, planHash, credits },
      { ledger, loadReserved, generate:(input,id,pack)=>generatePaidWebsiteArtifact(input,id,pack,createWebsiteMediaJournal({userId:user.id,productionId,planHash},async(name,args)=>{const {data,error}=await db.rpc(name,args);return {data,error};})), remoteGeneration:true },
    );
    if (result.state === "ready") return reply({
      ok: true, state: "ready", productionId, charged: credits,
      previewUrl: `/api/productions/${productionId}/delivery?file=preview`,
      deliveryZipUrl: `/api/productions/${productionId}/delivery?file=zip`,
    }, 200);
    if (result.state === "already_reserved_or_finished")
      return reply({ ok: false, state: result.state, code: "website_generation_reconciliation_pending" }, 409);
    if (result.state === "generation_failed")
      return reply({ ok: false, state: result.state, code: "website_generation_failed_credits_released" }, 502);
    return reply({ ok: false, state: result.state, code: "website_generation_reconciliation_required" }, 409);
  } catch(error) {
    if(error instanceof Error&&error.message==="insufficient_production_credits"){
      const {data:current,error:readError}=await db.from("credit_balances").select("balance,reserved").eq("user_id",user.id).maybeSingle();
      if(!readError){const check=productionCreditCheck(credits,Math.max(0,Number(current?.balance??0)-Number(current?.reserved??0)));if(!check.ok)return reply(check,check.status);}
      return reply({ok:false,code:"insufficient_credits",required:credits,topUpUrl:"/dashboard/payment",productionStarted:false},402);
    }
    // The reservation may already exist. Never auto-retry or call legacy spending.
    return reply({ ok: false, code: "website_generation_reconciliation_required" }, 503);
  }
}
