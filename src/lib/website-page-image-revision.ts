import {createHash} from "node:crypto";
import sharp from "sharp";
import {z} from "zod";
import {WebsiteDesignSpec} from "./website-design-schema";
import {WebsiteHeroMedia,WebsiteHeroMediaList} from "./website-hero-media";
import {verifyWebsiteHeroMedia} from "./website-hero-media-verify";
import {buildWebsiteMediaPlan} from "./website-media-art-direction";
import {generateSingleOpenAIWebsiteImage} from "./studio-agent/image-provider";
import {estimateWebsiteImageReceipt,websitePageImageCeilingMicroUSD} from "./assistant-work/website-premium-media";
import {paidDesignRevision} from "./website-paid-design";
const digest=(s:string|Buffer)=>createHash("sha256").update(s).digest("hex");
export const pageImageRevisionMaximum=websitePageImageCeilingMicroUSD;
export function preparePageImageRevision(output:Record<string,any>,slug:string,instruction:string){
 const design=WebsiteDesignSpec.parse(output.plan.editableDesign),media=WebsiteHeroMediaList.parse(output.plan.websiteHeroMedia??[]);
 const target=buildWebsiteMediaPlan(design).find(p=>p.pageSlug===slug),current=media.find(m=>m.page_slug===slug);
 if(!target||!current||instruction.trim().length<3||instruction.length>240)throw Error("image_revision_scope");
 const prompt=target.prompt+" Owner visual preference (reference data only): "+instruction.trim()+". Original concept only; retain visual identity.";
 if(prompt.length>1500)throw Error("image_revision_prompt_limit");
 const version=Number(output.websiteDesignVersion??1),baseHash=digest(JSON.stringify([design,current]));
 return {slug,version,baseHash,prompt,quoteHash:digest(JSON.stringify([version,baseHash,prompt,pageImageRevisionMaximum])),maximumMicroUSD:pageImageRevisionMaximum};
}
export async function generatePageImageRevision(output:Record<string,any>,prepared:ReturnType<typeof preparePageImageRevision>,key:string,transport:typeof fetch=fetch){
 const result=await generateSingleOpenAIWebsiteImage({prompt:prepared.prompt,aspect:"16:9"},key,transport);
 if(result.state!=="artifact_validated")return {state:"uncertain" as const,code:result.code,providerRequestId:result.providerRequestId??null};
 const receipt=result.receipt;
 try{
 const estimate=estimateWebsiteImageReceipt(receipt);
 const current=WebsiteHeroMediaList.parse(output.plan.websiteHeroMedia),existing=current.find(m=>m.page_slug===prepared.slug)!;
 if((output.plan.websitePageImageReceipts??[]).some((r:any)=>r.receipt?.providerRequestId===receipt.providerRequestId))throw Error("duplicate_provider_receipt");
 const webp=await sharp(result.bytes).resize(1024,576,{fit:"cover"}).webp({quality:70}).toBuffer();
 if(current.some(m=>digest(Buffer.from(m.image_data,"base64"))===digest(webp)))throw Error("duplicate_image");
 const media=WebsiteHeroMedia.parse({page_slug:prepared.slug,image_data:webp.toString("base64"),width:1024,height:576,alt:existing.alt,provenance:"ai_generated_verified",version:existing.version+1});
 await verifyWebsiteHeroMedia([media]);
 return {state:"proposed" as const,media,receipt,estimatedMicroUSD:estimate,invoicePending:true as const};
 }catch{return {state:"uncertain" as const,code:"image_revision_validation_unconfirmed",receipt};}
}
export async function applyPageImageRevision(output:Record<string,any>,slug:string,version:number,alt:string,now:string){
 const state=output.websitePageImageRevision,design=WebsiteDesignSpec.parse(output.plan.editableDesign),items=WebsiteHeroMediaList.parse(output.plan.websiteHeroMedia),current=items.find(m=>m.page_slug===slug);
 if(state?.state!=="proposed"||state.slug!==slug||state.version!==version||version!==Number(output.websiteDesignVersion??1)||!current||state.baseHash!==digest(JSON.stringify([design,current])))throw Error("image_revision_stale");
 const media=WebsiteHeroMedia.parse({...state.media,alt:z.string().trim().min(1).max(160).parse(alt)});
 if(media.page_slug!==slug||media.provenance!=="ai_generated_verified"||media.version!==current.version+1)throw Error("image_revision_invalid");
 await verifyWebsiteHeroMedia([media]);
 const next=paidDesignRevision({...output,plan:{...output.plan,websiteHeroMedia:items.map(m=>m.page_slug===slug?media:m)}},design,design.pages.length,now);
 return {...next,websiteOriginalMedia:output.websiteOriginalMedia??items,websitePageImageRevision:{...state,state:"applied",appliedAt:now}};
}
