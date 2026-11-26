import {z} from "zod";
import {createHash} from "node:crypto";
import {normalizeAssistantWebsiteBrief,websitePlanHash,websiteEngineInput,missingWebsiteBrief,unsupportedWebsiteScope} from "../assistant-work/website-brief";
import {getCategory} from "@/lib/crelavo/categoryCatalog";
import {prepareWebsiteAICopy} from "./website-ai-copy";
import {prepareEditableWebsiteBrief} from "./website-editable-artifact";
import {websiteAIPolicyDigest} from "./website-ai-orchestrator";
import {runWebsiteAIWorkerOnce} from "./website-ai-worker";
import type {CostPolicy} from "./cost-policy";
const uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const req=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("status"),productionId:uuid}),
 z.strictObject({action:z.literal("quote"),productionId:uuid}),
 z.strictObject({action:z.literal("submit"),productionId:uuid,quoteHash:hash,approvedCredits:z.number().int().positive(),confirmProduction:z.literal(true)})
]);
const rowSchema=z.object({id:uuid,user_id:uuid,production_type:z.literal("website"),status:z.string(),estimated_credits:z.number().int().positive(),output_json:z.object({websiteAssistant:z.object({phase:z.string(),planHash:hash,approvedHash:hash.nullable().optional(),packId:z.enum(["landing_page","business_website"]),credits:z.number().int().positive(),brief:z.record(z.string(),z.unknown())})})});
const jobSchema=z.object({production_id:uuid,user_id:uuid,plan_hash:hash,state:z.enum(["queued","claimed","artifact_cost_pending","reconcile_required","settled"])});
type Deps={userId:string;canaryId:string;enabled:()=>boolean;policy:CostPolicy;apiKey:string;loadProject:(user:string,id:string)=>Promise<unknown>;loadJob:(user:string,id:string)=>Promise<unknown>;policyMatches:()=>Promise<boolean>;rpc:Parameters<typeof runWebsiteAIWorkerOnce>[0]["rpc"];transport?:typeof fetch;autoMeteredSettlement?:boolean};
export async function handleWebsiteAILaunch(request:Request,d:Deps){
 const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
 const fail=(status:number,code:string)=>reply({ok:false,code,safeToRetryAutomatically:false},status);
 if(!uuid.safeParse(d.userId).success||d.userId!==d.canaryId)return fail(403,"website_ai_canary_required");
 try{
 const raw=await request.text();if(Buffer.byteLength(raw)>4096)return fail(413,"request_too_large");
 const input=req.safeParse(JSON.parse(raw));if(!input.success)return fail(400,"invalid_request");
 const v=input.data,row=rowSchema.safeParse(await d.loadProject(d.userId,v.productionId));
 if(!row.success||row.data.id!==v.productionId||row.data.user_id!==d.userId)return fail(404,"project_not_found");
 const p=row.data,a=p.output_json.websiteAssistant,policyHash=websiteAIPolicyDigest(d.policy);
 const jobRaw=await d.loadJob(d.userId,p.id),job=jobSchema.safeParse(jobRaw);
 if(jobRaw!==null&&(!job.success||job.data.user_id!==d.userId||job.data.production_id!==p.id||job.data.plan_hash!==a.planHash))return fail(409,"website_job_reconciliation_required");
 if(v.action==="status")return reply({ok:true,productionId:p.id,state:job.success?job.data.state:a.phase,enabled:d.enabled()&&await d.policyMatches(),safeToRetryAutomatically:false});
 // Once a job is reserved or claimed, the only customer operation is status.
 if(jobRaw!==null)return fail(409,"website_job_already_exists_check_status");
 if(!d.enabled()||!d.apiKey.trim()||!await d.policyMatches())return fail(503,"website_ai_disabled");
 const brief=normalizeAssistantWebsiteBrief(a.brief);
 if(p.status!=="pending"||a.phase!=="approved"||a.approvedHash!==a.planHash||brief.locale!=="en"||missingWebsiteBrief(brief).length||unsupportedWebsiteScope(brief).length||websitePlanHash(brief,a.packId)!==a.planHash||a.credits!==p.estimated_credits||getCategory("website")?.packs.find(x=>x.id===a.packId)?.credits!==a.credits)return fail(409,"current_supported_approval_required");
 prepareWebsiteAICopy(websiteEngineInput(brief),d.policy);prepareEditableWebsiteBrief(websiteEngineInput(brief));
 const quoteHash=createHash("sha256").update(JSON.stringify(["website-ai-copy-v1",d.userId,p.id,a.planHash,a.packId,a.credits,policyHash,Boolean(d.autoMeteredSettlement)])).digest("hex");
 if(v.action==="quote")return reply({ok:true,productionId:p.id,quoteHash,credits:a.credits,packId:a.packId,route:"website-ai-copy-v1",scope:"marketing_website_candidate",requiresReviewedProviderCost:!d.autoMeteredSettlement});
 if(v.quoteHash!==quoteHash||v.approvedCredits!==a.credits)return fail(409,"quote_changed_reload");
 const reserved=await d.rpc("website_ai_approve_enqueue",{p_user:d.userId,p_production:p.id,p_hash:a.planHash,p_policy_version:d.policy.version,p_policy_hash:policyHash,p_credits:a.credits,p_maximum:d.policy.requestMicroUSD,p_brief:a.brief,p_pack:a.packId});
 if(reserved.error)return fail(503,"reservation_unconfirmed_check_status");
 if(reserved.data!=="queued")return fail(409,typeof reserved.data==="string"?reserved.data:"reservation_unconfirmed");
 // No worker picks up an arbitrary queued job; this call is scoped to the exact
 // owner-approved production. Interruption after reserve requires explicit review.
 if(!d.enabled()||!await d.policyMatches())return reply({ok:true,productionId:p.id,state:"queued",safeToRetryAutomatically:false});
 const result=await runWebsiteAIWorkerOnce({...d,testUserId:d.userId,loadNext:async()=>d.loadJob(d.userId,p.id)});
 const ok=result.state==="artifact_cost_pending"||result.state==="settled";
 return reply({ok,productionId:p.id,...result},ok?200:409);
 }catch{return fail(503,"website_ai_outcome_unconfirmed");}
}
