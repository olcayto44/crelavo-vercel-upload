import {z} from "zod";
import {createHash} from "node:crypto";
import {getCategory,CATEGORIES} from "../crelavo/categoryCatalog";
import {ImageRequestSchema} from "./image-provider";
import {EditOperation,EditSource,EditInput} from "./stage-image-edit";
export const IMAGE_STAGE_CATEGORIES=["image","brand_kit","visual_clone","virtual_model_studio"] as const;
export const activeStageCategories=CATEGORIES.map(c=>c.id);
export const StageCategory=z.enum(IMAGE_STAGE_CATEGORIES);
const uuid=z.string().uuid();
export const StageDraft=z.strictObject({jobId:uuid,category:StageCategory,title:z.string().trim().min(1).max(160),brief:z.string().trim().min(3).max(1000),aspect:ImageRequestSchema.shape.aspect,count:z.number().int().min(1).max(4),autoResume:z.boolean(),referenceJpeg:z.string().max(40000).regex(/^[A-Za-z0-9+/]+={0,2}$/).optional(),referenceConsent:z.literal(true).optional(),operation:EditOperation.optional(),source:EditSource.optional(),mask:z.string().max(40000).optional(),search:z.string().max(160).optional(),expand:z.number().int().min(32).max(256).optional()}).superRefine((v,ctx)=>{if((v.referenceJpeg||v.source)&&!v.referenceConsent||v.category==="visual_clone"&&!v.referenceJpeg&&!v.source)ctx.addIssue({code:"custom",message:"authorized_character_reference_required"});if(v.operation&&(v.count!==1||!EditInput.safeParse({operation:v.operation,prompt:v.brief,source:v.source,referenceJpeg:v.referenceJpeg,mask:v.mask,search:v.search,expand:v.expand}).success))ctx.addIssue({code:"custom",message:"invalid_edit_plan"});if(!v.operation&&v.source)ctx.addIssue({code:"custom",message:"source_requires_edit"});});
export type StageDraftInput=z.input<typeof StageDraft>;
export const StageImageInput=ImageRequestSchema.extend({referenceJpeg:z.string().max(40000).optional(),referenceFromFirst:z.boolean().optional(),imageProvider:z.enum(["minimax","stability"]).optional()});
export type StageImageInput=z.infer<typeof StageImageInput>;
export const StageTariff=z.strictObject({version:z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),credits:z.number().int().min(1).max(10000),maxMicroUSD:z.number().int().min(1).max(1000000),editCredits:z.number().int().min(1).max(10000).optional(),editMaxMicroUSD:z.number().int().min(1).max(1000000).optional()});
export type StageTariff=z.infer<typeof StageTariff>;
export const stageLabels={image:"AI image variations",brand_kit:"AI visual identity concepts + editable wordmark, palette, card and social templates",visual_clone:"Authorized character-reference variations",virtual_model_studio:"Virtual model photo concepts"} as const;
const directions=["Primary composition","Alternative composition and camera angle","Alternative lighting and environment","Final editorial variation"];
export function buildImageStagePlan(raw:unknown,tariff:StageTariff,imageProvider:"minimax"|"stability"="minimax"){
 const v=StageDraft.parse(raw),t=StageTariff.parse(tariff);if(!getCategory(v.category))throw Error("category_unavailable");
 if(v.operation){
  if(!t.editCredits||!t.editMaxMicroUSD)throw Error("edit_tariff_unavailable");
  const input=EditInput.parse({operation:v.operation,prompt:v.brief,source:v.source,referenceJpeg:v.referenceJpeg,mask:v.mask,search:v.search,expand:v.expand});
  const plan={version:"stage-edit-v1",jobId:v.jobId,category:v.category,title:v.title,autoResume:v.autoResume,tariffVersion:t.version,provider:"stability",model:v.operation,maximumProviderMicroUSD:t.editMaxMicroUSD,steps:[{operation:"image_edit",credits:t.editCredits,input}],totalCredits:t.editCredits};
  return {...plan,planHash:createHash("sha256").update(JSON.stringify(plan)).digest("hex")};
 }
 if(imageProvider==="stability"&&(v.category==="visual_clone"||v.referenceJpeg||v.category==="virtual_model_studio"&&v.count>1))throw Error("character_reference_provider_required");
 const prefix=v.category==="brand_kit"?"Original visual identity concept and raster logo exploration. No trademark imitation. ":v.category==="visual_clone"?"Use the authorized character reference as identity guidance. ":v.category==="virtual_model_studio"?"Professional editorial photography of a fictional adult virtual model. Maintain the same character in subsequent shots. ":"Professional original visual composition. ";
 const steps=Array.from({length:v.count},(_,i)=>({operation:"image_generate",credits:t.credits,input:StageImageInput.parse({prompt:(prefix+v.brief+" "+directions[i]+".").slice(0,1500),aspect:v.aspect,imageProvider,...(v.referenceJpeg?{referenceJpeg:v.referenceJpeg}:{}),...(v.category==="virtual_model_studio"&&i>0?{referenceFromFirst:true}:{} )})}));
 const plan={version:"stage-image-v1",jobId:v.jobId,category:v.category,title:v.title,autoResume:v.autoResume,tariffVersion:t.version,provider:imageProvider,model:imageProvider==="stability"?"core":"image-01",maximumProviderMicroUSD:t.maxMicroUSD*v.count,steps,totalCredits:t.credits*v.count};
 return {...plan,planHash:createHash("sha256").update(JSON.stringify(plan)).digest("hex")};
}
export function stageCreditNotice(available:number,nextCost:number,remaining:number,state:string,inFlight=0){
 const a=Math.max(0,available),need=Math.max(0,nextCost),total=Math.max(0,remaining),held=Math.max(0,inFlight),unreserved=Math.max(0,total-held);
 const active=["queued","running","paused_credits"].includes(state)&&total>0;
 const shortfall=Math.max(0,need-a);
 return {available:a,nextCost:need,remaining:total,held,shortfall,projectShortfall:Math.max(0,unreserved-a),level:active&&state==="paused_credits"?"paused":active&&a<Math.max(need,Math.ceil(unreserved*.2))?"low":"none",topUpUrl:"/dashboard/payment"};
}
