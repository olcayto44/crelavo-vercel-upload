import {createHash} from "node:crypto";
import {generateSingleMinimaxImage,generateStageStabilityImage} from "./image-provider";
import {buildStageBrandBundle} from "./stage-brand-bundle";
import {generateStageEdit,EditOperation,type EditInput} from "./stage-image-edit";
import type {StageEnvironment} from "./stage-environment";
const sharp:typeof import("sharp").default=require("sharp");
// Only a service-role seeded, expiring, fixed suite is eligible. Exactly one
// provider call per durable claim. Never accept a customer prompt or retry a claim.
export const PROBE_SUITE="visual-acceptance-20261127-v2";
export async function runStageProviderProbe(e:StageEnvironment){
 if(e.scope!=="production"||process.env.CRELAVO_STAGE_PROBE_ENABLED!=="true")return {processed:0,reason:"disabled"};
 const r=await e.db.rpc("studio_provider_probe_claim",{p_suite:PROBE_SUITE});
 if(r.error)throw Error("probe_claim_unconfirmed");
 const p=r.data as {id:string;kind:string}|null;if(!p)return {processed:0,reason:"no_approved_probe"};
 let state="reconcile_required",receipt:Record<string,unknown>|null=null,artifact:string|null=null,code:string|null=null;
 try{
  let result;
  const source=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#faf7ec"/><rect x="165" y="145" width="170" height="210" rx="18" fill="#154b99"/><circle cx="335" cy="230" r="55" fill="none" stroke="#154b99" stroke-width="28"/><rect x="35" y="400" width="55" height="55" fill="#de674b"/></svg>')).png().toBuffer();
  if(p.kind==="minimax_image"&&e.key){result=await generateSingleMinimaxImage({prompt:"A single cobalt blue ceramic coffee mug on a clean ivory studio background, centered original product photograph, no text or logo.",aspect:"1:1"},e.key);}
  else if(p.kind==="minimax_brand"&&e.key){result=await generateSingleMinimaxImage({prompt:"Original visual identity moodboard for fictional Aurora Ceramic Studio, cobalt blue and ivory abstract geometric mark, premium editorial design, no text.",aspect:"1:1"},e.key);}
  else if(p.kind==="minimax_model"&&e.key){result=await generateSingleMinimaxImage({prompt:"Fictional adult female virtual fashion model, short dark brown hair, warm brown eyes, olive green jacket, neutral studio, natural editorial portrait.",aspect:"1:1"},e.key);}
  else if(p.kind==="minimax_character"&&e.key){
   const prev=await e.db.from("studio_provider_probes").select("artifact_base64,receipt").eq("suite",PROBE_SUITE).eq("kind","minimax_model").eq("state","ready").maybeSingle();
   if(prev.error||!prev.data?.artifact_base64)throw Error("reference_probe_not_ready");
   const bytes=Buffer.from(String(prev.data.artifact_base64),"base64");if(prev.data.receipt?.deliverySha256!==createHash("sha256").update(bytes).digest("hex"))throw Error("reference_integrity");
   const ref=await sharp(bytes).resize(512,512,{fit:"inside"}).jpeg({quality:65}).toBuffer();
   result=await generateSingleMinimaxImage({prompt:"Same fictional adult fashion model, olive green jacket, different pose in a sunlit modern studio, preserve facial appearance.",aspect:"1:1"},e.key,fetch,ref);
  }else if((p.kind==="stability_generate"||p.kind==="stability_brand"||p.kind==="stability_model")&&e.editKey){
   const prompt=p.kind==="stability_brand"?"Original premium abstract brand identity moodboard for fictional Aurora Ceramic Studio, blue and ivory, no text":p.kind==="stability_model"?"Fictional adult virtual fashion model in an olive green jacket, editorial portrait, studio lighting":"Single cobalt blue ceramic mug on a clean ivory studio background, original product photograph";
   result=await generateStageStabilityImage({prompt,aspect:"1:1"},e.editKey);
  }else if(p.kind.startsWith("stability_")&&e.editKey){
   const operation=EditOperation.parse(p.kind.slice("stability_".length));
   const mask=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="black"/><rect x="20" y="385" width="85" height="85" fill="white"/></svg>')).png().toBuffer();
   const prompts:Record<string,string>={inpaint:"Small green leaf on the table",outpaint:"Extend the clean ivory studio background around the blue mug",replace_object:"A small yellow cube",replace_background:"Warm pale gray studio background",product_reference:"Cobalt blue ceramic mug, professional studio product photograph, neutral background"};
   const input:EditInput={operation,prompt:prompts[operation]??"",referenceJpeg:"fixture",...(operation==="erase_object"||operation==="inpaint"?{mask:mask.toString("base64")}:{}),...(operation==="replace_object"?{search:"red square"}:{}),...(operation==="outpaint"?{expand:64}:{})};
   result=await generateStageEdit(input,source,e.editKey);
  }else throw Error("probe_configuration_missing");
  if(result.state==="artifact_validated"){
   const bytes=await sharp(result.bytes,{limitInputPixels:16777216}).webp({quality:85}).toBuffer();
   if(!bytes.length||bytes.length>2100000)throw Error("probe_artifact_size");
   receipt={...result.receipt,deliverySha256:createHash("sha256").update(bytes).digest("hex"),deliveryBytes:bytes.length};
   if(p.kind==="minimax_brand"||p.kind==="stability_brand"){
    const zip=await buildStageBrandBundle("Aurora Ceramic Studio",[{bytes,sha256:String(receipt.deliverySha256)}]);
    receipt.brandZipBytes=zip.length;receipt.brandZipSha256=createHash("sha256").update(zip).digest("hex");
   }
   artifact=bytes.toString("base64");state="ready";
  }else{code=result.code;receipt=result.providerRequestId?{providerRequestId:result.providerRequestId}:null;}
 }catch(e){code=e instanceof Error&&["reference_probe_not_ready","reference_integrity","probe_configuration_missing"].includes(e.message)?e.message:"probe_outcome_unconfirmed";}
 const done=await e.db.from("studio_provider_probes").update({state,receipt,artifact_base64:artifact,error_code:code,completed_at:new Date().toISOString()}).eq("id",p.id).eq("state","claimed").select("id").maybeSingle();
 if(done.error||!done.data)throw Error("probe_settlement_unconfirmed");
 return {processed:1,kind:p.kind,state,code};
}
