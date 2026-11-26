import {validateWebsiteAIRevision,type WebsiteRevisionContext} from "./website-revision-context";
import { advanceMockConversation } from "./assistant-core";
import {readCostPolicy,maximumMicroUSD} from "./cost-policy";
import { createHash } from "node:crypto";
import { assertCreditAccount } from "./billing-policy";
import { applyModelProposal } from "./intent";
import { evaluateRequirements, getCategoryContract } from "./requirements";
import { ConversationError, completionSchema, ProviderUsageSchema, type ConversationProvider, type ConversationStore, type ProviderInput, type TurnResponse } from "./conversation-contract";

export type AssistantTariff = { version: string; inputPer1K: number; outputPer1K: number };
export function readAssistantTariff(): AssistantTariff {
  if (process.env.STUDIO_AGENT_ACCOUNTING_ENABLED !== "true") throw new ConversationError("accounting_not_enabled");
  const version = process.env.STUDIO_AGENT_TARIFF_VERSION;
  const inputPer1K = Number(process.env.STUDIO_AGENT_INPUT_CREDITS_PER_1K);
  const outputPer1K = Number(process.env.STUDIO_AGENT_OUTPUT_CREDITS_PER_1K);
  if (!version || !/^[a-zA-Z0-9._-]{1,64}$/.test(version) || ![inputPer1K, outputPer1K].every(value => Number.isSafeInteger(value) && value > 0 && value <= 1000)) throw new ConversationError("assistant_tariff_not_configured");
  return { version, inputPer1K, outputPer1K };
}
export function conversationPayloadHash(input: { projectId: string; categoryId: string; message: string; uiLanguage: string; acceptedDefaults: string[];websiteRevisionContext?:WebsiteRevisionContext }) {
  return createHash("sha256").update(JSON.stringify([input.projectId,input.categoryId,input.message,input.uiLanguage,[...input.acceptedDefaults].sort(),...(input.websiteRevisionContext?[[input.websiteRevisionContext.siteId,input.websiteRevisionContext.version,input.websiteRevisionContext.baseHash]]:[])])).digest("hex");
}
const creditUnits = (input: number, output: number, tariff: AssistantTariff) => Math.ceil(input / 1000) * tariff.inputPer1K + Math.ceil(output / 1000) * tariff.outputPer1K;
const requiredDetail: Record<string,string> = {
 tr:"Bu kritik bilgiyi paylaşır mısınız?",en:"What should we use for this required detail?",de:"Welche Angabe sollen wir für dieses erforderliche Detail verwenden?",es:"¿Qué valor debemos usar para este dato necesario?",fr:"Quelle valeur souhaitez-vous pour ce détail requis ?",ar:"ما القيمة التي تريد استخدامها لهذه المعلومة المطلوبة؟",
};
const invalidReply: Record<string,string> = {
 tr:"Model yanıtı doğrulanamadı. Brief değişmedi ve hiçbir araç çalıştırılmadı.",en:"The model response could not be validated. The brief is unchanged; no tools were executed.",de:"Die Modellantwort konnte nicht geprüft werden. Das Briefing ist unverändert; keine Werkzeuge wurden ausgeführt.",es:"No se pudo validar la respuesta. El brief no cambió y no se ejecutaron herramientas.",fr:"La réponse n'a pas pu être validée. Le brief reste inchangé ; aucun outil n'a été exécuté.",ar:"تعذر التحقق من الرد. لم يتغير الملخص ولم تنفذ أي أدوات.",
};
const disabledReply: Record<string,string> = {
  tr: "Bu aşamada üretim, onay veya revizyon araçları bağlı değil. İhtiyaçlarınızı konuşabilir ve brief'i hazırlayabiliriz; üretim başlatılmadı.",
  en: "Production, approval and revision tools are not connected at this stage. We can discuss your requirements and prepare a brief; no production was started.",
  de: "Produktions-, Freigabe- und Überarbeitungswerkzeuge sind noch nicht verbunden. Wir können Ihre Anforderungen besprechen; keine Produktion wurde gestartet.",
  es: "Las herramientas de producción, aprobación y revisión aún no están conectadas. Podemos preparar el brief; no se inició ninguna producción.",
  fr: "Les outils de production, validation et révision ne sont pas encore connectés. Nous pouvons préparer le brief ; aucune production n'a démarré.",
  ar: "أدوات الإنتاج والموافقة والمراجعة غير متصلة بعد. يمكننا مناقشة المتطلبات؛ لم يبدأ أي إنتاج.",
};
type Applied=Pick<TurnResponse,"project"|"reply"|"blockedTools"|"nextQuestion"|"websiteRevisionProposal">;
export function applyCompletion(input: ProviderInput, raw: unknown):Applied {
  const proposal = completionSchema(input.project.categoryId).parse(raw);
  if(proposal.websiteRevision||input.websiteRevisionContext){
    if(!input.websiteRevisionContext||input.project.categoryId!=="website"||proposal.intent!=="edit_content"||Object.keys(proposal.briefPatch).length||Object.keys(proposal.evidence).length||proposal.toolCalls.length||proposal.proposedCategory||proposal.question)throw new ConversationError("website_revision_context_invalid",502);
    const websiteRevisionProposal=proposal.websiteRevision?validateWebsiteAIRevision(input.websiteRevisionContext,proposal.websiteRevision):undefined;
    const reply=websiteRevisionProposal?(input.uiLanguage==="tr"?"Düzenleme önerisi hazır. İnceleyip onaylayabilirsiniz; henüz uygulanmadı.":"Revision proposal ready for review; no changes applied."):(input.uiLanguage==="tr"?"Bu düzenleme mevcut araçlarla önerilemedi. Tasarım değişmedi.":"This edit is not supported by the current revision tools. The design is unchanged.");
    return {project:{...input.project,snapshot:{...input.project.snapshot,revision:input.project.snapshot.revision+1},messages:[...input.project.messages,{role:"user" as const,content:input.message},{role:"assistant" as const,content:reply}].slice(-50)},reply,blockedTools:[],nextQuestion:null,websiteRevisionProposal};
  }
  for (const [key, value] of Object.entries(proposal.briefPatch)) {
    if (JSON.stringify(value) === JSON.stringify(input.project.snapshot.fields[key])) continue;
    const evidence = proposal.evidence[key];
    if (!evidence || !input.message.toLocaleLowerCase().includes(evidence.toLocaleLowerCase())) throw new ConversationError("model_evidence_invalid", 502);
  }
  // B2 does not resolve or authorize uploads. Reject invented/unattached reference IDs.
  const contract = getCategoryContract(input.project.categoryId);
  for (const field of contract.fields.filter(field => field.kind === "references")) {
    if (field.id in proposal.briefPatch) throw new ConversationError("reference_binding_not_connected", 502);
  }
  const technicalText=(text:string)=>contract.fields.some(field=>new RegExp('(?:^|\\s)'+field.id+'\\s*:').test(text)||field.options.some(value=>value.includes('_')&&new RegExp('\\b'+value+'\\b').test(text)));
  const merged = applyModelProposal(input.project.snapshot, {
    categoryId: proposal.categoryId, intent: proposal.intent, briefPatch: proposal.briefPatch,
    proposedCategory: proposal.proposedCategory, reply: proposal.reply, toolCalls: proposal.toolCalls,
  });
  for (const key of input.acceptedDefaults) if (!Object.prototype.hasOwnProperty.call(contract.defaults, key)) throw new ConversationError("unknown_default", 400);
  const requirements = evaluateRequirements(merged.snapshot, {acceptedDefaults: proposal.intent === "chat" ? [] : input.acceptedDefaults});
  const fieldsChanged = JSON.stringify(requirements.fields) !== JSON.stringify(merged.snapshot.fields);
  const snapshot = {...merged.snapshot, fields: requirements.fields, revision: Math.max(input.project.snapshot.revision + 1, merged.snapshot.revision + Number(fieldsChanged))};
  const next = proposal.intent === "chat" || proposal.intent === "request_production" ? null : requirements.nextQuestion;
  const question = next ? (proposal.question?.fieldId === next.fieldId && !technicalText(proposal.question.text) ? proposal.question.text
    : input.uiLanguage === "tr" ? next.question : requiredDetail[input.uiLanguage]) : "";
  const blockedTools = proposal.toolCalls.map(action => action.tool);
  const operational = ["edit_content", "request_production", "read_project", "change_category"].includes(proposal.intent) || blockedTools.length > 0;
  const answer = operational ? disabledReply[input.uiLanguage] : technicalText(proposal.reply) ? (input.uiLanguage === "tr" ? "Mevcut proje bilgileri üzerinden devam edebiliriz." : "We can continue with the current project details.") : proposal.reply;
  const reply = [answer, question].filter(Boolean).join("\n\n").slice(0,6000);
  const project = {...input.project, snapshot,
    messages: [...input.project.messages, {role:"user" as const,content:input.message}, {role:"assistant" as const,content:reply}].slice(-50)};
  return {project, reply, blockedTools, nextQuestion: next ? {fieldId:next.fieldId,question} : null};
}
export async function runConversation(input: {
  userId:string;projectId:string;categoryId:string;requestId:string;message:string;uiLanguage:ProviderInput["uiLanguage"];acceptedDefaults:string[];websiteRevisionContext?:WebsiteRevisionContext;
}, deps: {store:ConversationStore;provider:ConversationProvider;tariff:AssistantTariff;mode:"real"|"mock"}) {
  assertCreditAccount("conversation", "assistant");
  const project = await deps.store.load(input.userId,input.projectId,input.categoryId);
  if (project.userId !== input.userId || project.categoryId !== input.categoryId) throw new ConversationError("project_not_found",404);
  if(input.websiteRevisionContext&&(input.categoryId!=="website"||input.acceptedDefaults.length!==0))throw new ConversationError("website_revision_context_invalid",400);
  const contract = getCategoryContract(input.categoryId);
  for (const key of input.acceptedDefaults) if (!Object.prototype.hasOwnProperty.call(contract.defaults,key)) throw new ConversationError("unknown_default",400);
  deps.provider.preflight();
  const providerInput: ProviderInput = {project,message:input.message,uiLanguage:input.uiLanguage,acceptedDefaults:input.acceptedDefaults,websiteRevisionContext:input.websiteRevisionContext};
  const prepared = deps.provider.prepare(providerInput);
  if (prepared.inputUpperBound > 96000 || !Number.isSafeInteger(prepared.inputUpperBound) || prepared.inputUpperBound < 1) throw new ConversationError("conversation_context_too_large",413);
  const cost=deps.mode==="real"?readCostPolicy():null;
   if(cost)maximumMicroUSD(prepared.inputUpperBound,cost.outputLimit,cost);
   const reserved = creditUnits(prepared.inputUpperBound,cost?.outputLimit||1200,deps.tariff);
  const reservation = await deps.store.reserve({userId:input.userId,project,requestId:input.requestId,
    payloadHash:conversationPayloadHash(input),reserveCredits:reserved,tariffVersion:deps.tariff.version,message:input.message,cost:cost?{policy:cost,inputBound:prepared.inputUpperBound,outputBound:cost.outputLimit}:undefined});
  if (reservation.state === "settled" && reservation.response) return reservation.response;
  if (reservation.state === "result_ready") return deps.store.settle(input.userId,input.requestId,deps.mode);
  if (reservation.state === "refunded") throw new ConversationError("request_already_refunded",409); if (reservation.state === "released") throw new ConversationError("request_already_rejected",409);
  if (reservation.state !== "fresh") throw new ConversationError("request_pending_reconciliation",409,"uncertain");
  // Persist dispatch ownership BEFORE the one provider invocation. Lost RPC response must not trigger a provider retry.
  let claimed = false;
  try { claimed = await deps.store.claim(input.userId,input.requestId); }
  catch { throw new ConversationError("dispatch_state_unknown",503,"uncertain"); }
  if (!claimed) throw new ConversationError("request_pending_reconciliation",409,"uncertain");
  let completed;
  try { completed = await prepared.call(); }
  catch (error) {
    if (error instanceof ConversationError && error.outcome === "rejected") {
      await deps.store.release(input.userId,input.requestId); throw error;
    }
    await deps.store.uncertain(input.userId,input.requestId).catch(() => {});
    throw new ConversationError("provider_outcome_uncertain",503,"uncertain");
  }
  const usage = ProviderUsageSchema.safeParse(completed.usage);
  if (!usage.success || usage.data.inputTokens > prepared.inputUpperBound) {
    await deps.store.uncertain(input.userId,input.requestId).catch(() => {});
    throw new ConversationError("provider_usage_unverifiable",503,"uncertain");
  }
  if(cost&&(usage.data.outputTokens>cost.outputLimit||!completed.receipt||completed.receipt.model!==cost.model||completed.receipt.policyVersion!==cost.version)){await deps.store.uncertain(input.userId,input.requestId).catch(()=>{});throw new ConversationError("provider_receipt_unverifiable",503,"uncertain");}
   let applied:ReturnType<typeof applyCompletion>;
  try { if(completed.receipt&&completed.receipt.finishReason!=="stop")throw new Error("incomplete_response");applied = applyCompletion(providerInput,completed.output); if(deps.mode==="mock"&&!input.websiteRevisionContext)applied=advanceMockConversation(providerInput,applied); }
  catch {
    // Known provider usage still incurs Assistant cost; reject unsafe output without changing the brief or executing tools.
    const reply = invalidReply[input.uiLanguage];
    applied = {project:{...project,snapshot:{...project.snapshot,revision:project.snapshot.revision+1},messages:[...project.messages,{role:"user" as const,content:input.message},{role:"assistant" as const,content:reply}].slice(-50)},reply,blockedTools:["invalid_model_output"],nextQuestion:null};
  }
  const chargedCredits = creditUnits(usage.data.inputTokens,usage.data.outputTokens,deps.tariff);
  try {
    await deps.store.record(input.userId,input.requestId,{...applied,chargedCredits,usage:usage.data,receipt:completed.receipt});
    return await deps.store.settle(input.userId,input.requestId,deps.mode);
  } catch {
    // A cached result_ready can be settled by the same request without invoking the provider again.
    throw new ConversationError("settlement_pending_reconciliation",503,"uncertain");
  }
}