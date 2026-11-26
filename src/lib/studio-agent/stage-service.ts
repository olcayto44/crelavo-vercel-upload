import {z} from "zod";
import {generateStageEdit,EditSource} from "./stage-image-edit";
import {generateStageStabilityImage} from "./image-provider";
import {createHash} from "node:crypto";
import {stageCreditNotice,StageCategory} from "./stage-plan";
import {executeStage,stageMinimaxGenerate,type StageJob} from "./stage-execution";
import {stageTariff,stageEnabled,stageEditEnabled,stageSelectedImageProvider,type StageEnvironment} from "./stage-environment";
export async function stageJob(e:StageEnvironment,user:string,id:string){
 const r=await e.db.from("studio_stage_jobs").select("id,user_id,category,title,plan_hash,tariff_version,state,total_credits,spent_credits,auto_resume,created_at,updated_at").eq("id",id).eq("user_id",user).maybeSingle();
 if(r.error)throw Error("stage_storage_unavailable");return r.data;
}
export async function stageView(e:StageEnvironment,user:string,id:string){
 const j=await stageJob(e,user,id);if(!j)return null;
 const [steps,wallet]=await Promise.all([e.db.from("studio_stage_steps").select("ordinal,operation,credits,state,error_code,completed_at").eq("job_id",id).order("ordinal"),e.db.from("credit_balances").select("balance,reserved").eq("user_id",user).maybeSingle()]);
 if(steps.error||wallet.error)throw Error("stage_storage_unavailable");
 const remaining=Number(j.total_credits)-Number(j.spent_credits),next=steps.data?.find(s=>s.state==="pending"),notice=stageCreditNotice(Number(wallet.data?.balance??0)-Number(wallet.data?.reserved??0),Number(next?.credits??0),remaining,j.state,Number(steps.data?.find(s=>s.state==="claimed")?.credits??0));
 return {id:j.id,title:j.title,category:j.category,state:j.state,totalCredits:j.total_credits,spentCredits:j.spent_credits,autoResume:j.auto_resume,steps:steps.data??[],notice,stale:j.state==="running"&&Date.now()-Date.parse(j.updated_at)>180000,enabled:stageEnabled(e,user)};
}
export async function loadStageEditSource(e:StageEnvironment,user:string,raw:unknown){
 const source=EditSource.parse(raw);if(!await stageJob(e,user,source.jobId))throw Error("source_not_found");
 const r=await e.db.from("studio_stage_steps").select("artifact_base64,receipt").eq("job_id",source.jobId).eq("ordinal",source.ordinal).eq("state","ready").maybeSingle();
 if(r.error||!r.data?.artifact_base64)throw Error("source_not_ready");
 const bytes=Buffer.from(String(r.data.artifact_base64),"base64");
 if((r.data.receipt as {deliverySha256?:string}|null)?.deliverySha256!==createHash("sha256").update(bytes).digest("hex"))throw Error("source_integrity");
 return bytes;
}
export async function runNextStage(e:StageEnvironment,user:string,id:string){
 const job=await stageJob(e,user,id);if(!job)throw Error("stage_job_not_found");
 const tariff=stageTariff();if(!tariff||!stageEnabled(e,user))return {state:job.state,code:"stage_production_disabled"};
 return executeStage(job as StageJob,{enabled:()=>stageEnabled(e,user),tariffVersion:tariff.version,credits:tariff.credits,imageProvider:stageSelectedImageProvider(),editCredits:tariff.editCredits,editEnabled:()=>stageEditEnabled(e,user),loadEditSource:source=>loadStageEditSource(e,user,source),generateEdit:(input,source)=>generateStageEdit(input,source,e.editKey),rpc:async(name,args)=>{const r=await e.db.rpc(name,args);return {data:r.data,error:r.error};},loadFirstArtifact:async(j)=>{const r=await e.db.from("studio_stage_steps").select("artifact_base64").eq("job_id",j.id).eq("ordinal",0).eq("state","ready").maybeSingle();if(r.error||!r.data?.artifact_base64)throw Error("reference_not_ready");return String(r.data.artifact_base64);},generate:(input,reference)=>input.imageProvider==="stability"?generateStageStabilityImage({prompt:input.prompt,aspect:input.aspect},e.editKey):stageMinimaxGenerate(e.key,input,reference)});
}
export async function listStageJobs(e:StageEnvironment,user:string){
 const r=await e.db.from("studio_stage_jobs").select("id,title,category,state,total_credits,spent_credits,auto_resume,updated_at").eq("user_id",user).order("updated_at",{ascending:false}).limit(50);
 if(r.error)throw Error("stage_storage_unavailable");return r.data??[];
}
export async function workerStageTick(e:StageEnvironment){
 // Only the explicitly authorized canary may generate until wallet/provider acceptance.
 if(!e.canary||!stageEnabled(e,e.canary))return {processed:0,reason:"disabled"};
 const stale=await e.db.rpc("studio_stage_mark_stale",{p_user:e.canary});if(stale.error)throw Error("stage_recovery_unavailable");
 const {data,error}=await e.db.rpc("studio_stage_funded_queue",{p_user:e.canary,p_limit:20});
 if(error)throw Error("stage_queue_unavailable");
 for(const row of data??[]){const view=await stageView(e,e.canary,String(row.id));if(!view||view.notice.nextCost<=0||view.notice.available<view.notice.nextCost)continue;const result=await runNextStage(e,e.canary,String(row.id));return {processed:1,result};}
 return {processed:0,stale:stale.data??0};
}
