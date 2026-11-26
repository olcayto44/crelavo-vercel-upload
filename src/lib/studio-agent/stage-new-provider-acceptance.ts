import {createHash} from "node:crypto";
import {z} from "zod";
const sharp:typeof import("sharp").default=require("sharp");
// Acceptance-only, fixed-model, no automatic POST retries. The API key never
// appears in the URL, diagnostics, output download, or returned receipt.
type Result={state:"artifact_validated";bytes:Buffer;receipt:{provider:"gemini"|"runway";model:string;providerRequestId:string;imageCount:1;sha256:string;width:number;height:number;mime:"image/png";costState:"pending_reconciliation"}}|{state:"reconciliation_required";code:string;providerRequestId?:string};
const uncertain=(code:string,id?:string):Result=>({state:"reconciliation_required",code,...(id?{providerRequestId:id}:{})});
async function read(r:Response,max=16*1024*1024){const reader=r.body?.getReader();if(!reader)throw Error("missing_body");let n=0;const chunks:Buffer[]=[];try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>max)throw Error("body_limit");chunks.push(Buffer.from(value));}return Buffer.concat(chunks);}finally{await reader.cancel().catch(()=>{});}}
const idSchema=z.string().regex(/^[A-Za-z0-9_-]{8,160}$/);
async function normalize(raw:Buffer,provider:"gemini"|"runway",model:string,id:string):Promise<Result>{
 const image=sharp(raw,{limitInputPixels:4194304,failOn:"warning"}),m=await image.metadata();
 if(!["jpeg","png","webp"].includes(m.format??"")||!m.width||!m.height||m.width<512||m.height<512||Math.abs(m.width/m.height-1)>.04||(m.pages??1)!==1)return uncertain("image_dimensions_or_format_invalid",id);
 const bytes=await image.resize(1024,1024,{fit:"cover",position:"centre"}).png().toBuffer();
 if(bytes.length<16||bytes.length>12*1024*1024)return uncertain("image_output_invalid",id);
 return {state:"artifact_validated",bytes,receipt:{provider,model,providerRequestId:id,imageCount:1,sha256:createHash("sha256").update(bytes).digest("hex"),width:1024,height:1024,mime:"image/png",costState:"pending_reconciliation"}};
}
export async function generateGeminiAcceptance(prompt:string,key:string,reference?:Buffer,transport:typeof fetch=fetch):Promise<Result>{
 const model="gemini-3.1-flash-image";let id:string|undefined;
 if(!key.trim())return uncertain("gemini_key_missing");
 if(reference&&(!reference.length||reference.length>1000000||reference[0]!==255||reference[1]!==216))return uncertain("reference_invalid");
 try{
  const parts=[{text:prompt},...(reference?[{inlineData:{mimeType:"image/jpeg",data:reference.toString("base64")}}]:[])];
  const r=await transport("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{method:"POST",redirect:"error",signal:AbortSignal.timeout(90000),headers:{"x-goog-api-key":key,"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts}],generationConfig:{candidateCount:1,responseModalities:["TEXT","IMAGE"],imageConfig:{aspectRatio:"1:1",imageSize:"1K"}}})});
  if(!r.ok)return uncertain("gemini_http_"+r.status);
  const b=JSON.parse((await read(r)).toString("utf8")),p=idSchema.safeParse(b.responseId);if(p.success)id=p.data;
  if(!id||b.modelVersion!==model&&!String(b.modelVersion??"").startsWith(model+"-")||!Array.isArray(b.candidates)||b.candidates.length!==1||b.candidates[0].finishReason!=="STOP")return uncertain("gemini_receipt_unverified",id);
  const images=(b.candidates[0].content?.parts??[]).filter((part:any)=>part.thought!==true&&part.inlineData?.data);
  if(images.length!==1)return uncertain("gemini_image_count_invalid",id);
  const data=images[0].inlineData.data;if(typeof data!=="string"||data.length%4!==0||data.length>16000000||!(/^[A-Za-z0-9+/]+={0,2}$/).test(data))return uncertain("image_payload_invalid",id);
  const raw=Buffer.from(data,"base64");if(raw.toString("base64")!==data)return uncertain("image_payload_invalid",id);
  return await normalize(raw,"gemini",model,id);
 }catch{return uncertain("gemini_outcome_unconfirmed",id);}
}
export async function generateRunwayAcceptance(prompt:string,key:string,onTask:(id:string)=>Promise<void>,transport:typeof fetch=fetch):Promise<Result>{
 const model="gen4_image_turbo",headers={Authorization:"Bearer "+key,"X-Runway-Version":"2024-11-06","Content-Type":"application/json"};let id:string|undefined;
 if(!key.trim())return uncertain("runway_key_missing");
 try{
  const r=await transport("https://api.dev.runwayml.com/v1/text_to_image",{method:"POST",redirect:"error",signal:AbortSignal.timeout(15000),headers,body:JSON.stringify({model,ratio:"1024:1024",promptText:prompt})});
  if(!r.ok)return uncertain("runway_http_"+r.status);
  const b=JSON.parse((await read(r,65536)).toString("utf8")),parsed=z.string().uuid().safeParse(b.id);if(!parsed.success)return uncertain("runway_task_id_missing");id=parsed.data;
  await onTask(id); // persist the paid task id before polling; never re-dispatch.
  const deadline=Date.now()+70000;
  while(Date.now()<deadline){
   await new Promise(resolve=>setTimeout(resolve,5000));
   const s=await transport("https://api.dev.runwayml.com/v1/tasks/"+id,{method:"GET",redirect:"error",signal:AbortSignal.timeout(8000),headers});if(!s.ok)return uncertain("runway_poll_http_"+s.status,id);
   const t=JSON.parse((await read(s,65536)).toString("utf8"));if(t.id!==id)return uncertain("runway_task_mismatch",id);
   if(t.status==="FAILED"||t.status==="CANCELED")return uncertain("runway_task_"+t.status.toLowerCase(),id);
   if(t.status!=="SUCCEEDED")continue;
   if(!Array.isArray(t.output)||t.output.length!==1||typeof t.output[0]!=="string")return uncertain("runway_output_invalid",id);
   const url=new URL(t.output[0]);const allowed=["dnf8butk8bbsy.cloudfront.net","d1y6zccyuj4x6c.cloudfront.net","d1zxmob2olb5kh.cloudfront.net","dnznrvs05pmza.cloudfront.net","d2jqrm6oza8nb6.cloudfront.net"];
   if(url.protocol!=="https:"||url.username||url.password||url.port||!(url.hostname.endsWith(".runwayml.com")||url.hostname.endsWith(".runwayml.cloud")||allowed.includes(url.hostname)))return uncertain("runway_output_host_unverified",id);
   const media=await transport(url.href,{method:"GET",redirect:"error",signal:AbortSignal.timeout(8000)});if(!media.ok||!media.headers.get("content-type")?.startsWith("image/"))return uncertain("runway_download_failed",id);
   return await normalize(await read(media,12*1024*1024),"runway",model,id);
  }
  return uncertain("runway_task_pending_reconciliation",id);
 }catch{return uncertain("runway_outcome_unconfirmed",id);}
}
