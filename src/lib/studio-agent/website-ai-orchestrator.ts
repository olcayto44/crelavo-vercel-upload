import {z} from "zod";
import {createHash} from "node:crypto";
import {normalizeAssistantWebsiteBrief,websitePlanHash,websiteEngineInput,missingWebsiteBrief,unsupportedWebsiteScope} from "../assistant-work/website-brief";
import {getCategory} from "@/lib/crelavo/categoryCatalog";
import {generateWebsiteArtifact} from "../website-engine";
import {generateWebsiteAICopy,WebsiteAICopySchema,prepareWebsiteAICopy} from "./website-ai-copy";
import {prepareEditableWebsiteBrief,buildEditableWebsiteFromCopy} from "./website-editable-artifact";
import {requireWebsiteArtifact} from "../website-artifact-acceptance";
import {renderWebsiteDesignCandidate} from "../website-design-candidate";
import type {readCostPolicy} from "./cost-policy";
const hash=z.string().regex(/^[a-f0-9]{64}$/);
const Approval=z.strictObject({userId:z.string().uuid(),productionId:z.string().uuid(),planHash:hash,packId:z.enum(["landing_page","business_website"]),credits:z.number().int().positive(),policyVersion:z.string(),policyHash:hash,maximumMicroUSD:z.number().int().min(1).max(50000),source:z.literal("persisted_explicit_user_approval"),brief:z.record(z.string(),z.unknown())});
type Policy=ReturnType<typeof readCostPolicy>;
export function websiteAIPolicyDigest(p:Policy){return createHash("sha256").update(JSON.stringify([p.version,p.model,p.inputLimit,p.outputLimit,p.requestMicroUSD,p.totalMicroUSD,p.userRPM,p.systemRPM,p.inputRate,p.outputRate])).digest("hex");}
type RPC=(name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:unknown}>;
type D={enabled:()=>boolean;policy:Policy;apiKey:string;rpc:RPC;transport?:typeof fetch};
// Internal isolated runner. No HTTP route or production activation. Caller's
// approved record must be read from trusted storage; SQL rechecks its tuple.
export async function runIsolatedWebsiteAI(raw:unknown,actor:string,d:D){
 const result=(state:string)=>({state,safeToRetryAutomatically:false});
 if(!d.enabled()||!d.apiKey.trim())return result("not_dispatched");
 const parsed=Approval.safeParse(raw);if(!parsed.success)return result("not_dispatched");
 const a=parsed.data,p=d.policy,brief=normalizeAssistantWebsiteBrief(a.brief);
 if(a.userId!==actor||a.policyHash!==websiteAIPolicyDigest(p)||a.policyVersion!==p.version||a.maximumMicroUSD!==p.requestMicroUSD||brief.locale!=="en"||websitePlanHash(brief,a.packId)!==a.planHash||missingWebsiteBrief(brief).length||unsupportedWebsiteScope(brief).length||getCategory("website")?.packs.find(x=>x.id===a.packId)?.credits!==a.credits)return result("not_dispatched");
 try{prepareWebsiteAICopy(websiteEngineInput(brief),p);prepareEditableWebsiteBrief(websiteEngineInput(brief));}catch{return result("not_dispatched");}
 const identity={p_user:a.userId,p_production:a.productionId,p_hash:a.planHash};
 const call=async(name:string,args:Record<string,unknown>)=>{const r=await d.rpc(name,args);if(r.error)throw Error("storage_unconfirmed");return r.data;};
 try{
 const claim=await call("website_ai_claim",{...identity,p_policy_version:a.policyVersion,p_policy_hash:a.policyHash,p_credits:a.credits,p_maximum:a.maximumMicroUSD});
 if(claim==="already_claimed")return result("already_claimed");
 if(claim!=="claimed")return result("not_dispatched");
 }catch{return result("reconciliation_required");}
 try{
 const generated=await generateWebsiteAICopy(websiteEngineInput(brief),{enabled:d.enabled,apiKey:d.apiKey,policy:p,transport:d.transport});
 if(generated.state!=="validated")throw Error("provider_uncertain");
 const copy=WebsiteAICopySchema.parse(generated.copy);
 const artifact=await generateWebsiteArtifact(websiteEngineInput(brief),a.productionId,{mode:"validated_copy",copy});
 const editableDesign=buildEditableWebsiteFromCopy(websiteEngineInput(brief),copy);
 const editableCandidate=renderWebsiteDesignCandidate(editableDesign);
 const editableAcceptance=requireWebsiteArtifact(editableCandidate.files.map(f=>({name:f.path,content:f.content})),{root:"",requiredPages:editableCandidate.manifest.pages.map(p=>p.path),language:editableDesign.language});
 const saved=await call("website_ai_record",{...identity,p_receipt:generated.receipt,p_artifact:{files:artifact.files,websiteContent:artifact.websiteContent,pageManifest:artifact.pageManifest,editableDesign,editableDesignHash:editableCandidate.manifest.designHash,editableAcceptance,artDirection:copy.artDirection??null,aiSecondaryPages:copy.secondaryPages?.map(p=>p.pageTitle)??[]}});
 if(saved!==true)throw Error("record_uncertain");
 return result("artifact_cost_pending");
 }catch{
 try{await call("website_ai_uncertain",identity);}catch{/* never release or retry on uncertainty */}
 return result("reconciliation_required");
 }
}
