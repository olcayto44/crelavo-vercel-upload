import {cookies} from "next/headers";
import {createClient} from "@supabase/supabase-js";
import {ADMIN_SESSION_COOKIE,getAdminSessionPayload,getExpectedAdminEmail} from "@/lib/admin-session";
import {kieTextRequest,readKieCreated} from "@/lib/model-kie-task-contract";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
const testOrigin="https://bwzxdxqgrgbsvndinmrv.supabase.co";
const trialId="magi2-internal-4s-v1";
async function authorized(){
 const owner=getExpectedAdminEmail(),jar=await cookies(),session=getAdminSessionPayload(jar.get(ADMIN_SESSION_COOKIE)?.value??"");
 return !!owner&&session?.email===owner&&process.env.VERCEL_ENV==="preview"&&process.env.VERCEL_GIT_COMMIT_REF==="feat/crelavo-premium-v3-20261128";
}
function testDb(){
 const key=process.env.STUDIO_AGENT_TEST_SERVICE_KEY?.trim();
 if(!key)throw Error("test_key_missing");
 return createClient(testOrigin,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function GET(){try{if(!await authorized())return reply({error:"FORBIDDEN"},403);
 const enabled=process.env.MODEL_KIE_PILOT_ENABLED==="true";
 if(!enabled)return reply({enabled:false});
 const r=await testDb().from("kie_internal_trial").select("state,provider_task_id,balance_before,max_estimated_credits,created_at").eq("trial_id",trialId).maybeSingle();
 if(r.error)return reply({error:"TEST_DATABASE_UNAVAILABLE"},503);
 return reply({enabled,trial:r.data});
 }catch{return reply({error:"UNAVAILABLE"},503)}}
export async function POST(req:Request){
 if(!await authorized()||process.env.MODEL_KIE_PILOT_ENABLED!=="true"||req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"FORBIDDEN"},403);
 const reader=req.body?.getReader();if(!reader)return reply({error:"INVALID"},400);
 try{
 let size=0;const chunks:Uint8Array[]=[];for(;;){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>256){await reader.cancel();return reply({error:"INVALID"},400)}chunks.push(x.value)}
 const input=JSON.parse(Buffer.concat(chunks).toString("utf8"));
 if(input?.confirm!=="MAGI2_TRIAL_4S_70_4"||Object.keys(input).length!==1)return reply({error:"EXPLICIT_TRIAL_CONFIRMATION_REQUIRED"},400);
 const key=process.env.KIE_API_KEY?.trim();if(!key)return reply({error:"KEY_MISSING"},503);
 const headers={Authorization:"Bearer "+key,Accept:"application/json"};
 const credit=await fetch("https://api.kie.ai/api/v1/chat/credit",{headers,redirect:"error",cache:"no-store",signal:AbortSignal.timeout(8000)});
 if(!credit.ok)return reply({error:"BALANCE_UNVERIFIED"},502);
 const b=await credit.json();
 if(b.code!==200||typeof b.data!=="number"||!Number.isFinite(b.data)||b.data<70.4||b.data>80)return reply({error:"TRIAL_BALANCE_OUTSIDE_EXPECTED_RANGE"},409);
 const db=testDb();
 const claim=await db.rpc("kie_claim_internal_trial",{p_balance:b.data});
 if(claim.error)return reply({error:"TRIAL_FENCE_UNAVAILABLE"},503);
 if(claim.data!==true)return reply({error:"TRIAL_ALREADY_CLAIMED"},409);
 // Claim is permanent even if network fails. No retry, no customer debit, no live production.
 try{
 const task=kieTextRequest({mode:"text",prompt:"A slow cinematic push-in toward a single white ceramic coffee cup on a dark wooden table, morning sunlight, a wisp of steam, natural soft room ambience.",duration:4,ratio:"16:9",audio:true,assets:[]});
 const res=await fetch(task.url,{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify(task.body),redirect:"error",cache:"no-store",signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw Error("provider_rejected");
 const id=readKieCreated(await res.json());
 const updated=await db.from("kie_internal_trial").update({state:"submitted",provider_task_id:id,updated_at:new Date().toISOString()}).eq("trial_id",trialId).eq("state","claimed").select("trial_id").single();
 if(updated.error)throw Error("task_record_not_saved");
 return reply({state:"submitted",taskId:id});
 }catch{await db.from("kie_internal_trial").update({state:"reconcile_required",updated_at:new Date().toISOString()}).eq("trial_id",trialId).eq("state","claimed");return reply({error:"RECONCILIATION_REQUIRED_NO_RETRY"},502)}
 }catch{return reply({error:"UNAVAILABLE"},503)}finally{reader.releaseLock()}
}
