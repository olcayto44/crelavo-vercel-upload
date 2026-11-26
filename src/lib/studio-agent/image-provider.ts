import { z } from "zod";
import { createHash } from "node:crypto";
// Node-only native image decoder; use the same CommonJS entry in Next and offline tests.
const sharp: typeof import("sharp").default = require("sharp");

// MiniMax text-to-image, a single paid call. No client-controlled endpoint, URL
// download, implicit retry, fallback, provider key in output or settlement claim.
// Contract: https://platform.minimax.io/docs/api-reference/image-generation-t2i
export const ImageRequestSchema=z.strictObject({
 prompt:z.string().trim().min(1).max(1500),
 aspect:z.enum(["1:1","16:9","4:3","3:2","2:3","3:4","9:16","21:9"]),
});
export type ImageRequest=z.infer<typeof ImageRequestSchema>;
const dimensions:Record<ImageRequest["aspect"],[number,number]>={"1:1":[1024,1024],"16:9":[1280,720],"4:3":[1152,864],"3:2":[1248,832],"2:3":[832,1248],"3:4":[864,1152],"9:16":[720,1280],"21:9":[1344,576]};
const maxBody=16*1024*1024;
const receiptId=z.string().regex(/^[A-Za-z0-9_-]{8,160}$/);
export type ImageReceipt={provider:"minimax"|"openai"|"fal"|"stability"|"replicate";model:"image-01"|"gpt-image-2.6-flare"|"fal-ai/flux/schnell"|"core"|"black-forest-labs/flux-schnell";usage?:{textTokens:number;outputTokens:number};providerRequestId:string;imageCount:1;sha256:string;width:number;height:number;mime:"image/png";costState:"pending_reconciliation"};
export type ImageProviderResult={state:"artifact_validated";bytes:Buffer;receipt:ImageReceipt}|{state:"reconciliation_required";code:string;providerRequestId?:string};
const uncertain=(code:string,id?:string):ImageProviderResult=>({state:"reconciliation_required",code,...(id?{providerRequestId:id}:{})});
async function readLimited(response:Response){
 const reader=response.body?.getReader();if(!reader)throw Error("missing_body");
 let size=0;const decoder=new TextDecoder();const chunks:string[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBody)throw Error("body_limit");chunks.push(decoder.decode(value,{stream:true}));}chunks.push(decoder.decode());return chunks.join("");}finally{await reader.cancel().catch(()=>{});}
}
// Only the isolated central orchestrator may call this low-level transport.
// All returned failures after dispatch are conservative/uncertain, including 4xx.
export async function generateSingleMinimaxImage(raw:unknown,apiKey:string,transport:typeof fetch=fetch,referenceJpeg?:Buffer):Promise<ImageProviderResult>{
 const input=ImageRequestSchema.parse(raw);
 if(referenceJpeg&&(referenceJpeg.length>1_000_000||referenceJpeg[0]!==255||referenceJpeg[1]!==216))throw Error("image_reference_invalid");
 if(!apiKey.trim())throw Error("image_provider_key_missing");
 let id:string|undefined;
 try{
  const res=await transport("https://api.minimax.io/v1/image_generation",{method:"POST",redirect:"error",signal:AbortSignal.timeout(90000),headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({model:"image-01",prompt:input.prompt,aspect_ratio:input.aspect,response_format:"base64",n:1,prompt_optimizer:false,...(referenceJpeg?{subject_reference:[{type:"character",image_file:"data:image/jpeg;base64,"+referenceJpeg.toString("base64")}]}:{})})});
  const rawResponse=JSON.parse(await readLimited(res));
  const parsedId=receiptId.safeParse(rawResponse?.id);if(parsedId.success)id=parsedId.data;
  const status=String(rawResponse?.base_resp?.status_code??"missing");
  if(!res.ok)return uncertain("minimax_http_"+res.status,id);
  if(status!=="0")return uncertain("minimax_status_"+(/^[0-9]{1,8}$/.test(status)?status:"missing"),id);
  if(!id)return uncertain("minimax_trace_id_missing");
  if(String(rawResponse?.metadata?.success_count)!=="1"||String(rawResponse?.metadata?.failed_count)!=="0")return uncertain("minimax_metadata_count_mismatch",id);
  const images=rawResponse?.data?.image_base64;
  if(!Array.isArray(images)||images.length!==1||typeof images[0]!=="string"||images[0].length>maxBody||!(/^[A-Za-z0-9+/]+={0,2}$/).test(images[0])||images[0].length%4!==0)return uncertain("image_payload_invalid",id);
  const decoded=Buffer.from(images[0],"base64");
  if(decoded.toString("base64")!==images[0]||decoded.length<16)return uncertain("image_payload_invalid",id);
  const image=sharp(decoded,{limitInputPixels:4_194_304,failOn:"warning"});
  const metadata=await image.metadata(),[width,height]=dimensions[input.aspect];
  if(!["png","jpeg","webp"].includes(metadata.format??"")||metadata.width!==width||metadata.height!==height||(metadata.pages??1)!==1)return uncertain("image_dimensions_or_format_invalid",id);
  // Fully decode, normalize to PNG, strip metadata; this is not a URL proof.
  const bytes=await image.png().toBuffer();
  if(!bytes.length||bytes.length>12*1024*1024)return uncertain("image_output_invalid",id);
  return {state:"artifact_validated",bytes,receipt:{provider:"minimax",model:"image-01",providerRequestId:id,imageCount:1,sha256:createHash("sha256").update(bytes).digest("hex"),width,height,mime:"image/png",costState:"pending_reconciliation"}};
 }catch{return uncertain("image_provider_outcome_unconfirmed",id);}
}

