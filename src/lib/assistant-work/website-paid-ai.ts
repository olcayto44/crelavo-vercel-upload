import {generateWebsiteArtifact,websitePageManifest,type WebsiteEngineInput} from "../website-engine";
import {generateWebsiteAICopy,prepareWebsiteAICopy} from "../studio-agent/website-ai-copy";
import {buildEditableWebsiteFromCopy,prepareEditableWebsiteBrief} from "../studio-agent/website-editable-artifact";
import {renderWebsiteDesignCandidate} from "../website-design-candidate";
import {requireWebsiteArtifact} from "../website-artifact-acceptance";
import type {CostPolicy} from "../studio-agent/cost-policy";
// Reuse the existing production OpenAI credential and the verified Website
// policy. No payment-provider dependency and no local-template fallback.
export const paidWebsitePolicy:CostPolicy={version:"website-paid-v1",model:"gpt-6.1-terra",inputLimit:12000,outputLimit:1200,requestMicroUSD:50000,totalMicroUSD:250000,userRPM:1,systemRPM:2,inputRate:3000000,outputRate:5000000};
export function preparePaidWebsiteAI(input:WebsiteEngineInput,env:NodeJS.ProcessEnv=process.env){
 if(!env.OPENAI_API_KEY?.trim())throw Error("website_ai_provider_unavailable");
 prepareWebsiteAICopy(input,paidWebsitePolicy);
 prepareEditableWebsiteBrief(input);
 // Every paid non-home page must be generated, not a generic example.
 if(websitePageManifest(input.pages).length>3)throw Error("website_ai_maximum_three_pages");
}
export async function generatePaidWebsiteArtifact(input:WebsiteEngineInput,id:string){
 preparePaidWebsiteAI(input);
 const result=await generateWebsiteAICopy(input,{enabled:()=>Boolean(process.env.OPENAI_API_KEY?.trim()),apiKey:process.env.OPENAI_API_KEY!,policy:paidWebsitePolicy});
 if(result.state!=="validated")throw Error("website_ai_output_unconfirmed");
 const required=websitePageManifest(input.pages).slice(1);
 if(required.some(p=>!result.copy.secondaryPages?.some(s=>s.pageTitle===p.title)))throw Error("website_ai_required_page_missing");
 const artifact=await generateWebsiteArtifact(input,id,{mode:"validated_copy",copy:result.copy});
 const design=buildEditableWebsiteFromCopy(input,result.copy);
 const rendered=renderWebsiteDesignCandidate(design);
 const acceptance=requireWebsiteArtifact(rendered.files.map(f=>({name:f.path,content:f.content})),{root:"",requiredPages:rendered.manifest.pages.map(p=>p.path),language:design.language});
 if(acceptance.warnings.length)throw Error("website_ai_incomplete_content");
 // The same design becomes the source for the project editor and delivery.
 const files=[...rendered.files,{path:"README.md",contentType:"text/markdown",content:"# "+design.brand+"\n\nStatic website. Review business facts, configure the destination hosting and contact service before publication.\n"}];
 return {...artifact,files,plan:{...artifact.plan,status:"approved" as const,editableDesign:design,editableDesignHash:rendered.manifest.designHash,websiteAIReceipt:result.receipt},websiteContent:{...artifact.websiteContent,heroTitle:design.pages[0].headline,heroBody:design.pages[0].lead}};
}
