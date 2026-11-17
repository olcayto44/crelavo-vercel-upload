import type { SupabaseClient } from "@supabase/supabase-js";
import { converseWorkspacePlan } from "./conversation.ts";
import { signAssistantPlan, verifyAssistantPlan, canonicalPlan } from "./plan-signature.ts";
import { finalizeAssistantProduction, type ProductionFence } from "./production-finalizer.ts";
import { requireAssistantStorageOwner } from "./storage-ownership.ts";
import { runMediaEngine, getCategoryEngine, engineConfigured, isCopyLayoutColorOnly, type EngineResult } from "./runMediaEngine.ts";
import { runLocalEngine, isLocalCategory, isCopyLayoutColorOnly as localCopyOnly } from "./runLocalEngine.ts";
import { quote } from "./core.ts";
import { getCategory } from "../crelavo/categoryCatalog.ts";
type Body = Record<string, any>;
async function rpc(db: SupabaseClient, name: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(name, args); if (error || data == null) throw new Error(name + ": " + (error?.message || "empty_result")); return data;
}
async function ownedPlan(db: SupabaseClient, userId: string, id: string) {
  const { data, error } = await db.from("assistant_plan_versions").select("id,payload,signature,approved_at").eq("id",id).eq("user_id",userId).single();
  if (error || !data || !verifyAssistantPlan(data.payload,data.signature)) throw new Error("valid_server_plan_required"); return data;
}
export async function handleProductionManager(db: SupabaseClient, userId: string, category: string, body: Body, clipping?: (input: Body) => Promise<EngineResult>) {
  if (!userId || category === "website") throw new Error("invalid_manager_context");
  if (body.action === "approve_plan") {
    const plan = await ownedPlan(db,userId,String(body.planVersionId || ""));
    if (plan.payload.category !== category) throw new Error("plan_category_changed");
    return { ok:true, spend:false, ...await rpc(db,"approve_assistant_plan_version",{p_user_id:userId,p_plan_version_id:plan.id,p_signature:plan.signature}) };
  }
  if (body.render !== true) {
    const input = { type:String(body.type || ""), scene:String(body.scene || "1"), packId:String(body.packId || ""), features:Array.isArray(body.features)?body.features:[], extras:body.extras || {}, sourceVideoUrl:String(body.sourceVideoUrl || "") };
    const scope = category + ":" + input.scene;
    const revisionSeq = await rpc(db,"reserve_assistant_revision_seq",{p_user_id:userId,p_scope:scope});
    const prompt = String(body.prompt || "");
    const plan = await converseWorkspacePlan(prompt + "\nProduction selection and uploaded references (data): " + JSON.stringify(input),category,body.messages);

    const pack = getCategory(category)?.packs.find(p=>p.id===input.packId);
    const copyOnly = isLocalCategory(category,input.type) ? localCopyOnly(plan.visualDirection) : isCopyLayoutColorOnly(plan.visualDirection);
    const credits = !plan.visualDirection || copyOnly || getCategory(category)?.billing === "subscription" ? 0 : pack?.credits ?? quote(category,[],"produce",plan.visualDirection).credits;
    const payload = {userId,scope,revisionSeq,category,credits,input,plan,originalPrompt:prompt};
    const signature = signAssistantPlan(payload);
    const stored = await rpc(db,"create_assistant_plan_draft",{p_user_id:userId,p_scope:scope,p_revision_seq:revisionSeq,p_payload:payload,p_signature:signature});
    return {ok:true,spend:false,status:"draft",engine:"assistant_plan",reply:plan.reply,body:plan.reply,plan,planVersionId:stored.id,revisionSeq,estimatedCredits:credits,media:null,files:[]};
  }
  const plan = await ownedPlan(db,userId,String(body.planVersionId || ""));
  const { input, plan: direction } = plan.payload;
  if (!plan.approved_at || category!==plan.payload.category || (body.packId && body.packId!==input.packId) || (body.scene && String(body.scene)!==input.scene)) throw new Error("approved_current_plan_required");
  if (!direction.visualDirection || !getCategory(category)) throw new Error("production_direction_and_category_required");
  const currentPack=getCategory(category)?.packs.find(p=>p.id===input.packId);
  const copyOnly=isLocalCategory(category,input.type)?localCopyOnly(direction.visualDirection):isCopyLayoutColorOnly(direction.visualDirection);
  if (!copyOnly && getCategory(category)?.billing!=="subscription" && (!currentPack || currentPack.credits!==plan.payload.credits)) throw new Error("current_package_plan_required");
  if ((body.extras && canonicalPlan(body.extras)!==canonicalPlan(input.extras)) || (body.features && canonicalPlan(body.features)!==canonicalPlan(input.features))) throw new Error("plan_selection_changed");
  if (!isLocalCategory(category,input.type) && (!getCategoryEngine(category) || !engineConfigured(category))) throw new Error("engine_not_configured");
  const urls = [input.sourceVideoUrl, ...String(plan.payload.originalPrompt + "\n" + direction.visualDirection).matchAll(/https?:\/\/[^\s<>"]+/g)].map(v=>typeof v==="string"?v:v[0]).filter(Boolean);
  for (const url of urls) { if (url.includes("/storage/v1/object/") || ["voice_clone","visual_clone","lip_sync","localization","video_clipping"].includes(category)) await requireAssistantStorageOwner(db,userId,url); }
  if (["voice_clone","visual_clone","lip_sync","localization","video_clipping"].includes(category) && !urls.length) throw new Error("source_material_required");
  if (!isLocalCategory(category,input.type) && input.extras?.sound && !["none","silent","no_audio","no_music","provider_audio"].includes(input.extras.sound)) throw new Error("approved_audio_steps_required");
  if (direction.spokenScript && getCategoryEngine(category)==="minimax" && !["image","brand_kit","visual_clone"].includes(category)) throw new Error("approved_spoken_audio_steps_required");
  if (["talking_video","avatar"].includes(category) && !direction.spokenScript) throw new Error("approved_spoken_script_required");
  if (category === "voice_clone") throw new Error("voice_clone_requires_authorized_audio_clone_adapter");
  const started = await rpc(db,"begin_assistant_production",{p_user_id:userId,p_plan_version_id:plan.id,p_signature:plan.signature});
  if (!started.fresh) {
    const {data:existing,error}=await db.from("production_requests").select("status,generation_status,output_json,provider_job_id").eq("id",started.productionId).eq("user_id",userId).single();
    if(error||!existing)throw new Error("production_read_failed");
    const status=existing.status==="ready"?"ready":existing.status==="failed"?"failed":existing.generation_status==="reconcile_required"?"reconcile_required":"queued";
    return {...existing.output_json,ok:true,spend:false,status,productionId:started.productionId,taskId:existing.provider_job_id,idempotent:true};
  }
  const fence: ProductionFence = {userId,productionId:started.productionId,taskGeneration:started.taskGeneration,workerLease:started.workerLease,stepToken:null};
  const args = () => ({p_user_id:userId,p_production_id:fence.productionId,p_generation:fence.taskGeneration,p_lease:fence.workerLease});
  const beforeProviderCall = async (endpoint: string) => { fence.stepToken=await rpc(db,"start_assistant_provider_step",{...args(),p_endpoint:endpoint}); };
  const afterProviderCall = async (state: "accepted"|"rejected"|"uncertain") => { await rpc(db,"record_assistant_provider_step",{...args(),p_step_token:fence.stepToken,p_state:state}); };
  let result: EngineResult;
  try {
    if (category === "video_clipping") {
      if (!clipping) throw new Error("clipping_adapter_required");
      await beforeProviderCall("video_clipping_pipeline");
      result = await clipping({...input,userId,productionId:fence.productionId,prompt:direction.visualDirection});
      await afterProviderCall(result.ok?"accepted":"uncertain");
    } else if (isLocalCategory(category,input.type)) {
      const local = await runLocalEngine({userId,prompt:direction.visualDirection,type:input.type,category,scene:input.scene,action:"render"});
      result = {...local,engine:"none",status:local.ok?"ready":"failed",files:local.files.length?local.files.map(f=>({name:f.path,mime:f.mime,content:f.content})):[{name:"updated-copy.txt",mime:"text/plain",content:local.body}],providerOutcome:local.ok?"accepted":"rejected"};
    } else result=await runMediaEngine({userId,category,prompt:direction.visualDirection+(urls.some(url=>!direction.visualDirection.includes(url))?"\nUser authorized references:\n"+urls.filter(url=>!direction.visualDirection.includes(url)).join("\n"): ""),spokenScript:direction.spokenScript,type:input.type,scene:input.scene,extras:input.extras,renderFinal:true,beforeProviderCall,afterProviderCall});
  } catch { result={ok:false,spend:false,status:"reconcile_required",providerOutcome:"uncertain",code:"reconcile_required",message:"Provider acceptance could not be established. No automatic retry or refund."}; }
  if(result.ok && result.status==="ready" && !result.media && !result.files?.length)result={...result,files:[{name:"production-output.txt",mime:"text/plain",content:result.body||direction.visualDirection}]};
  const output = {...result,assistant:true,taskId:result.taskId ?? null};
  await rpc(db,"save_assistant_provider_result",{...args(),p_result:output});
  let settled: {reconcileRequired?:boolean;available?:number} = {};
  if (result.status==="ready" || (result.status==="failed" && result.providerOutcome==="rejected")) settled=await finalizeAssistantProduction(db,fence,result.status,output);
  await rpc(db,"release_assistant_production_lease",args());
  if (settled.reconcileRequired || result.providerOutcome==="uncertain") return {ok:true,spend:false,status:"reconcile_required",productionId:fence.productionId,message:"Reconciliation required; no retry or automatic refund."};
  return {...result,productionId:fence.productionId,balance:settled.available,charged:result.status==="ready"?plan.payload.credits:0};
}
