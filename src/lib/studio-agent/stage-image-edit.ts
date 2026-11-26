import {z} from "zod";
import {createHash} from "node:crypto";
const sharp:typeof import("sharp").default=require("sharp");
// Fixed provider routes; no URL or arbitrary model supplied by a customer.
export const editOperations=["remove_background","erase_object","inpaint","outpaint","replace_object","replace_background","upscale","product_reference"] as const;
export const EditOperation=z.enum(editOperations);
export type EditOperation=z.infer<typeof EditOperation>;
export const EditSource=z.strictObject({jobId:z.string().uuid(),ordinal:z.number().int().min(0).max(99)});
export const EditInput=z.strictObject({operation:EditOperation,prompt:z.string().max(1000),source:EditSource.optional(),referenceJpeg:z.string().max(40000).optional(),mask:z.string().max(40000).optional(),search:z.string().max(160).optional(),expand:z.number().int().min(32).max(256).optional()}).superRefine((v,ctx)=>{
 if(!v.source&&!v.referenceJpeg)ctx.addIssue({code:"custom",message:"source_required"});
 if(["inpaint","erase_object"].includes(v.operation)&&!v.mask)ctx.addIssue({code:"custom",message:"mask_required"});
 if(v.operation==="replace_object"&&!v.search?.trim())ctx.addIssue({code:"custom",message:"object_required"});
 if(["inpaint","outpaint","replace_object","replace_background","product_reference"].includes(v.operation)&&v.prompt.trim().length<3)ctx.addIssue({code:"custom",message:"prompt_required"});
});
export type EditInput=z.infer<typeof EditInput>;
const routes:Record<EditOperation,string>={remove_background:"edit/remove-background",erase_object:"edit/erase",inpaint:"edit/inpaint",outpaint:"edit/outpaint",replace_object:"edit/search-and-replace",replace_background:"edit/search-and-replace",upscale:"upscale/fast",product_reference:"control/structure"};
export type EditReceipt={provider:"stability";model:string;providerRequestId:string;imageCount:1;sha256:string;width:number;height:number;mime:"image/png";costState:"pending_reconciliation"};
export type EditResult={state:"artifact_validated";bytes:Buffer;receipt:EditReceipt}|{state:"reconciliation_required";code:string;providerRequestId?:string};
export async function prepareEditSource(raw:Buffer){
 if(!raw.length||raw.length>2100000)throw Error("source_size");
 const image=sharp(raw,{limitInputPixels:16777216,failOn:"warning"}),m=await image.metadata();
 if(!["png","jpeg","webp"].includes(m.format??"")||(m.pages??1)!==1)throw Error("source_format");
 const bytes=await image.resize(1024,1024,{fit:"inside",withoutEnlargement:true}).png().toBuffer(),meta=await sharp(bytes).metadata();
 return {bytes,width:meta.width!,height:meta.height!};
}
export async function prepareEditMask(encoded:string,width:number,height:number){
 const raw=Buffer.from(encoded,"base64");if(raw.toString("base64")!==encoded||raw.length>30000)throw Error("mask_invalid");
 const m=sharp(raw,{limitInputPixels:1048576,failOn:"warning"}),meta=await m.metadata();if(meta.format!=="png"||(meta.pages??1)!==1)throw Error("mask_format");
 const data=await m.removeAlpha().greyscale().resize(width,height,{fit:"fill",kernel:"nearest"}).threshold(128).raw().toBuffer();
 if(!data.some(x=>x===255)||!data.some(x=>x===0))throw Error("mask_empty_or_full");
 return sharp(data,{raw:{width,height,channels:1}}).png().toBuffer();
}
export async function prepareEditForm(input:EditInput,source:Buffer){
 const v=EditInput.parse(input),image=await prepareEditSource(source),f=new FormData();
 f.set("image",new Blob([new Uint8Array(image.bytes)],{type:"image/png"}),"source.png");
 f.set("output_format","png");
 if(v.mask&&["erase_object","inpaint"].includes(v.operation))f.set("mask",new Blob([new Uint8Array(await prepareEditMask(v.mask,image.width,image.height))],{type:"image/png"}),"mask.png");
 if(["inpaint","outpaint","replace_object","replace_background","product_reference"].includes(v.operation))f.set("prompt",v.prompt);
 if(v.operation==="replace_object"||v.operation==="replace_background")f.set("search_prompt",v.operation==="replace_background"?"background":v.search!);
 if(v.operation==="outpaint"){const n=String(v.expand??128);f.set("left",n);f.set("right",n);f.set("up",n);f.set("down",n);}
 if(v.operation==="product_reference")f.set("control_strength","0.8");
 return {form:f,route:routes[v.operation],source:image};
}
export async function generateStageEdit(v:EditInput,source:Buffer,key:string,transport:typeof fetch=fetch):Promise<EditResult>{
 // Preflight is separately executed by the orchestrator before its paid call.
 const p=await prepareEditForm(v,source);if(!key.trim())throw Error("edit_key_missing");
 let id:string|undefined;
 try{
  const r=await transport("https://api.stability.ai/v2beta/stable-image/"+p.route,{method:"POST",headers:{Authorization:"Bearer "+key,Accept:"image/*"},body:p.form,redirect:"error",signal:AbortSignal.timeout(90000)});
  const rawId=r.headers.get("x-request-id")??r.headers.get("request-id")??r.headers.get("x-stability-request-id");
  if(rawId&&/^[A-Za-z0-9_-]{8,160}$/.test(rawId))id=rawId;
  if(!r.ok)return {state:"reconciliation_required",code:"stability_http_"+r.status,providerRequestId:id};
  if(!id||r.headers.get("finish-reason")!=="SUCCESS"||!r.headers.get("content-type")?.startsWith("image/"))return {state:"reconciliation_required",code:"edit_receipt_unconfirmed",providerRequestId:id};
  const rd=r.body?.getReader();if(!rd)throw Error("missing_body");const chunks:Buffer[]=[];let size=0;
  try{for(;;){const {done,value}=await rd.read();if(done)break;size+=value.length;if(size>24000000)throw Error("edit_size");chunks.push(Buffer.from(value));}}finally{await rd.cancel().catch(()=>{});}
  const image=sharp(Buffer.concat(chunks),{limitInputPixels:16777216,failOn:"warning"}),m=await image.metadata();
  if(!["png","jpeg","webp"].includes(m.format??"")||!m.width||!m.height||m.width>4096||m.height>4096||(m.pages??1)!==1)throw Error("edit_format");
  if(v.operation==="remove_background"){if(!m.hasAlpha)throw Error("alpha_missing");const stats=await image.stats();if(stats.channels.length<4||stats.channels[3].min===255)throw Error("alpha_missing");}
  if(v.operation==="upscale"&&(m.width<=p.source.width||m.height<=p.source.height))throw Error("upscale_not_larger");
  if(v.operation==="outpaint"&&(m.width<=p.source.width||m.height<=p.source.height))throw Error("outpaint_not_expanded");
  const bytes=await image.png().toBuffer();
  return {state:"artifact_validated",bytes,receipt:{provider:"stability",model:p.route,providerRequestId:id,imageCount:1,sha256:createHash("sha256").update(bytes).digest("hex"),width:m.width,height:m.height,mime:"image/png",costState:"pending_reconciliation"}};
 }catch{return {state:"reconciliation_required",code:"edit_outcome_unconfirmed",providerRequestId:id};}
}
export function editReceiptModel(operation:EditOperation){return routes[operation];}
