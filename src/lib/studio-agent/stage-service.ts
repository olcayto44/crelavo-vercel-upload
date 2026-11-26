import {z} from "zod";
import {stageCreditNotice,StageCategory} from "./stage-plan";
import {executeStage,stageMinimaxGenerate,type StageJob} from "./stage-execution";
import {stageTariff,stageEnabled,type StageEnvironment} from "./stage-environment";
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
export async function runNextStage(e:StageEnvironment,user:string,id:string){
 const job=await stageJob(e,user,id);if(!job)throw Error("stage_job_not_found");
 const tariff=stageTariff();if(!tariff||!stageEnabled(e,user))return {state:job.state,code:"stage_production_disabled"};
 return executeStage(job as StageJob,{enabled:()=>stageEnabled(e,user),tariffVersion:tariff.version,credits:tariff.credits,rpc:async(name,args)=>{const r=await e.db.rpc(name,args);return {data:r.data,error:r.error};},loadFirstArtifact:async(j)=>{const r=await e.db.from("studio_stage_steps").select("artifact_base64").eq("job_id",j.id).eq("ordinal",0).eq("state","ready").maybeSingle();if(r.error||!r.data?.artifact_base64)throw Error("reference_not_ready");return String(r.data.artifact_base64);},generate:(input,reference)=>stageMinimaxGenerate(e.key,input,reference)});
}
export async function listStageJobs(e:StageEnvironment,user:string){
 const r=await e.db.from("studio_stage_jobs").select("id,title,category,state,total_credits,spent_credits,auto_resume,updated_at").eq("user_id",user).order("updated_at",{ascending:false}).limit(50);
 if(r.error)throw Error("stage_storage_unavailable");return r.data??[];
}
export async function workerStageTick(e:StageEnvironment){
 // Only the explicitly authorized canary may generate until wallet/provider acceptance.
 if(!e.canary||!stageEnabled(e,e.canary))return {processed:0,reason:"disabled"};
 const {data,error}=await e.db.from("studio_stage_jobs").select("id,user_id,state").eq("user_id",e.canary).eq("auto_resume",true).in("state",["queued","paused_credits"]).order("updated_at",{ascending:true}).limit(20);
 if(error)throw Error("stage_queue_unavailable");
 for(const row of data??[]){const view=await stageView(e,e.canary,String(row.id));if(!view||view.notice.nextCost<=0||view.notice.available<view.notice.nextCost)continue;return {processed:1,result:await runNextStage(e,e.canary,String(row.id))};}
 return {processed:0};
}
