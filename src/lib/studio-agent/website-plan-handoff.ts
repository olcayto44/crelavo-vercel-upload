import {z} from "zod";
import {createHash} from "node:crypto";
import {normalizeAssistantWebsiteBrief,websitePlanHash,missingWebsiteBrief,unsupportedWebsiteScope,websiteEngineInput} from "../assistant-work/website-brief";
import {prepareEditableWebsiteBrief} from "./website-editable-artifact";
import {getCategory} from "@/lib/crelavo/categoryCatalog";
const uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const Row=z.object({id:uuid,user_id:uuid,category_id:z.literal("website"),revision:z.number().int().min(1),production_id:uuid.nullable(),brief:z.record(z.string(),z.unknown())});
const RequestSchema=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("list")}),
 z.strictObject({action:z.literal("quote"),projectId:uuid}),
 z.strictObject({action:z.literal("approve"),projectId:uuid,revision:z.number().int().min(1),quoteHash:hash,confirmPlan:z.literal(true)})
]);
export function prepareWebsiteHandoff(raw:unknown,actor:string){
 const row=Row.parse(raw);if(row.user_id!==actor)throw Error("project_not_found");
 const f=row.brief,s=(k:string)=>typeof f[k]==="string"?String(f[k]).trim():"";
 const type=s("site_type"),language=s("language");
 if(language!=="english"||!["landing_page","corporate_website","service_business_website","portfolio_website","blog"].includes(type))throw Error("supported_english_marketing_scope_required");
 if(s("reference_url")||Object.entries(f).some(([k,v])=>/reference|permission|rights/.test(k)&&(Array.isArray(v)?v.length>0:typeof v==="string"&&v.trim().length>0)))throw Error("reference_review_required");
 const rawBrief={brand:s("business_name"),brief:s("brief"),audience:s("audience"),siteType:type.replace(/_/g," "),style:s("design_style").replace(/_/g," "),pages:s("pages"),features:s("features_and_integrations"),locale:"en"};
 const brief=normalizeAssistantWebsiteBrief(rawBrief);
 if(missingWebsiteBrief(brief).length||unsupportedWebsiteScope(brief).length)throw Error("complete_supported_brief_required");
 // No silently dropped pages, unsupported integration, or reference inputs.
 if(brief.pages.length!==rawBrief.pages.split(/[,;\n]/).map(v=>v.trim()).filter(Boolean).length||brief.features.length!==rawBrief.features.split(/[,;\n]/).map(v=>v.trim()).filter(Boolean).length)throw Error("brief_limit");
 prepareEditableWebsiteBrief(websiteEngineInput(brief));
 const packId=type==="landing_page"?"landing_page":"business_website",credits=getCategory("website")?.packs.find(p=>p.id===packId)?.credits;
 if(credits!==(packId==="landing_page"?500:1500))throw Error("catalog_price_changed");
 const planHash=websitePlanHash(brief,packId),quoteHash=createHash("sha256").update(JSON.stringify(["website-ai-handoff-v1",actor,row.id,row.revision,planHash,credits])).digest("hex");
 return {row,brief,packId,credits,planHash,quoteHash};
}
type Deps={userId:string;canaryId:string;load:(id:string,user:string)=>Promise<unknown>;list:()=>Promise<unknown>;rpc:(args:Record<string,unknown>)=>Promise<{data:unknown,error:unknown}>};
export async function handleWebsiteHandoff(req:Request,d:Deps){
 const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
 const fail=(status:number,code:string)=>reply({ok:false,code,safeToRetryAutomatically:false},status);
 if(d.userId!==d.canaryId||!uuid.safeParse(d.userId).success)return fail(403,"website_ai_canary_required");
 try{
 const raw=await req.text();if(Buffer.byteLength(raw)>2048)return fail(413,"request_too_large");
 const p=RequestSchema.safeParse(JSON.parse(raw));if(!p.success)return fail(400,"invalid_request");
 if(p.data.action==="list")return reply({ok:true,projects:await d.list()});
 const input=p.data,source=await d.load(input.projectId,d.userId);
 if(!source)return fail(404,"project_not_found");
 let q;try{q=prepareWebsiteHandoff(source,d.userId);}catch{return fail(409,"complete_english_marketing_brief_without_references_required");}
 if(q.row.id!==input.projectId)return fail(404,"project_not_found");
 if(input.action==="quote")return reply({ok:true,projectId:q.row.id,revision:q.row.revision,brief:q.brief,packId:q.packId,credits:q.credits,quoteHash:q.quoteHash,productionId:q.row.production_id,scope:"marketing_candidate_only",chargedCredits:0});
 if(input.revision!==q.row.revision||input.quoteHash!==q.quoteHash)return fail(409,"plan_changed_reload");
 const result=await d.rpc({p_user:d.userId,p_project:q.row.id,p_revision:q.row.revision,p_snapshot:q.row.brief,p_brief:q.brief,p_hash:q.planHash,p_pack:q.packId,p_credits:q.credits});
 if(result.error)return fail(503,"handoff_unconfirmed_reload");
 const v=z.object({state:z.enum(["approved","already_bound"]),productionId:uuid}).safeParse(result.data);
 if(!v.success)return fail(409,"handoff_not_available");
 return reply({ok:true,...v.data,chargedCredits:0,productionStarted:false});
 }catch{return fail(503,"handoff_unavailable");}
}
