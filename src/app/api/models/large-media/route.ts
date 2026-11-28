import {randomUUID} from "node:crypto";
import {z} from "zod";
import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {MODEL_MEDIA_BUCKET,modelAssetKey} from "@/lib/model-media-contract";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co";
const enabled=()=>process.env.VERCEL_ENV==="preview"&&process.env.MODEL_LARGE_MEDIA_ENABLED==="true"&&(process.env.NEXT_PUBLIC_SUPABASE_URL??process.env.NEXT_PUBLIC_SUPABASE??"").trim().replace(/\/$/,"")===origin&&!!process.env.MODEL_MEDIA_PILOT_USER_ID;
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
const types={"image/jpeg":"image","image/png":"image","image/webp":"image","video/mp4":"video","video/quicktime":"video","audio/mpeg":"audio","audio/wav":"audio"} as const;
const schema=z.object({mime:z.enum(["image/jpeg","image/png","image/webp","video/mp4","video/quicktime","audio/mpeg","audio/wav"]),bytes:z.number().int().min(3000001).max(50000000),rights:z.literal(true)}).strict();
export async function GET(req:Request){try{if(!enabled())return reply({enabled:false});const token=bearerTokenFromRequest(req);if(!token)return reply({enabled:false});const {data,error}=await supabaseAdmin().auth.getUser(token);return reply({enabled:!error&&data.user?.id===process.env.MODEL_MEDIA_PILOT_USER_ID,maxBytes:50000000})}catch{return reply({enabled:false})}}
export async function POST(req:Request){try{
 if(!enabled())return reply({error:"DISABLED"},503);
 if(req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"INVALID_ORIGIN"},403);
 const token=bearerTokenFromRequest(req);if(!token)return reply({error:"SIGN_IN"},401);
 const db=supabaseAdmin(),{data,error}=await db.auth.getUser(token),owner=data.user?.id;
 if(error||!owner||owner!==process.env.MODEL_MEDIA_PILOT_USER_ID)return reply({error:"SIGN_IN"},401);
 const reader=req.body?.getReader();if(!reader)return reply({error:"INVALID"},400);let n=0;const chunks:Uint8Array[]=[];try{for(;;){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>1024){await reader.cancel();return reply({error:"INVALID"},400)}chunks.push(r.value)}}finally{reader.releaseLock()}
 const parsed=schema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));if(!parsed.success)return reply({error:"INVALID"},400);
 const {mime,bytes}=parsed.data,kind=types[mime];
 if(kind==="image"&&bytes>=30000000||kind==="audio"&&bytes>=15000000)return reply({error:"INVALID_SIZE"},400);
 const config=await db.storage.getBucket(MODEL_MEDIA_BUCKET);if(config.error||config.data?.public!==false||config.data.file_size_limit!==50000000)return reply({error:"STORAGE_UNAVAILABLE"},503);
 const id=randomUUID(),key=modelAssetKey(owner,id);
 const reserved=await db.rpc("model_reserve_large_media",{p_user:owner,p_id:id,p_kind:kind,p_mime:mime,p_bytes:bytes});
 if(reserved.error||reserved.data?.object_key!==key)return reply({error:"RESERVATION_FAILED"},409);
 const ticket=await db.storage.from(MODEL_MEDIA_BUCKET).createSignedUploadUrl(key,{upsert:false});
 if(ticket.error||!ticket.data?.token)return reply({error:"UPLOAD_UNAVAILABLE"},503);
 return reply({assetId:id,path:key,token:ticket.data.token,state:"quarantined",renderingEnabled:false});
 }catch{return reply({error:"UNAVAILABLE"},503)}}
