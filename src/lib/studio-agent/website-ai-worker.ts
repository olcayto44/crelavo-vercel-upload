import {z} from "zod";
import {runIsolatedWebsiteAI,websiteAIPolicyDigest} from "./website-ai-orchestrator";
import type {CostPolicy} from "./cost-policy";
const uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const Job=z.object({production_id:uuid,user_id:uuid,plan_hash:hash,policy_version:z.string(),policy_hash:hash,credits:z.number().int().positive(),maximum_micro_usd:z.number().int().positive(),state:z.literal("queued")});
const Row=z.object({id:uuid,user_id:uuid,production_type:z.literal("website"),output_json:z.object({websiteAssistant:z.object({phase:z.literal("reserved"),planHash:hash,approvedHash:hash,packId:z.string(),credits:z.number().int(),brief:z.record(z.string(),z.unknown())}),websiteAIApproval:z.record(z.string(),z.unknown())})});
type D=Parameters<typeof runIsolatedWebsiteAI>[2]&{autoMeteredSettlement?:boolean;policyMatches?:()=>Promise<boolean>;testUserId:string;loadNext:(user:string,policyHash:string)=>Promise<unknown>;loadProject:(user:string,id:string)=>Promise<unknown>};
// One invocation consumes at most one job, only for an explicitly designated test owner.
// The database's atomic claim is the dispatch fence even if two invocations overlap.
export async function runWebsiteAIWorkerOnce(d:D){
 const stop=(state:string)=>({state,safeToRetryAutomatically:false});
 if(!d.enabled()||!uuid.safeParse(d.testUserId).success||!d.apiKey.trim())return stop("disabled");
 try{
 const digest=websiteAIPolicyDigest(d.policy);
 const raw=await d.loadNext(d.testUserId,digest);if(raw===null)return stop("idle");
 const job=Job.safeParse(raw);if(!job.success)return stop("invalid_job");
 const j=job.data;
 if(j.user_id!==d.testUserId||j.policy_hash!==digest||j.policy_version!==d.policy.version||j.maximum_micro_usd!==d.policy.requestMicroUSD)return stop("invalid_job");
 const row=Row.safeParse(await d.loadProject(j.user_id,j.production_id));if(!row.success)return stop("invalid_project");
 const p=row.data,a=p.output_json.websiteAssistant,approval=p.output_json.websiteAIApproval;
 if(p.id!==j.production_id||p.user_id!==j.user_id||a.planHash!==j.plan_hash||a.approvedHash!==j.plan_hash||a.credits!==j.credits||approval.planHash!==j.plan_hash||approval.policyHash!==digest||approval.policyVersion!==j.policy_version||approval.credits!==j.credits||approval.maximumMicroUSD!==j.maximum_micro_usd||approval.source!=="persisted_explicit_user_approval")return stop("invalid_project");
 if(d.policyMatches&&!await d.policyMatches())return stop("disabled");
 const result=await runIsolatedWebsiteAI({userId:j.user_id,productionId:j.production_id,planHash:j.plan_hash,packId:a.packId,credits:j.credits,policyVersion:j.policy_version,policyHash:j.policy_hash,maximumMicroUSD:j.maximum_micro_usd,source:approval.source,brief:a.brief},d.testUserId,d);
 // Both the HTTP invocation and the dedicated Railway worker use the same
 // metered settlement boundary. Only the persisted, verified DB policy can
 // authorize the transition; the RPC rechecks identity and exact cost evidence.
 if(result.state==="artifact_cost_pending"&&d.autoMeteredSettlement===true&&d.enabled()&&d.policyMatches&&await d.policyMatches()){
  const settled=await d.rpc("website_ai_finalize_metered",{p_user:j.user_id,p_production:j.production_id,p_hash:j.plan_hash});
  if(settled.error)return stop("reconciliation_required");
  if(settled.data==="settled"||settled.data==="already_settled")return {...stop("settled"),costBasis:"metered_policy_estimate" as const,invoicePending:true as const};
 }
 return result;
 }catch{return stop("reconciliation_required");}
}
