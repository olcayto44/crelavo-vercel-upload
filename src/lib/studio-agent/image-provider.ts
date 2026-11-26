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
export type ImageReceipt={provider:"minimax"|"openai";model:"image-01"|"gpt-image-2.6-flare";usage?:{textTokens:number;outputTokens:number};providerRequestId:string;imageCount:1;sha256:string;width:number;height:number;mime:"image/png";costState:"pending_reconciliation"};
export type ImageProviderResult={state:"artifact_validated";bytes:Buffer;receipt:ImageReceipt}|{state:"reconciliation_required";code:string;providerRequestId?:string};
const uncertain=(code:string,id?:string):ImageProviderResult=>({state:"reconciliation_required",code,...(id?{providerRequestId:id}:{})});
async function readLimited(response:Response){
 const reader=response.body?.getReader();if(!reader)throw Error("missing_body");
 let size=0;const decoder=new TextDecoder();const chunks:string[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBody)throw Error("body_limit");chunks.push(decoder.decode(value,{stream:true}));}chunks.push(decoder.decode());return chunks.join("");}finally{await reader.cancel().catch(()=>{});}
}
// Only the isolated central orchestrator may call this low-level transport.
// All returned failures after dispatch are conservative/uncertain, including 4xx.
export async function generateSingleMinimaxImage(raw:unknown,apiKey:string,transport:typeof fetch=fetch):Promise<ImageProviderResult>{
 const input=ImageRequestSchema.parse(raw);
 if(!apiKey.trim())throw Error("image_provider_key_missing");
 let id:string|undefined;
 try{
  const res=await transport("https://api.minimax.io/v1/image_generation",{method:"POST",redirect:"error",signal:AbortSignal.timeout(90000),headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({model:"image-01",prompt:input.prompt,aspect_ratio:input.aspect,response_format:"base64",n:1,prompt_optimizer:false})});
  const rawResponse=JSON.parse(await readLimited(res));
  const parsedId=receiptId.safeParse(rawResponse?.id);if(parsedId.success)id=parsedId.data;
  if(!res.ok||rawResponse?.base_resp?.status_code!==0||!id||String(rawResponse?.metadata?.success_count)!=="1"||String(rawResponse?.metadata?.failed_count)!=="0")return uncertain("image_provider_receipt_unverified",id);
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