// Direct Images API. Explicit model, single image, no retries or URL fetches.
export async function generateSingleOpenAIWebsiteImage(raw:unknown,apiKey:string,transport:typeof fetch=fetch):Promise<ImageProviderResult>{
 const input=ImageRequestSchema.parse(raw);
 if(!apiKey.trim()||input.aspect!=="16:9")throw Error("website_image_route_invalid");
 let id:string|undefined;
 try{
 const res=await transport("https://api.openai.com/v1/images/generations",{method:"POST",redirect:"error",signal:AbortSignal.timeout(90000),headers:{Authorization:"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-image-2.6-flare",prompt:input.prompt,size:"1280x720",quality:"low",n:1,output_format:"png"})});
 const receipt=receiptId.safeParse(res.headers.get("x-request-id"));if(receipt.success)id=receipt.data;
 const body=JSON.parse(await readLimited(res)),usage=z.object({input_tokens:z.number().int().nonnegative(),output_tokens:z.number().int().positive(),input_tokens_details:z.object({text_tokens:z.number().int().nonnegative(),image_tokens:z.literal(0)})}).safeParse(body?.usage);
 if(!res.ok||!id||!usage.success||usage.data.input_tokens!==usage.data.input_tokens_details.text_tokens||!Array.isArray(body?.data)||body.data.length!==1)return uncertain("image_provider_receipt_unverified",id);
 const encoded=body.data[0]?.b64_json;
 if(typeof encoded!=="string"||encoded.length>maxBody||encoded.length%4!==0||!(/^[A-Za-z0-9+/]+={0,2}$/).test(encoded))return uncertain("image_payload_invalid",id);
 const decoded=Buffer.from(encoded,"base64");if(decoded.toString("base64")!==encoded||decoded.length<16)return uncertain("image_payload_invalid",id);
 const image=sharp(decoded,{limitInputPixels:4194304,failOn:"warning"}),meta=await image.metadata();
 if(meta.format!=="png"||meta.width!==1280||meta.height!==720||(meta.pages??1)!==1)return uncertain("image_dimensions_or_format_invalid",id);
 const bytes=await image.png().toBuffer();if(!bytes.length||bytes.length>12*1024*1024)return uncertain("image_output_invalid",id);
 return {state:"artifact_validated",bytes,receipt:{provider:"openai",model:"gpt-image-2.6-flare",providerRequestId:id,imageCount:1,sha256:createHash("sha256").update(bytes).digest("hex"),width:1280,height:720,mime:"image/png",costState:"pending_reconciliation",usage:{textTokens:usage.data.input_tokens,outputTokens:usage.data.output_tokens}}};
 }catch{return uncertain("image_provider_outcome_unconfirmed",id);}
}

