import {z} from "zod";
import {createHash} from "node:crypto";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit,rateLimitResponse,rejectSuspiciousText} from "@/lib/security";
import {validateProductionSafety} from "@/lib/content-safety";
import {stageEnvironment,stageEnabled,stageEditEnabled,stageTariff} from "@/lib/studio-agent/stage-environment";
import {StageDraft,buildImageStagePlan,stageLabels} from "@/lib/studio-agent/stage-plan";
import {EditInput,prepareEditForm} from "@/lib/studio-agent/stage-image-edit";
import {stageReferenceJpeg} from "@/lib/studio-agent/stage-execution";
import {stageJob,stageView,listStageJobs,runNextStage,loadStageEditSource} from "@/lib/studio-agent/stage-service";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=120;
const uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const Input=z.discriminatedUnion("action",[z.strictObject({action:z.literal("quote"),draft:StageDraft}),z.strictObject({action:z.literal("create"),draft:StageDraft,planHash:hash,approvedCredits:z.number().int().positive(),confirmProduction:z.literal(true)}),z.strictObject({action:z.literal("resume"),jobId:uuid})]);
const out=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
async function auth(request:Request){
 const e=stageEnvironment();if(!e)return null;const token=bearerTokenFromRequest(request);if(!token)return null;
 const {data,error}=await e.db.auth.getUser(token);if(error||!data.user||!(data.user.email_confirmed_at||data.user.confirmed_at))return null;
 if(e.scope==="isolated"&&e.canary!==data.user.id)return null;
 return {e,user:data.user.id};
}
export async function GET(request:Request){
 try{
 const a=await auth(request);if(!a)return out({ok:false,code:"verified_session_or_environment_required"},401);
 const {e,user}=a,url=new URL(request.url),id=url.searchParams.get("jobId");
 if(!id)return out({ok:true,enabled:stageEnabled(e,user),editEnabled:stageEditEnabled(e,user),jobs:await listStageJobs(e,user)});
 if(!uuid.safeParse(id).success)return out({ok:false,code:"invalid_job"},400);
 if(url.searchParams.has("download")){
  const ordinal=Number(url.searchParams.get("download"));if(!Number.isInteger(ordinal)||ordinal<0||ordinal>99)return out({ok:false,code:"invalid_step"},400);
  if(!await stageJob(e,user,id))return out({ok:false,code:"not_found"},404);
  const r=await e.db.from("studio_stage_steps").select("artifact_base64,receipt").eq("job_id",id).eq("ordinal",ordinal).eq("state","ready").maybeSingle();
  if(r.error||!r.data?.artifact_base64)return out({ok:false,code:"not_ready"},404);
  const bytes=Buffer.from(String(r.data.artifact_base64),"base64");const receipt=r.data.receipt as {deliverySha256?:string}|null;
  if(receipt?.deliverySha256!==createHash("sha256").update(bytes).digest("hex"))return out({ok:false,code:"artifact_integrity_failed"},409);
  return new Response(new Uint8Array(bytes),{headers:{"Content-Type":"image/webp","Content-Disposition":'attachment; filename="crelavo-'+id+'-'+ordinal+'.webp"',"Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff"}});
 }
 const job=await stageView(e,user,id);return job?out({ok:true,job}):out({ok:false,code:"not_found"},404);
 }catch{return out({ok:false,code:"stage_storage_unavailable"},503);}
}
async function boundedJson(request:Request){const reader=request.body?.getReader();if(!reader)throw Error("empty");let n=0;const chunks:Uint8Array[]=[];try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>100000)throw Error("too_large");chunks.push(value);}return JSON.parse(Buffer.concat(chunks).toString("utf8"));}finally{await reader.cancel().catch(()=>{});}}
export async function POST(request:Request){
 try{
 const a=await auth(request);if(!a)return out({ok:false,code:"verified_session_or_environment_required"},401);
 const {e,user}=a,limit=rateLimit({key:"stage-jobs:"+user,limit:15,windowMs:15*60000});if(!limit.allowed)return rateLimitResponse(limit.resetAt);
 const p=Input.safeParse(await boundedJson(request));if(!p.success)return out({ok:false,code:"invalid_request"},400);
 const tariff=stageTariff();if(!tariff||!stageEnabled(e,user))return out({ok:false,code:"stage_production_disabled"},503);
 const v=p.data;if(v.action==="resume"){
  if(!await stageJob(e,user,v.jobId))return out({ok:false,code:"not_found"},404);
  await runNextStage(e,user,v.jobId);return out({ok:true,job:await stageView(e,user,v.jobId)});
 }
 const safe=validateProductionSafety([v.draft.title,v.draft.brief]),suspicious=rejectSuspiciousText([v.draft.title,v.draft.brief]);
 if(!safe.ok||!suspicious.ok)return out({ok:false,code:"invalid_brief"},400);
 if(v.draft.referenceJpeg){try{await stageReferenceJpeg(v.draft.referenceJpeg,30000);}catch{return out({ok:false,code:"invalid_reference"},400);}}
 if(v.draft.operation){
  if(!stageEditEnabled(e,user))return out({ok:false,code:"edit_provider_not_enabled"},503);
  try{const input=EditInput.parse({operation:v.draft.operation,prompt:v.draft.brief,source:v.draft.source,referenceJpeg:v.draft.referenceJpeg,mask:v.draft.mask,search:v.draft.search,expand:v.draft.expand});const source=input.source?await loadStageEditSource(e,user,input.source):Buffer.from(input.referenceJpeg!,"base64");await prepareEditForm(input,source);}catch{return out({ok:false,code:"invalid_edit_source_or_mask"},400);}
 }
 const plan=buildImageStagePlan(v.draft,tariff);
 if(v.action==="quote")return out({ok:true,planHash:plan.planHash,totalCredits:plan.totalCredits,stepCredits:plan.steps[0].credits,stepCount:plan.steps.length,scope:v.draft.operation??stageLabels[plan.category],provider:plan.provider,model:plan.model});
 if(v.planHash!==plan.planHash||v.approvedCredits!==plan.totalCredits)return out({ok:false,code:"quote_changed"},409);
 const r=await e.db.rpc("studio_stage_create",{p_user:user,p_job:plan.jobId,p_category:plan.category,p_title:plan.title,p_hash:plan.planHash,p_tariff:plan.tariffVersion,p_steps:plan.steps,p_auto:plan.autoResume});
 if(r.error)return out({ok:false,code:"stage_create_unconfirmed"},409);
 await runNextStage(e,user,plan.jobId);return out({ok:true,job:await stageView(e,user,plan.jobId)});
 }catch{return out({ok:false,code:"stage_operation_unconfirmed_check_projects"},503);}
}
