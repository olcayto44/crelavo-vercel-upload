import {generateWebsiteArtifact,websitePageManifest,type WebsiteEngineInput} from "../website-engine";
import {generateWebsiteAICopy,prepareWebsiteAICopy,type WebsiteAICopy} from "../studio-agent/website-ai-copy";
import {buildEditableWebsiteFromCopy,prepareEditableWebsiteBrief} from "../studio-agent/website-editable-artifact";
import {paidWebsiteScope} from "../website-paid-scope";
import {buildWebsiteSelfHostedBundle} from "../website-selfhost-bundle";
import {renderPaidWebsiteDesign} from "../website-paid-design";
import {generateSingleOpenAIWebsiteImage} from "../studio-agent/image-provider";
import type {WebsiteHeroMediaInput} from "../website-hero-media";
import type {CostPolicy} from "../studio-agent/cost-policy";
const sharp:typeof import("sharp").default=require("sharp");
export const paidWebsitePolicy:CostPolicy={version:"website-paid-v2",model:"gpt-6.1-terra",inputLimit:12000,outputLimit:1200,requestMicroUSD:50000,totalMicroUSD:250000,userRPM:1,systemRPM:2,inputRate:3000000,outputRate:5000000};
const wantsHero=(input:WebsiteEngineInput)=>input.features.some(f=>/^ai hero image$/i.test(f.trim()));
export function websitePaidBatches(input:WebsiteEngineInput){
 const manifest=websitePageManifest(input.pages);if(manifest.length>5)throw Error("website_ai_maximum_five_pages");
 const secondary=manifest.slice(1).map(p=>p.title),batches:WebsiteEngineInput[]=[];
 for(let i=0;i<Math.max(1,secondary.length);i+=2)batches.push({...input,pages:[manifest[0].title,...secondary.slice(i,i+2)]});
 return batches;
}
export function preparePaidWebsiteAI(input:WebsiteEngineInput,env:NodeJS.ProcessEnv=process.env,packId="business_website"){
 if(packId==="website_basic_admin"&&env.CRELAVO_WEBSITE_ADMIN_PACKAGE_ENABLED!=="true")throw Error("website_admin_package_not_enabled");
 if(!env.OPENAI_API_KEY?.trim())throw Error("website_ai_provider_unavailable");
 if(wantsHero(input)&&env.CRELAVO_WEBSITE_AI_HERO_ENABLED!=="true")throw Error("website_ai_image_not_enabled");
 prepareEditableWebsiteBrief(input,true);
 const cost=websitePaidBatches(input).reduce((sum,b)=>sum+prepareWebsiteAICopy(b,paidWebsitePolicy,true).maxCost,0);
 if(cost>paidWebsitePolicy.totalMicroUSD)throw Error("website_ai_total_budget_exceeded");
}
export async function generatePaidWebsiteArtifact(input:WebsiteEngineInput,id:string,packId="business_website"){
 preparePaidWebsiteAI(input,process.env,packId);
 const batches=websitePaidBatches(input),results=[];
 for(const batch of batches){
  const result=await generateWebsiteAICopy(batch,{enabled:()=>Boolean(process.env.OPENAI_API_KEY?.trim()),apiKey:process.env.OPENAI_API_KEY!,policy:paidWebsitePolicy,customer:true});
  if(result.state!=="validated")throw Error("website_ai_output_unconfirmed");
  if(websitePageManifest(batch.pages).slice(1).some(p=>!result.copy.secondaryPages?.some(s=>s.pageTitle===p.title)))throw Error("website_ai_required_page_missing");
  results.push(result);
 }
 const first=results[0]!,copy:WebsiteAICopy=first.copy,secondary=results.flatMap(r=>r.copy.secondaryPages??[]);
 const artifact=await generateWebsiteArtifact(input,id,{mode:"validated_copy",copy});
 const base=buildEditableWebsiteFromCopy(input,copy,true,secondary),scope=paidWebsiteScope(packId,input.features);
 const design=scope?{...base,industryScope:scope}:base;
 const media:WebsiteHeroMediaInput[]=[];let imageReceipt:unknown=null;
 if(wantsHero(input)){
  const prompt=("Original professional website hero photograph for "+input.brand+". "+(copy.artDirection?.heroImageBrief??input.style)+". No logos, readable text, celebrities or claims.").slice(0,1200);
  const image=await generateSingleOpenAIWebsiteImage({prompt,aspect:"16:9"},process.env.OPENAI_API_KEY!);
  if(image.state!=="artifact_validated")throw Error("website_ai_image_unconfirmed");
  const webp=await sharp(image.bytes).resize(1024,576,{fit:"fill"}).webp({quality:70}).toBuffer();
  if(webp.toString("base64").length>180000)throw Error("website_ai_image_size");
  media.push({page_slug:"home",image_data:webp.toString("base64"),alt:input.brand.slice(0,120)+" — website visual",width:1024,height:576,version:1,provenance:"ai_generated_verified"});imageReceipt=image.receipt;
 }
 const rendered=renderPaidWebsiteDesign(design,5,media,scope);
 if(scope)buildWebsiteSelfHostedBundle({design,revision:1,catalog:[],articles:[],heroMedia:media});
 return {...artifact,files:rendered.files,pageManifest:rendered.pageManifest,plan:{...artifact.plan,status:"approved" as const,editableDesign:design,editableDesignHash:rendered.hash,websiteAIReceipt:first.receipt,websiteAIReceipts:results.map(r=>r.receipt),websiteHeroMedia:media,websiteImageReceipt:imageReceipt,approvedIndustryScope:scope??null},websiteContent:{siteTitle:design.brand,heroTitle:design.pages[0].headline,heroBody:design.pages[0].lead}};
}
