import {z} from "zod";
import {WebsiteHeroMediaList} from "./website-hero-media";
import {renderWebsiteDesignCandidate} from "./website-design-candidate";
import {buildWebsiteSelfHostedBundle} from "./website-selfhost-bundle";
import {websiteCreditDeliveryProof} from "./assistant-work/website-paid-delivery";
const id=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const Rows=z.array(z.object({productionId:id,designHash:hash,design:z.unknown(),heroMedia:WebsiteHeroMediaList.optional(),revision:z.number().int().positive().optional()})).length(1);
// Input must originate from the authenticated owner-only settled-artifact RPC.
// No arbitrary caller payload is proof of settlement.
export function buildSettledWebsiteCandidate(raw:unknown,productionId:string){
 const [row]=Rows.parse(raw);
 if(row.productionId!==productionId)throw Error("production_mismatch");
 const rendered=renderWebsiteDesignCandidate(row.design,row.heroMedia??[]);
 if(rendered.manifest.designHash!==row.designHash)throw Error("design_hash_mismatch");
 return buildWebsiteSelfHostedBundle({design:row.design,revision:row.revision??1,catalog:[],articles:[],heroMedia:row.heroMedia??[]});
}

const DirectJob=z.object({production_id:id,user_id:id,plan_hash:hash,state:z.literal("settled"),credits:z.number().int().positive(),maximum_micro_usd:z.number().int().positive(),receipt:z.object({requestId:z.string().min(1),estimatedMicroUSD:z.number().int().positive().optional()}),reviewed_cost:z.discriminatedUnion("source",[z.object({source:z.literal("reviewed_provider_usage"),requestId:z.string().min(1),actualMicroUSD:z.number().int().positive()}),z.object({source:z.literal("metered_policy_estimate"),requestId:z.string().min(1),estimatedMicroUSD:z.number().int().positive(),invoicePending:z.literal(true)})]),artifact:z.object({editableDesign:z.unknown(),editableDesignHash:hash})});
const DirectProject=z.object({id,user_id:id,production_type:z.literal("website"),status:z.literal("ready"),reserved_credits:z.literal(0),output_json:z.object({websiteBillingMode:z.literal("atomic_v1"),websiteBillingPending:z.literal(false),charged:z.number().int().positive(),websiteAssistant:z.object({approvedHash:hash})})});
const DirectReservation=z.object({production_id:id,user_id:id,plan_hash:hash,state:z.literal("settled"),credits:z.number().int().positive()});
// All three inputs must come from trusted server queries scoped to the verified owner.
// This is a read-only delivery path; it cannot finalize or reserve any credits.
export function directSettledWebsiteRows(actor:string,productionId:string,job:unknown,project:unknown,reservation:unknown){
 const j=DirectJob.parse(job),p=DirectProject.parse(project),r=DirectReservation.parse(reservation);
 if([j.user_id,p.user_id,r.user_id].some(v=>v!==actor)||[j.production_id,p.id,r.production_id].some(v=>v!==productionId)||r.plan_hash!==j.plan_hash||p.output_json.websiteAssistant.approvedHash!==j.plan_hash||r.credits!==j.credits||!websiteCreditDeliveryProof(p,r)||j.reviewed_cost.requestId!==j.receipt.requestId||(j.reviewed_cost.source==="reviewed_provider_usage"?j.reviewed_cost.actualMicroUSD>j.maximum_micro_usd:j.reviewed_cost.estimatedMicroUSD>j.maximum_micro_usd||j.reviewed_cost.estimatedMicroUSD!==j.receipt.estimatedMicroUSD))throw Error("settled_delivery_denied");
 return [{productionId,designHash:j.artifact.editableDesignHash,design:j.artifact.editableDesign}];
}
export function buildSettledWebsitePreview(raw:unknown,productionId:string){
 const [row]=Rows.parse(raw);
 if(row.productionId!==productionId)throw Error("production_mismatch");
 const rendered=renderWebsiteDesignCandidate(row.design,row.heroMedia??[]);
 if(rendered.manifest.designHash!==row.designHash)throw Error("design_hash_mismatch");
 const css=rendered.files.find(f=>f.path==="styles.css")?.content;
 if(!css||/<\/style/i.test(css))throw Error("preview_css_invalid");
 const csp='<meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;; img-src data:; base-uri &apos;none&apos;; form-action &apos;none&apos;">';
 const pages=rendered.files.filter(f=>f.contentType==="text/html").map(f=>({path:f.path,title:rendered.manifest.pages.find(p=>p.path===f.path)?.title??f.path,html:f.content.replace("<head>","<head>"+csp).replace('<link rel="stylesheet" href="./styles.css">',"<style>"+css+"</style>").replace(/href="(?!#)[^"]*"/g,'href="#"')}));
 if(!pages.length||pages.length>12)throw Error("preview_pages_invalid");
 return {pages,designHash:row.designHash,releaseReady:false};
}
