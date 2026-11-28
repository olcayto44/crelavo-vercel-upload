import {createHash,randomUUID} from "node:crypto";
import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {MODEL_MEDIA_BUCKET,modelAssetKey} from "@/lib/model-media-contract";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=30;
const MAX=3000000; // bounded initial preview pilot; large files need dedicated transport.
const TEST_ORIGIN="https://bwzxdxqgrgbsvndinmrv.supabase.co";
const TYPES={"image/jpeg":"image","image/png":"image","image/webp":"image","video/mp4":"video","video/quicktime":"video","audio/mpeg":"audio","audio/wav":"audio"} as const;
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
function enabled(){
 return process.env.VERCEL_ENV==="preview"&&process.env.MODEL_MEDIA_PILOT_ENABLED==="true"&&
 (process.env.NEXT_PUBLIC_SUPABASE_URL??process.env.NEXT_PUBLIC_SUPABASE??"").trim().replace(/\/$/,"")===TEST_ORIGIN&&
 !!process.env.MODEL_MEDIA_PILOT_USER_ID;
}
async function authorized(req:Request){
 if(!enabled())return null;
 const token=bearerTokenFromRequest(req);if(!token)return null;
 const db=supabaseAdmin(),{data,error}=await db.auth.getUser(token);
 if(error||!data.user||data.user.id!==process.env.MODEL_MEDIA_PILOT_USER_ID)return null;
 return {db,owner:data.user.id};
}
async function boundedBody(req:Request){
 if(Number(req.headers.get("content-length")??0)>MAX)throw Error("size");
 const reader=req.body?.getReader();if(!reader)throw Error("body");
 const chunks:Uint8Array[]=[];let bytes=0;
 try{for(;;){const r=await reader.read();if(r.done)break;bytes+=r.value.length;if(bytes>MAX){await reader.cancel();throw Error("size")}chunks.push(r.value)}}finally{reader.releaseLock()}
 if(!bytes)throw Error("empty");return Buffer.concat(chunks);
}
const recent=new Map<string,number>();let active=0;
export async function GET(req:Request){
 try{const a=await authorized(req);if(!a)return reply({enabled:false,renderingEnabled:false});
 const {data,error}=await a.db.from("model_media_assets").select("id,kind,mime,bytes,state,created_at").eq("user_id",a.owner).eq("model_id","magi-2").order("created_at",{ascending:false}).limit(20);
 if(error)return reply({enabled:false},503);
 return reply({enabled:true,maxBytes:MAX,assets:data,renderingEnabled:false});
 }catch{return reply({enabled:false},503)}
}
export async function POST(req:Request){
 if(!enabled())return reply({error:"PILOT_DISABLED"},503);
 if(req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"INVALID_ORIGIN"},403);
 if(req.headers.get("x-model-media-rights")!=="accepted")return reply({error:"RIGHTS_REQUIRED"},400);
 try{
 const a=await authorized(req);if(!a)return reply({error:"SIGN_IN"},401);
 const mime=(req.headers.get("content-type")??"").toLowerCase() as keyof typeof TYPES;
 if(!Object.prototype.hasOwnProperty.call(TYPES,mime))return reply({error:"INVALID_TYPE"},415);
 const now=Date.now();if(active>=2||now-(recent.get(a.owner)??0)<5000)return reply({error:"RATE_LIMIT"},429);
 recent.set(a.owner,now);active++;
 try{
 const {count,error}=await a.db.from("model_media_assets").select("id",{count:"exact",head:true}).eq("user_id",a.owner);
 if(error||count===null)return reply({error:"STORAGE_UNAVAILABLE"},503);
 if(count>=20)return reply({error:"PILOT_QUOTA"},409);
 const config=await a.db.storage.getBucket(MODEL_MEDIA_BUCKET);
 if(config.error||config.data?.public!==false)return reply({error:"STORAGE_UNAVAILABLE"},503);
 let bytes:Buffer;try{bytes=await boundedBody(req)}catch{return reply({error:"INVALID_SIZE"},413)}
 const id=randomUUID(),object_key=modelAssetKey(a.owner,id),kind=TYPES[mime];
 const row={id,user_id:a.owner,model_id:"magi-2",kind,mime,bytes:bytes.length,object_key,state:"quarantined",sha256:createHash("sha256").update(bytes).digest("hex")};
 // Record first; if upload fails retain a non-dispatchable rejected row for audit.
 const inserted=await a.db.from("model_media_assets").insert(row);if(inserted.error)return reply({error:"STORAGE_UNAVAILABLE"},503);
 const bucket=a.db.storage.from(MODEL_MEDIA_BUCKET);
 const uploaded=await bucket.upload(object_key,bytes,{contentType:mime,upsert:false,cacheControl:"0"});
 if(uploaded.error){await a.db.from("model_media_assets").update({state:"rejected"}).eq("id",id).eq("user_id",a.owner);return reply({error:"UPLOAD_FAILED"},503)}
 // Hash is not media verification; no downloads, provider URL, or paid action.
 return reply({asset:{id,kind,mime,bytes:bytes.length,state:"quarantined"},renderingEnabled:false},201);
 }finally{active--}
 }catch{return reply({error:"UPLOAD_FAILED"},503)}
}
