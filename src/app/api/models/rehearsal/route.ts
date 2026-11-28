import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {z} from "zod";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co",bucket="model-rehearsal-delivery";
const enabled=()=>process.env.VERCEL_ENV==="preview"&&process.env.MODEL_REHEARSAL_ENABLED==="true"&&(process.env.NEXT_PUBLIC_SUPABASE_URL??process.env.NEXT_PUBLIC_SUPABASE??"").trim().replace(/\/$/,"")===origin&&!!process.env.MODEL_MEDIA_PILOT_USER_ID;
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
async function auth(req:Request){
 if(!enabled())return null;
 const token=bearerTokenFromRequest(req);if(!token)return null;
 const db=supabaseAdmin(),{data,error}=await db.auth.getUser(token);
 return !error&&data.user?.id===process.env.MODEL_MEDIA_PILOT_USER_ID?{db,owner:data.user.id}:null;
}
const fields="job_id,state,progress,test_credits,reservation_state,actual_micro_usd,created_at,updated_at";
export async function GET(req:Request){
 try{
 const a=await auth(req);if(!a)return reply({enabled:false});
 const id=new URL(req.url).searchParams.get("delivery");
 if(id!==null){
 if(!z.string().uuid().safeParse(id).success)return reply({error:"INVALID_ID"},400);
 const r=await a.db.from("model_rehearsal_runs").select("state,reservation_state,delivery_key,delivery_bytes").eq("user_id",a.owner).eq("job_id",id).maybeSingle();
 if(r.error||r.data?.state!=="ready"||r.data.reservation_state!=="settled"||r.data.delivery_key!==a.owner+"/"+id+"/rehearsal.mp4")return reply({error:"NOT_READY"},404);
 const config=await a.db.storage.getBucket(bucket);if(config.error||config.data?.public!==false)return reply({error:"STORAGE_UNAVAILABLE"},503);
 const storage=a.db.storage.from(bucket);
 const preview=await storage.createSignedUrl(r.data.delivery_key,120),download=await storage.createSignedUrl(r.data.delivery_key,120,{download:"crelavo-test-rehearsal.mp4"});
 if(preview.error||download.error)return reply({error:"DELIVERY_UNAVAILABLE"},503);
 return reply({preview:preview.data.signedUrl,download:download.data.signedUrl,synthetic:true,expiresIn:120});
 }
 const r=await a.db.from("model_rehearsal_runs").select(fields).eq("user_id",a.owner).order("created_at",{ascending:false}).limit(20);
 const w=await a.db.from("model_rehearsal_wallets").select("balance,reserved").eq("user_id",a.owner).maybeSingle();
 if(r.error||w.error)return reply({error:"STORAGE_UNAVAILABLE"},503);
 return reply({enabled:true,synthetic:true,renderingEnabled:false,runs:r.data,wallet:w.data??null});
 }catch{return reply({error:"STORAGE_UNAVAILABLE"},503)}
}
export async function POST(req:Request){
 if(!enabled())return reply({error:"REHEARSAL_DISABLED"},503);
 if(req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"INVALID_ORIGIN"},403);
 try{
 const a=await auth(req);if(!a)return reply({error:"SIGN_IN"},401);
 const reader=req.body?.getReader();if(!reader)return reply({error:"INVALID_INPUT"},400);
 let size=0;const chunks:Uint8Array[]=[];try{for(;;){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>1024){await reader.cancel();return reply({error:"INVALID_INPUT"},400)}chunks.push(v.value)}}finally{reader.releaseLock()}
 const parsed=z.object({jobId:z.string().uuid(),acceptSynthetic:z.literal(true)}).strict().safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
 if(!parsed.success)return reply({error:"INVALID_INPUT"},400);
 const r=await a.db.rpc("model_rehearsal_reserve",{p_user:a.owner,p_job:parsed.data.jobId});
 if(r.error)return reply({error:"REHEARSAL_NOT_AVAILABLE"},409);
 if(!r.data||r.data.user_id!==a.owner)return reply({error:"STORAGE_UNAVAILABLE"},503);
 return reply({jobId:r.data.job_id,state:r.data.state,synthetic:true,renderingEnabled:false});
 }catch{return reply({error:"INVALID_OR_UNAVAILABLE"},400)}
}
