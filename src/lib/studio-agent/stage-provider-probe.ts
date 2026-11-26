import {createHash} from "node:crypto";
import {generateSingleMinimaxImage} from "./image-provider";
import {generateStageEdit} from "./stage-image-edit";
import type {StageEnvironment} from "./stage-environment";
const sharp:typeof import("sharp").default=require("sharp");
// Only a service-role seeded, expiring, fixed suite is eligible. Exactly one
// provider call per durable claim. Never accept a customer prompt or retry a claim.
export const PROBE_SUITE="visual-acceptance-20261127-v1";
export async function runStageProviderProbe(e:StageEnvironment){
 if(e.scope!=="production"||process.env.CRELAVO_STAGE_PROBE_ENABLED!=="true")return {processed:0,reason:"disabled"};
 const r=await e.db.rpc("studio_provider_probe_claim",{p_suite:PROBE_SUITE});
 if(r.error)throw Error("probe_claim_unconfirmed");
 const p=r.data as {id:string;kind:string}|null;if(!p)return {processed:0,reason:"no_approved_probe"};
 let state="reconcile_required",receipt:Record<string,unknown>|null=null,artifact:string|null=null,code:string|null=null;
 try{
  let result;
  if(p.kind==="minimax_image"&&e.key){result=await generateSingleMinimaxImage({prompt:"A single cobalt blue ceramic coffee mug on a clean ivory studio background, centered original product photograph, no text or logo.",aspect:"1:1"},e.key);}
  else if(p.kind==="stability_remove_background"&&e.editKey){
   const source=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#faf7ec"/><rect x="165" y="145" width="170" height="210" rx="18" fill="#154b99"/><circle cx="335" cy="230" r="55" fill="none" stroke="#154b99" stroke-width="28"/></svg>')).png().toBuffer();
   result=await generateStageEdit({operation:"remove_background",prompt:"",referenceJpeg:"fixture"},source,e.editKey);
  }else throw Error("probe_configuration_missing");
  if(result.state==="artifact_validated"){
   const bytes=await sharp(result.bytes,{limitInputPixels:16777216}).webp({quality:85}).toBuffer();
   if(!bytes.length||bytes.length>2100000)throw Error("probe_artifact_size");
   receipt={...result.receipt,deliverySha256:createHash("sha256").update(bytes).digest("hex"),deliveryBytes:bytes.length};
   artifact=bytes.toString("base64");state="ready";
  }else{code=result.code;receipt=result.providerRequestId?{providerRequestId:result.providerRequestId}:null;}
 }catch{code="probe_outcome_unconfirmed";}
 const done=await e.db.from("studio_provider_probes").update({state,receipt,artifact_base64:artifact,error_code:code,completed_at:new Date().toISOString()}).eq("id",p.id).eq("state","claimed").select("id").maybeSingle();
 if(done.error||!done.data)throw Error("probe_settlement_unconfirmed");
 return {processed:1,kind:p.kind,state,code};
}
