import {createHash} from "node:crypto";
import type {WebsiteMediaJournal} from "./website-media-journal";
import {buildWebsiteMediaPlan} from "../website-media-art-direction";
import {WebsiteDesignSpec,type WebsiteDesignSpecInput} from "../website-design-schema";
import {WebsiteHeroMediaList,type WebsiteHeroMediaInput} from "../website-hero-media";
import {generateSingleOpenAIWebsiteImage,type ImageReceipt} from "../studio-agent/image-provider";
const sharp:typeof import("sharp").default=require("sharp");
// Candidate for the already-approved Website package. This uses the reviewed
// isolated route's conservative estimate, not an invoice or a new credit charge.
// Public activation additionally requires durable per-page provider reconciliation.
export const websitePageImageCeilingMicroUSD=40000;
export function websitePremiumImagePlan(raw:unknown,maximumPages=5){
 const design=WebsiteDesignSpec.parse(raw);
 const targets=buildWebsiteMediaPlan(design);
 if(!targets.length||targets.length>maximumPages||targets.length>5)throw Error("website_page_image_scope");
 return {version:"website-page-media-v1",targets,maximumMicroUSD:targets.length*websitePageImageCeilingMicroUSD};
}
export function estimateWebsiteImageReceipt(r:ImageReceipt){
 const t=r.usage?.textTokens,o=r.usage?.outputTokens;
 if(r.provider!=="openai"||r.model!=="gpt-image-2.6-flare"||r.imageCount!==1||r.width!==1280||r.height!==720||r.mime!=="image/png"||!Number.isSafeInteger(t)||!Number.isSafeInteger(o)||t!<0||o!<=0||t!>100000||o!>100000)throw Error("website_page_image_receipt_invalid");
 const cost=t!*5+o!*30;
 if(cost<=0||cost>websitePageImageCeilingMicroUSD)throw Error("website_page_image_budget_exceeded");
 return cost;
}
const labels={en:"AI-generated concept image for",tr:"Şu sayfa için yapay zekâ konsept görseli:",de:"KI-Konzeptbild für",fr:"Image conceptuelle générée par IA pour","zh-Hans":"AI 概念图："} as const;
/** No implicit retries or provider switching. A failed member blocks full package delivery.
 * The receipt is an estimate pending invoice reconciliation, never an actual invoice.
 * Call only inside the explicitly approved, bounded production coordinator. */
export async function generatePremiumWebsiteMedia(raw:WebsiteDesignSpecInput,apiKey:string,context:string,transport:typeof fetch=fetch,journal?:WebsiteMediaJournal){
 const design=WebsiteDesignSpec.parse(raw),plan=websitePremiumImagePlan(design);
 if(!apiKey.trim())throw Error("website_page_image_key");
 if(!journal)throw Error("website_media_journal_required");
 const deadline=AbortSignal.timeout(50000);
 const boundedTransport:typeof fetch=(url,init)=>transport(url,{...init,signal:init?.signal?AbortSignal.any([deadline,init.signal]):deadline});
 const results=await Promise.allSettled(plan.targets.map(async target=>{
  const prompt=[target.prompt,"Business brief (reference only): "+context.slice(0,230),"Use a distinct composition for "+target.pageLabel+". Concept illustration only; no fabricated project or claims."].join(" ");
  if(prompt.length>1500)throw Error("website_page_image_prompt_limit");
  await journal(target.pageSlug,"start",{promptHash:createHash("sha256").update(prompt).digest("hex")});
  let observed:Record<string,unknown>={code:"provider_outcome_unconfirmed"};
  try{
  const result=await generateSingleOpenAIWebsiteImage({prompt,aspect:target.aspect},apiKey,boundedTransport);
  if(result.state!=="artifact_validated"){observed={code:result.code,providerRequestId:result.providerRequestId??null};throw Error("website_page_image_unconfirmed");}
  observed={code:"post_provider_validation_unconfirmed",receipt:result.receipt};
  const estimatedMicroUSD=estimateWebsiteImageReceipt(result.receipt);
  const webp=await sharp(result.bytes).resize(1024,576,{fit:"cover"}).webp({quality:70}).toBuffer();
  const image_data=webp.toString("base64");
  if(image_data.length>180000)throw Error("website_page_image_size");
  const media:WebsiteHeroMediaInput={page_slug:target.pageSlug,image_data,alt:(labels[design.language]+" "+target.pageLabel).slice(0,160),width:1024,height:576,version:1,provenance:"ai_generated_verified"};
  const evidence={media,receipt:result.receipt,estimatedMicroUSD,webpHash:createHash("sha256").update(webp).digest("hex")};
  await journal(target.pageSlug,"validated",evidence);
  return evidence;
  }catch(error){try{await journal(target.pageSlug,"uncertain",observed);}catch{/* preserve dispatch claim; never redispatch */}throw error;}
 }));
 if(results.some(r=>r.status!=="fulfilled"))throw Error("website_page_image_batch_reconciliation_required");
 const complete=results.map(r=>{if(r.status!=="fulfilled")throw Error("website_page_image_batch_reconciliation_required");return r.value;});
 if(new Set(complete.map(r=>r.receipt.providerRequestId)).size!==complete.length||new Set(complete.map(r=>r.webpHash)).size!==complete.length)throw Error("website_page_image_duplicate");
 const media=WebsiteHeroMediaList.parse(complete.map(r=>r.media));
 if(media.length!==plan.targets.length||plan.targets.some(t=>!media.some(m=>m.page_slug===t.pageSlug)))throw Error("website_page_image_coverage");
 return {media,receipts:complete.map(r=>({pageSlug:r.media.page_slug,receipt:r.receipt,estimatedMicroUSD:r.estimatedMicroUSD,invoicePending:true as const})),estimatedMicroUSD:complete.reduce((n,r)=>n+r.estimatedMicroUSD,0),maximumMicroUSD:plan.maximumMicroUSD,invoicePending:true as const};
}
