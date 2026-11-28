import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {MODEL_DRAFT_BUCKET,MODEL_DRAFT_MAX_BYTES,ModelDraft,modelDraftObjectKey,type ModelDraftData} from "@/lib/model-draft-contract";
import sharp from "sharp";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
const limits=new Map<string,{count:number;until:number}>();
let active=0;
function permit(id:string){const now=Date.now();for(const [k,v] of limits)if(v.until<=now)limits.delete(k);if(limits.size>=2000&&!limits.has(id))return false;const v=limits.get(id)??{count:0,until:now+60000};if(v.count>=8)return false;v.count++;limits.set(id,v);return true}
async function readBounded(request:Request){if(Number(request.headers.get("content-length")??0)>MODEL_DRAFT_MAX_BYTES)throw Error("too_large");const r=request.body?.getReader();if(!r)throw Error("missing");const chunks:Uint8Array[]=[];let bytes=0;for(;;){const v=await r.read();if(v.done)break;bytes+=v.value.length;if(bytes>MODEL_DRAFT_MAX_BYTES){await r.cancel();throw Error("too_large")}chunks.push(v.value)}return JSON.parse(Buffer.concat(chunks).toString("utf8"))}
async function sanitize(d:ModelDraftData):Promise<ModelDraftData>{
 const images:ModelDraftData["images"]=[];
 for(const i of d.images){const b=Buffer.from(i.jpeg,"base64");if(b.toString("base64")!==i.jpeg||b.length>180000)throw Error("invalid_image");const im=sharp(b,{limitInputPixels:1024*1024,failOn:"warning"}),m=await im.metadata();if(m.format!=="jpeg"||(m.pages??1)!==1||!m.width||!m.height)throw Error("invalid_image");const clean=await im.rotate().resize(768,768,{fit:"inside",withoutEnlargement:true}).jpeg({quality:72}).toBuffer();if(clean.length>180000)throw Error("invalid_image");images.push({name:i.name.replace(/[\u0000-\u001f\u007f]/g," ").slice(0,120),jpeg:clean.toString("base64")})}
 return {...d,images};
}
async function handle(request:Request,method:"GET"|"POST"|"DELETE"){
 const token=bearerTokenFromRequest(request);if(!token)return reply({error:"SIGN_IN"},401);
 if(method!=="GET"&&request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"INVALID_ORIGIN"},403);
 try{
 const db=supabaseAdmin(),{data,error}=await db.auth.getUser(token);
 if(error||!data.user)return reply({error:"SIGN_IN"},401);
 if(active>=4||!permit(data.user.id))return reply({error:"RATE_LIMIT"},429);
 const key=modelDraftObjectKey(data.user.id);
 active++;
 try{
 const config=await db.storage.getBucket(MODEL_DRAFT_BUCKET);
 if(config.error||!config.data||config.data.public!==false)return reply({error:"STORAGE_NOT_READY"},503);
 const bucket=db.storage.from(MODEL_DRAFT_BUCKET);
 if(method==="DELETE"){const r=await bucket.remove([key]);if(r.error)return reply({error:"DELETE_FAILED"},503);return reply({deleted:true})}
 if(method==="GET"){const r=await bucket.download(key);if(r.error){const status=String((r.error as unknown as {statusCode?:string;status?:number}).statusCode??(r.error as unknown as {status?:number}).status??"");if(status==="404"||status==="400"&&/not found/i.test(r.error.message))return reply({draft:null});return reply({error:"READ_FAILED"},503)}if(!r.data||r.data.size>MODEL_DRAFT_MAX_BYTES)return reply({error:"READ_FAILED"},503);const saved=JSON.parse(await r.data.text());const validated=ModelDraft.safeParse(saved.draft);if(!validated.success)return reply({error:"READ_FAILED"},503);return reply({draft:validated.data,savedAt:typeof saved.savedAt==="string"?saved.savedAt:null,renderingEnabled:false})}
 let raw:unknown;try{raw=await readBounded(request)}catch{return reply({error:"INVALID_DRAFT"},400)}
 const parsed=ModelDraft.safeParse(raw);if(!parsed.success)return reply({error:"INVALID_DRAFT"},400);
 let draft:ModelDraftData;try{draft=await sanitize(parsed.data)}catch{return reply({error:"INVALID_REFERENCE"},400)}
 const savedAt=new Date().toISOString(),body=JSON.stringify({draft,savedAt});
 if(Buffer.byteLength(body)>MODEL_DRAFT_MAX_BYTES)return reply({error:"INVALID_DRAFT"},400);
 const r=await bucket.upload(key,Buffer.from(body),{contentType:"application/json",cacheControl:"0",upsert:true});
 if(r.error)return reply({error:"SAVE_FAILED"},503);
 return reply({savedAt,renderingEnabled:false});
 }finally{active--}
 }catch{return reply({error:"STORAGE_UNAVAILABLE"},503)}
}
export const GET=(r:Request)=>handle(r,"GET");
export const POST=(r:Request)=>handle(r,"POST");
export const DELETE=(r:Request)=>handle(r,"DELETE");
