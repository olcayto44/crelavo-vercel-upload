import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {ModelJobInput,prepareBlockedModelJob} from "@/lib/model-job-planning";
import type {VerifiedModelAsset} from "@/lib/model-media-contract";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const TEST_ORIGIN="https://bwzxdxqgrgbsvndinmrv.supabase.co";
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
const enabled=()=>process.env.VERCEL_ENV==="preview"&&process.env.MODEL_JOB_PLANNING_ENABLED==="true"&&
 (process.env.NEXT_PUBLIC_SUPABASE_URL??process.env.NEXT_PUBLIC_SUPABASE??"").trim().replace(/\/$/,"")===TEST_ORIGIN&&!!process.env.MODEL_MEDIA_PILOT_USER_ID;
async function authorized(req:Request){
 if(!enabled())return null;
 const token=bearerTokenFromRequest(req);if(!token)return null;
 const db=supabaseAdmin(),{data,error}=await db.auth.getUser(token);
 if(error||!data.user||data.user.id!==process.env.MODEL_MEDIA_PILOT_USER_ID)return null;
 return {db,owner:data.user.id};
}
async function readBounded(req:Request){
 const max=64000;if(Number(req.headers.get("content-length")??0)>max)throw Error("size");
 const reader=req.body?.getReader();if(!reader)throw Error("body");
 const parts:Uint8Array[]=[];let size=0;
 try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>max){await reader.cancel();throw Error("size")}parts.push(r.value)}}finally{reader.releaseLock()}
 return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
const fields="id,model_id,provider,state,progress,estimated_micro_usd,reserved_credits,spent_credits,actual_micro_usd,created_at,updated_at";
export async function GET(req:Request){
 try{const a=await authorized(req);if(!a)return reply({enabled:false,renderingEnabled:false});
 const {data,error}=await a.db.from("model_production_jobs").select(fields).eq("user_id",a.owner).order("created_at",{ascending:false}).limit(20);
 if(error)return reply({error:"STORAGE_UNAVAILABLE"},503);
 return reply({enabled:true,jobs:data,renderingEnabled:false});
 }catch{return reply({error:"STORAGE_UNAVAILABLE"},503)}
}
export async function POST(req:Request){
 if(!enabled())return reply({error:"PLANNING_DISABLED"},503);
 if(req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"INVALID_ORIGIN"},403);
 try{
 const a=await authorized(req);if(!a)return reply({error:"SIGN_IN"},401);
 let raw:unknown;try{raw=await readBounded(req)}catch{return reply({error:"INVALID_INPUT"},400)}
 const parsed=ModelJobInput.safeParse(raw);if(!parsed.success)return reply({error:"INVALID_INPUT"},400);
 const ids=parsed.data.assetIds;let assets:VerifiedModelAsset[]=[];
 if(ids.length){const {data,error}=await a.db.from("model_media_assets").select("id,user_id,model_id,kind,mime,bytes,object_key,state,sha256,duration_ms").eq("user_id",a.owner).eq("model_id",parsed.data.modelId).eq("state","verified").in("id",ids);if(error)return reply({error:"STORAGE_UNAVAILABLE"},503);assets=(data??[]) as unknown as VerifiedModelAsset[]}
 let plan;try{plan=prepareBlockedModelJob(a.owner,parsed.data,assets)}catch{return reply({error:"INVALID_OR_UNVERIFIED_PLAN"},422)}
 const {data,error}=await a.db.rpc("model_register_blocked_job",{p_user:a.owner,p_key:plan.requestKey,p_model:plan.modelId,p_provider:plan.provider,p_hash:plan.planHash,p_plan:plan.plan,p_estimate:plan.estimate});
 if(error)return reply({error:error.message.includes("request_conflict")?"REQUEST_CONFLICT":error.message.includes("plan_quota")?"PLAN_QUOTA":"STORAGE_UNAVAILABLE"},error.message.includes("request_conflict")?409:error.message.includes("plan_quota")?429:503);
 if(!data||data.user_id!==a.owner||data.reserved_credits!==0||data.spent_credits!==0||!["blocked","cancelled"].includes(data.state))return reply({error:"STORAGE_UNAVAILABLE"},503);
 return reply({job:{id:data.id,state:data.state,progress:0,estimatedMicroUsd:plan.estimate,reservedCredits:0,spentCredits:0},renderingEnabled:false});
 }catch{return reply({error:"STORAGE_UNAVAILABLE"},503)}
}
