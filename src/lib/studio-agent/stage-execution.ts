import {createHash} from "node:crypto";
import {z} from "zod";
import {StageImageInput,StageCategory,type StageImageInput} from "./stage-plan";
import {generateSingleMinimaxImage,type ImageProviderResult} from "./image-provider";
const sharp:typeof import("sharp").default=require("sharp");
const Claim=z.object({claimed:z.boolean(),state:z.string(),ordinal:z.number().int().nonnegative().optional(),token:z.string().uuid().optional(),operation:z.string().optional(),input:z.unknown().optional(),credits:z.number().int().positive().optional()});
export type StageJob={id:string;user_id:string;category:string;plan_hash:string;tariff_version:string;state:string;auto_resume:boolean};
type RPC=(name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:unknown}>;
type Dependencies={rpc:RPC,enabled:()=>boolean,tariffVersion:string,credits:number,loadFirstArtifact:(job:StageJob)=>Promise<string>,generate:(input:StageImageInput,reference?:Buffer)=>Promise<ImageProviderResult>};
export async function stageReferenceJpeg(encoded:string,maxSize=1000000){
 const raw=Buffer.from(encoded,"base64");
 if(!raw.length||raw.toString("base64")!==encoded||raw.length>2100000)throw Error("reference_invalid");
 const image=sharp(raw,{limitInputPixels:4194304,failOn:"warning"}),m=await image.metadata();
 if(!["png","jpeg","webp"].includes(m.format??"")||(m.pages??1)!==1)throw Error("reference_invalid");
 const bytes=await image.resize(512,512,{fit:"inside",withoutEnlargement:true}).rotate().jpeg({quality:65}).toBuffer();
 if(bytes.length>maxSize)throw Error("reference_too_large");return bytes;
}
export function stageMinimaxGenerate(key:string,input:StageImageInput,reference?:Buffer){
 return generateSingleMinimaxImage({prompt:input.prompt,aspect:input.aspect},key,fetch,reference);
}
export async function executeStage(job:StageJob,d:Dependencies){
 if(!d.enabled()||!StageCategory.safeParse(job.category).success||job.tariff_version!==d.tariffVersion)return {state:job.state,code:"adapter_or_tariff_unavailable",dispatched:false};
 const r=await d.rpc("studio_stage_claim",{p_user:job.user_id,p_job:job.id,p_hash:job.plan_hash});
 if(r.error)throw Error("stage_claim_unconfirmed");
 const claim=Claim.parse(r.data);if(!claim.claimed)return {...r.data as object,dispatched:false};
 if(claim.ordinal===undefined||!claim.token)throw Error("stage_claim_unconfirmed");
 const args={p_user:job.user_id,p_job:job.id,p_ordinal:claim.ordinal,p_token:claim.token};
 const finish=async(outcome:string,receipt:unknown,artifact:string|null,code:string|null)=>{const result=await d.rpc("studio_stage_finish",{...args,p_outcome:outcome,p_receipt:receipt,p_artifact:artifact,p_code:code});if(result.error||!result.data)throw Error("stage_settlement_unconfirmed");return result.data;};
 let input:StageImageInput,reference:Buffer|undefined;
 try{
  if(claim.operation!=="image_generate"||claim.credits!==d.credits||!d.enabled())throw Error("adapter_or_tariff_unavailable");
  input=StageImageInput.parse(claim.input);
  if(job.category==="visual_clone"&&!input.referenceJpeg)throw Error("authorized_reference_required");
  if(input.referenceFromFirst&&claim.ordinal===0)throw Error("reference_stage_invalid");
  if(input.referenceFromFirst)reference=await stageReferenceJpeg(await d.loadFirstArtifact(job));
  else if(input.referenceJpeg)reference=await stageReferenceJpeg(input.referenceJpeg);
 }catch{return {result:await finish("not_dispatched",null,null,"pre_dispatch_validation_failed"),dispatched:false};}
 try{
  const result=await d.generate(input,reference);
  if(result.state!=="artifact_validated")return {result:await finish("uncertain",null,null,result.code),dispatched:true};
  const receipt=result.receipt;
  if(receipt.provider!=="minimax"||receipt.model!=="image-01"||createHash("sha256").update(result.bytes).digest("hex")!==receipt.sha256)throw Error("provider_receipt_mismatch");
  const img=sharp(result.bytes,{limitInputPixels:4194304,failOn:"warning"});
  const metadata=await img.metadata();if(metadata.format!=="png"||metadata.width!==receipt.width||metadata.height!==receipt.height)throw Error("artifact_invalid");
  const bytes=await img.webp({quality:90}).toBuffer();
  if(bytes.length>2100000||bytes.length<16)throw Error("delivery_artifact_size");
  const outputReceipt={...receipt,deliveryMime:"image/webp",deliverySha256:createHash("sha256").update(bytes).digest("hex"),deliveryBytes:bytes.length};
  return {result:await finish("ready",outputReceipt,bytes.toString("base64"),null),dispatched:true};
 }catch{try{await finish("uncertain",null,null,"provider_or_settlement_unconfirmed");}catch{/* durable claim stays held; never replay a provider call */}return {state:"reconcile_required",dispatched:true};}
}
