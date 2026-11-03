import { resolveReplyLanguage } from "./chat-language.ts";
import { generateWebsiteArtifact } from "../website-engine.ts";
import { automaticDeliveryLinks } from "../automatic-delivery-builder.ts";
import { groundedWebsiteReply, converseWebsiteBrief, missingWebsiteBrief, normalizeAssistantWebsiteBrief, unsupportedWebsiteScope, websiteEngineInput, websitePlanHash, type AssistantWebsiteBrief, type WebsiteMessage } from "./website-brief.ts";
type Json = Record<string, any>;
export type WebsiteAssistantDependencies = {
  db: any;
  pack: (id: string) => { credits: number; label: string } | undefined;
  balance: () => Promise<number>;
  spend: (amount: number, session: string) => Promise<{ ok: boolean; balance?: number; charged?: number; error?: string }>;
  generate?: typeof generateWebsiteArtifact;
  converse?: typeof converseWebsiteBrief;
};
class WebsiteFlowError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
const json = (value: unknown): Json => value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
export async function handleWebsiteAssistant(body: Json, user: { id: string; email?: string }, deps: WebsiteAssistantDependencies) {
  let row: Json | undefined;
  const fail = (status: number, code: string) => ({ status, payload: { ok: false, code, message: code, productionId: row?.id } });
  async function save(changes: Json, expectedPhase?: string) {
    let update = deps.db.from('production_requests').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', row!.id).eq('user_id', user.id);
    if (row!.updated_at) update = update.eq('updated_at', row!.updated_at);
    if (expectedPhase) update = update.eq('output_json->websiteAssistant->>phase', expectedPhase);
    const saved = await update.select('*').maybeSingle();
    if (saved.error) throw new WebsiteFlowError(502, 'website_project_save_failed');
    if (!saved.data) throw new WebsiteFlowError(409, 'website_project_changed_reload');
    row = saved.data;
  }
  function payload() {
    const output = json(row!.output_json); const state = json(output.websiteAssistant);
    const currentBrief = normalizeAssistantWebsiteBrief(state.brief); const currentPack = deps.pack(String(state.packId || ""));
    const validPackage = Boolean(currentPack && !/admin|commerce|checkout/i.test(currentPack.label));
    const blockers = [...missingWebsiteBrief(currentBrief), ...(output.runtimeBlueprint ? ["runtime_acceptance_pending"] : []), ...(unsupportedWebsiteScope(currentBrief).length ? ["scope"] : []), ...(!validPackage ? ["package"] : []), ...(currentPack && state.credits !== currentPack.credits ? ["price"] : []), ...(state.planHash !== websitePlanHash(currentBrief, String(state.packId || "")) ? ["plan"] : [])];

    return { ok: true, category: 'website', engine: 'website_builder', productionId: row!.id, status: state.phase, title: row!.title, body: state.messages?.at(-1)?.content ?? 'Website project loaded.', website: { review: { ready: blockers.length === 0, blockers }, brief: state.brief, messages: state.messages ?? [], planHash: state.planHash, approvedHash: state.approvedHash ?? null, missing: missingWebsiteBrief(normalizeAssistantWebsiteBrief(state.brief)), unsupported: unsupportedWebsiteScope(normalizeAssistantWebsiteBrief(state.brief)), credits: state.credits ?? null, packId: state.packId ?? '', pageManifest: output.pageManifest ?? null }, outputs: automaticDeliveryLinks(String(row!.id)) };
  }
  try {
    if (body.productionId) {
      const found = await deps.db.from('production_requests').select('*').eq('id', String(body.productionId)).eq('user_id', user.id).eq('production_type', 'website').maybeSingle();
      if (found.error || !found.data) return fail(404, 'website_project_not_found'); row = found.data;
      if (!row!.output_json?.websiteAssistant) return fail(409, 'website_legacy_project_use_content_editor');
    } else {
      if (body.render === true || body.action === 'website_approve' || body.action === 'website_open') return fail(409, 'website_brief_required');
      const created = await deps.db.from('production_requests').insert({ user_id: user.id, production_type: 'website', package_id: 'website_builder', title: 'Website brief', prompt: String(body.prompt ?? '').slice(0, 6000), status: 'pending', generation_status: 'pending', estimated_credits: 0, reserved_credits: 0, input_json: { source: 'cinema_assistant' }, request_metadata: { source: 'cinema_assistant', category: 'website', engine: 'website_builder' }, output_json: { websiteAssistant: { brief: normalizeAssistantWebsiteBrief({}), messages: [], phase: 'draft' } } }).select('*').single();
      if (created.error || !created.data) return fail(502, 'website_project_create_failed'); row = created.data;
    }
    let output = json(row!.output_json); let state = json(output.websiteAssistant);
    if (body.action === 'website_open') return { status: 200, payload: payload() };
    if (body.action === "website_retry") {
      if (state.phase !== "generating" || Date.now() - Date.parse(String(state.generationStartedAt || row!.updated_at)) < 180000) return fail(409, "website_generation_not_stale_refresh_project");
      await save({ status: "failed", generation_status: "failed", output_json: { ...output, websiteAssistant: { ...state, phase: "generation_failed", error: "interrupted_generation_recovered" } } }, "generating");
      return { status: 200, payload: payload() };
    }
    if (body.render !== true && body.action !== 'website_approve') {
      if (['generating', 'awaiting_payment'].includes(state.phase)) return fail(409, 'website_generation_or_payment_pending');
      const message = String(body.prompt ?? '').trim(); if (!message || message.length > 6000) return fail(400, 'website_message_required_max_6000');
      const replyLanguage = resolveReplyLanguage(body.uiAction === true ? "" : message, state.messages ?? []);
      const result = await (deps.converse ?? converseWebsiteBrief)(normalizeAssistantWebsiteBrief(state.brief), state.messages ?? [], message, body.websiteBrief, { ...json(body.extras), reply_language: replyLanguage, form_submission: body.uiAction === true });
      const packId = String(typeof body.packId === "string" ? body.packId : state.packId || ""); const pack = deps.pack(packId);
      const reply = groundedWebsiteReply(result.reply, result.brief, replyLanguage, Boolean(pack && !/admin|commerce|checkout/i.test(pack.label)));
      const next = { replyLanguage, brief: result.brief, messages: [...(state.messages ?? []), ...(body.uiAction === true ? [] : [{ role: "user", content: message }]), { role: 'assistant', content: reply }].slice(-30) as WebsiteMessage[], phase: 'draft', packId, credits: pack?.credits ?? null, planHash: websitePlanHash(result.brief, packId), approvedHash: null };
      await save({ title: result.brief.brand ? result.brief.brand + ' website' : 'Website brief', prompt: result.brief.brief || message, input_json: { ...json(row!.input_json), websiteBrief: result.brief }, output_json: { ...output, websiteAssistant: next } });
      return { status: 200, payload: { ...payload(), spend: false } };
    }
    const brief = normalizeAssistantWebsiteBrief(state.brief); const hash = websitePlanHash(brief, String(state.packId ?? ''));
    if (output.runtimeBlueprint) return fail(409, "website_runtime_acceptance_pending");
    if (body.planHash !== hash || state.planHash !== hash) return fail(409, 'website_plan_changed_review_again');
    if (missingWebsiteBrief(brief).length) return fail(422, 'website_brief_incomplete');
    if (unsupportedWebsiteScope(brief).length) return fail(422, 'website_static_scope_only');
    const pack = deps.pack(String(state.packId)); if (!pack || /admin|commerce|checkout/i.test(pack.label)) return fail(422, 'website_select_static_package');
    if (body.action === 'website_approve') {
      if (state.credits !== pack.credits) return fail(409, 'website_package_price_changed_review_again');
      if (['generating', 'awaiting_payment'].includes(state.phase)) return fail(409, 'website_generation_or_payment_pending');
      await save({ estimated_credits: pack.credits, output_json: { ...output, websiteAssistant: { ...state, approvedHash: hash, credits: pack.credits, phase: 'approved', approvedAt: new Date().toISOString() } } });
      return { status: 200, payload: { ...payload(), spend: false } };
    }
    if (state.approvedHash !== hash || state.credits !== pack.credits) return fail(409, 'website_plan_approval_required');
    if (state.phase === 'ready') return { status: 200, payload: { ...payload(), charged: 0, idempotent: true } };
    if (!['approved', 'generation_failed', 'awaiting_payment'].includes(state.phase)) return fail(409, 'website_production_already_running');
    const available = state.phase === "awaiting_payment" ? pack.credits : await deps.balance(); if (available < pack.credits) return { status: 402, payload: { ...fail(402, 'insufficient_credits').payload, required: pack.credits, balance: available } };
    if (state.phase !== 'awaiting_payment') {
      const expected = state.phase;
      await save({ status: 'in_production', generation_status: 'provider_generating', output_json: { ...output, websiteBillingPending: true, websiteAssistant: { ...state, phase: 'generating', generationStartedAt: new Date().toISOString() } } }, expected);
      try {
        const generated = await (deps.generate ?? generateWebsiteArtifact)(websiteEngineInput(brief), String(row!.id));
        output = json(row!.output_json); state = json(output.websiteAssistant);
        await save({ generation_status: 'completed', output_json: { ...output, websiteFiles: generated.files, websiteContent: generated.websiteContent, websiteContentRevision: output.websiteContent ? Number(output.websiteContentRevision ?? 0) + 1 : 0, websiteContentHistory: output.websiteContent ? [...(output.websiteContentHistory ?? []), { revision: Number(output.websiteContentRevision ?? 0), content: output.websiteContent, createdAt: new Date().toISOString(), source: "regeneration" }].slice(-20) : [], websiteContentHistoryVersion: 2, plan: { ...generated.plan, status: 'approved' }, pageManifest: generated.pageManifest, scope: 'marketing_website', websiteAssistant: { ...state, phase: 'awaiting_payment' } } }, 'generating');
      } catch (error) {
        if (!(error instanceof WebsiteFlowError)) { output = json(row!.output_json); await save({ status: 'failed', generation_status: 'failed', output_json: { ...output, websiteAssistant: { ...json(output.websiteAssistant), phase: 'generation_failed', error: error instanceof Error ? error.message : 'website_generation_failed' } } }, 'generating'); }
        throw error;
      }
    }
    output = json(row!.output_json); state = json(output.websiteAssistant);
    const paid = await deps.spend(pack.credits, 'website:' + row!.id + ':' + hash);
    if (!paid.ok) return { status: 402, payload: { ...fail(402, paid.error || 'website_payment_pending_retry').payload, balance: paid.balance } };
    const links = automaticDeliveryLinks(String(row!.id));
    await save({ status: 'ready', generation_status: 'completed', preview_url: links.previewUrl, delivery_zip_url: links.deliveryZipUrl, delivery_link: links.deliveryLink, source_files_url: links.sourceFilesUrl, readme_url: links.readmeUrl, completed_at: new Date().toISOString(), output_json: { ...output, websiteBillingPending: false, charged: pack.credits, websiteAssistant: { ...state, phase: 'ready', charged: pack.credits } } }, 'awaiting_payment');
    return { status: 200, payload: { ...payload(), charged: paid.charged ?? pack.credits, balance: paid.balance } };
  } catch (error) { return fail(error instanceof WebsiteFlowError ? error.status : 502, error instanceof Error ? error.message : 'website_flow_failed'); }
}