export const websiteImageProviderModels={openai:"gpt-image-2.6-flare",minimax:"image-01",fal:"fal-ai/flux/schnell",stability:"core",replicate:"black-forest-labs/flux-schnell"} as const;
type AlternativeProvider="fal"|"stability"|"replicate";
async function limitedBytes(response:Response){
 if(!response.ok)throw Error("image_fetch_failed");
 const reader=response.body?.getReader();if(!reader)throw Error("missing_body");
 const chunks:Buffer[]=[];let count=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>12*1024*1024)throw Error("image_body_limit");chunks.push(Buffer.from(value));}return Buffer.concat(chunks);}finally{await reader.cancel().catch(()=>{});}
}
function decodeImageData(url:unknown){
 if(typeof url!=="string"||url.length>maxBody)throw Error("image_payload_invalid");
 const match=/^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(url);
 if(!match||match[1].length%4!==0)throw Error("image_payload_invalid");
 const bytes=Buffer.from(match[1],"base64");if(bytes.toString("base64")!==match[1])throw Error("image_payload_invalid");return bytes;
}
async function externalImage(url:unknown,provider:"fal"|"replicate",transport:typeof fetch){
 if(typeof url!=="string"||url.length>4096)throw Error("image_url_invalid");
 const u=new URL(url),hosts=provider==="fal"?["fal.media"]:["replicate.delivery"];
 if(u.protocol!=="https:"||u.username||u.password||u.port||!hosts.some(host=>u.hostname===host||u.hostname.endsWith("."+host)))throw Error("image_url_not_allowed");
 // No provider token is ever sent to a media CDN, and redirects are rejected.
 return limitedBytes(await transport(u.href,{method:"GET",redirect:"error",signal:AbortSignal.timeout(10000)}));
}
async function normalizeAlternative(bytes:Buffer,provider:AlternativeProvider,id:string):Promise<ImageProviderResult>{
 const image=sharp(bytes,{limitInputPixels:4194304,failOn:"warning"}),meta=await image.metadata();
 if(!["png","jpeg","webp"].includes(meta.format??"")||!meta.width||!meta.height||meta.width<640||meta.height<360||Math.abs(meta.width/meta.height-16/9)>.1||(meta.pages??1)!==1)return uncertain("image_dimensions_or_format_invalid",id);
 const result=await image.resize(1280,720,{fit:"cover",position:"centre"}).png().toBuffer();
 if(result.length<16||result.length>12*1024*1024)return uncertain("image_output_invalid",id);
 return {state:"artifact_validated",bytes:result,receipt:{provider,model:websiteImageProviderModels[provider],providerRequestId:id,imageCount:1,sha256:createHash("sha256").update(result).digest("hex"),width:1280,height:720,mime:"image/png",costState:"pending_reconciliation"}};
}
/** One POST per approved request. Never retry a generation or switch providers after dispatch. */
export async function generateAlternativeWebsiteImage(provider:AlternativeProvider,raw:unknown,key:string,transport:typeof fetch=fetch):Promise<ImageProviderResult>{
 const input=ImageRequestSchema.parse(raw);if(input.aspect!=="16:9"||!key.trim())throw Error("website_image_route_invalid");
 let id:string|undefined;
 const readId=(v:unknown)=>{const parsed=receiptId.safeParse(v);return parsed.success?parsed.data:undefined;};
 try{
 if(provider==="stability"){
 const form=new FormData();form.set("prompt",input.prompt);form.set("aspect_ratio","16:9");form.set("output_format","png");
 const res=await transport("https://api.stability.ai/v2beta/stable-image/generate/core",{method:"POST",redirect:"error",signal:AbortSignal.timeout(90000),headers:{Authorization:"Bearer "+key,Accept:"image/*"},body:form});
 id=readId(res.headers.get("x-request-id")??res.headers.get("request-id")??res.headers.get("x-stability-request-id"));
 if(!res.ok||!id||res.headers.get("finish-reason")!=="SUCCESS")return uncertain("image_provider_receipt_unverified",id);
 return normalizeAlternative(await limitedBytes(res),provider,id);
 }
 if(provider==="fal"){
 const res=await transport("https://fal.run/fal-ai/flux/schnell",{method:"POST",redirect:"error",signal:AbortSignal.timeout(90000),headers:{Authorization:"Key "+key,"Content-Type":"application/json","X-Fal-Store-IO":"0","x-app-fal-disable-fallback":"true"},body:JSON.stringify({prompt:input.prompt,image_size:{width:1280,height:720},num_images:1,num_inference_steps:4,enable_safety_checker:true,output_format:"png",sync_mode:true})});
 id=readId(res.headers.get("x-fal-request-id")??res.headers.get("x-request-id"));
 const body=JSON.parse(await readLimited(res));if(!res.ok||!id||!Array.isArray(body?.images)||body.images.length!==1||!Array.isArray(body.has_nsfw_concepts)||body.has_nsfw_concepts.length!==1||body.has_nsfw_concepts[0]!==false)return uncertain("image_provider_receipt_unverified",id);
 const url=body.images[0]?.url;
 return normalizeAlternative(typeof url==="string"&&url.startsWith("data:")?decodeImageData(url):await externalImage(url,provider,transport),provider,id);
 }
 const res=await transport("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",{method:"POST",redirect:"error",signal:AbortSignal.timeout(90000),headers:{Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"wait=60"},body:JSON.stringify({input:{prompt:input.prompt,aspect_ratio:"16:9",megapixels:"1",num_outputs:1,output_format:"png",num_inference_steps:4,disable_safety_checker:false}})});
 const body=JSON.parse(await readLimited(res));id=readId(body?.id);
 if(!res.ok||!id||body.status!=="succeeded"||!Array.isArray(body.output)||body.output.length!==1)return uncertain("image_provider_outcome_unconfirmed",id);
 return normalizeAlternative(await externalImage(body.output[0],provider,transport),provider,id);
 }catch{return uncertain("image_provider_outcome_unconfirmed",id);}
}
