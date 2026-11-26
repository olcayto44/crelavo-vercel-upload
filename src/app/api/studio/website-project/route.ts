import {z} from "zod";
import {parsePaidCMS,websitePaidCMSModules} from "@/lib/website-paid-cms";
import {buildWebsiteSelfHostedBundle} from "@/lib/website-selfhost-bundle";
import {paidRevisionPrompt,proposePaidWebsiteRevision,prepareWebsiteRevisionContext,applySavedPaidRevision} from "@/lib/website-paid-revision";
import {rejectSuspiciousText} from "@/lib/security";
import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {websiteCreditDeliveryProof} from "@/lib/assistant-work/website-paid-delivery";
import {productionWebsiteDraftScope,readBoundedWebsiteJson,WebsiteDraftSave} from "@/lib/website-production-draft";
import {WebsiteDesignSpec} from "@/lib/website-design-schema";
import {paidDesignHistory,paidDesignRevision,renderPaidWebsiteDesign} from "@/lib/website-paid-design";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
async function owned(request:Request){
 if(!productionWebsiteDraftScope())return {response:out({ok:false,code:"not_available"},503)} as const;
 const token=bearerTokenFromRequest(request);if(!token)return {response:out({ok:false,code:"sign_in"},401)} as const;
 const id=z.string().uuid().safeParse(new URL(request.url).searchParams.get("projectId"));if(!id.success)return {response:out({ok:false,code:"invalid_project"},400)} as const;
 const db=supabaseAdmin(),{data:auth,error:authError}=await db.auth.getUser(token);if(authError||!auth.user||!(auth.user.email_confirmed_at||auth.user.confirmed_at))return {response:out({ok:false,code:"sign_in"},401)} as const;
 const actor=auth.user.id;if(!rateLimit({key:"website-paid-design:"+actor,limit:90,windowMs:60000}).allowed)return {response:out({ok:false,code:"rate_limit"},429)} as const;
 const {data:row,error}=await db.from("production_requests").select("id,user_id,production_type,status,reserved_credits,output_json,updated_at").eq("id",id.data).eq("user_id",actor).eq("production_type","website").maybeSingle();
 if(error)return {response:out({ok:false,code:"storage_unavailable"},503)} as const;if(!row)return {response:out({ok:false,code:"project_not_found"},404)} as const;
 const {data:proof,error:proofError}=await db.from("website_credit_reservations").select("state,credits").eq("production_id",id.data).eq("user_id",actor).maybeSingle();
 if(proofError||!websiteCreditDeliveryProof(row,proof))return {response:out({ok:false,code:"paid_delivery_required"},409)} as const;
 const design=WebsiteDesignSpec.safeParse(row.output_json?.plan?.editableDesign);
 if(!design.success)return {response:out({ok:false,code:"visual_editor_unavailable"},409)} as const;
 const limit=row.output_json?.websiteAssistant?.packId==="landing_page"?1:5;
 return {db,row,actor,design:design.data,limit} as const;
}
type Owned=Exclude<Awaited<ReturnType<typeof owned>>,{response:Response}>;
function view(a:Owned){const output=a.row.output_json;return {ok:true,version:Number(output.websiteDesignVersion??1),design:a.design,history:paidDesignHistory(output).map(({version,createdAt})=>({version,createdAt})),pageLimit:a.limit,cms:output.websiteCMS??{articles:[],catalog:[]},cmsVersion:Number(output.websiteCMSVersion??0),cmsModules:websitePaidCMSModules(output.plan?.approvedIndustryScope??undefined),revisionAvailable:process.env.CRELAVO_WEBSITE_INCLUDED_AI_REVISION_ENABLED==="true"&&!output.websiteAIRevision,revisionProposal:output.websiteAIRevision?.state==="proposed"?output.websiteAIRevision.proposal:null};}
export async function GET(request:Request){try{const a=await owned(request);if("response" in a)return a.response;return out(view(a));}catch{return out({ok:false,code:"project_unavailable"},503);}}
async function save(a:Owned,version:number,design:unknown,revisionApplied=false){
 if(version!==Number(a.row.output_json.websiteDesignVersion??1))return out({ok:false,code:"version_conflict"},409);
 const parsed=WebsiteDesignSpec.parse(design);const now=new Date().toISOString(),next=paidDesignRevision(a.row.output_json,parsed,a.limit,now);
 if(revisionApplied)Object.assign(next,{websiteAIRevision:{...a.row.output_json.websiteAIRevision,state:"applied"}});
 if(Buffer.byteLength(JSON.stringify(next))>7000000)return out({ok:false,code:"project_size_limit"},413);
 const {data,error}=await a.db.from("production_requests").update({output_json:next,updated_at:now}).eq("id",a.row.id).eq("user_id",a.actor).eq("status","ready").eq("updated_at",a.row.updated_at).select("id").maybeSingle();
 if(error)return out({ok:false,code:"storage_unavailable"},503);if(!data)return out({ok:false,code:"version_conflict"},409);
 return out({ok:true,version:next.websiteDesignVersion,history:paidDesignHistory(next).map(({version,createdAt})=>({version,createdAt}))});
}
export async function PUT(request:Request){try{const a=await owned(request);if("response" in a)return a.response;const p=WebsiteDraftSave.parse(await readBoundedWebsiteJson(request,50000));return await save(a,p.version,p.design);}catch{return out({ok:false,code:"invalid_design"},422);}}
export async function PATCH(request:Request){try{const a=await owned(request);if("response" in a)return a.response;const p=z.strictObject({version:z.number().int().positive(),restoreVersion:z.number().int().positive()}).parse(await readBoundedWebsiteJson(request,1024));const old=paidDesignHistory(a.row.output_json).find(h=>h.version===p.restoreVersion);if(!old)return out({ok:false,code:"version_not_found"},404);return await save(a,p.version,old.design);}catch{return out({ok:false,code:"restore_unavailable"},422);}}
export async function POST(request:Request){try{const a=await owned(request);if("response" in a)return a.response;
 if(new URL(request.url).searchParams.has("format"))return out({ok:false,code:"use_saved_delivery"},403);
 const operation=new URL(request.url).searchParams.get("operation");
 if(operation==="cms"){
  const p=z.strictObject({version:z.number().int().nonnegative(),cms:z.unknown()}).parse(await readBoundedWebsiteJson(request,700000));
  const output=a.row.output_json,scope=output.plan?.approvedIndustryScope;
  if(!scope||a.row.output_json.websiteAssistant?.packId!=="website_basic_admin")return out({ok:false,code:"cms_package_required"},403);
  if(p.version!==Number(output.websiteCMSVersion??0))return out({ok:false,code:"version_conflict"},409);
  const cms=parsePaidCMS(p.cms,scope);
  buildWebsiteSelfHostedBundle({design:a.design,revision:Number(output.websiteDesignVersion??1),...cms,heroMedia:output.plan?.websiteHeroMedia??[]});
  const next={...output,websiteCMS:cms,websiteCMSVersion:p.version+1};
  const {data,error}=await a.db.from("production_requests").update({output_json:next,updated_at:new Date().toISOString()}).eq("id",a.row.id).eq("user_id",a.actor).eq("status","ready").eq("updated_at",a.row.updated_at).select("id").maybeSingle();
  return error?out({ok:false,code:"storage_unavailable"},503):!data?out({ok:false,code:"version_conflict"},409):out({ok:true,cms,cmsVersion:p.version+1});
 }
 if(operation==="revision"){
  const p=z.discriminatedUnion("action",[z.strictObject({action:z.literal("propose"),version:z.number().int().positive(),instruction:z.string().trim().min(3).max(1500),confirmIncludedRevision:z.literal(true)}),z.strictObject({action:z.literal("apply"),version:z.number().int().positive()})]).parse(await readBoundedWebsiteJson(request,6000));
  const output=a.row.output_json,version=Number(output.websiteDesignVersion??1);
  if(p.version!==version)return out({ok:false,code:"version_conflict"},409);
  const context=prepareWebsiteRevisionContext({siteId:a.row.id,version,design:a.design});
  if(p.action==="apply")return await save(a,version,applySavedPaidRevision(context,output.websiteAIRevision),true);
  if(process.env.CRELAVO_WEBSITE_INCLUDED_AI_REVISION_ENABLED!=="true"||!process.env.OPENAI_API_KEY?.trim())return out({ok:false,code:"revision_not_enabled"},503);
  if(output.websiteAIRevision)return out({ok:false,code:"included_revision_already_requested"},409);
  const safety=rejectSuspiciousText([p.instruction]);if(!safety.ok)return out({ok:false,code:"invalid_revision_instruction"},400);
  paidRevisionPrompt(context,p.instruction);
  // One included bounded proposal per settled paid project, no extra customer debit.
  // Claim durably before provider; no retry after a timeout or concurrent update.
  const claimed={...output,websiteAIRevision:{state:"claimed",baseVersion:version,baseHash:context.baseHash}},at=new Date().toISOString();
  const {data:claim,error:claimError}=await a.db.from("production_requests").update({output_json:claimed,updated_at:at}).eq("id",a.row.id).eq("user_id",a.actor).eq("status","ready").eq("updated_at",a.row.updated_at).select("id").maybeSingle();
  if(claimError||!claim)return out({ok:false,code:"revision_claim_unconfirmed"},409);
  try{
   const result=await proposePaidWebsiteRevision(context,p.instruction,process.env.OPENAI_API_KEY!);
   renderPaidWebsiteDesign(result.design,a.limit,output.plan?.websiteHeroMedia??[],output.plan?.approvedIndustryScope??undefined);
   const next={...claimed,websiteAIRevision:{state:"proposed",proposal:result.proposal,receipt:result.receipt}};
   const {data,error}=await a.db.from("production_requests").update({output_json:next,updated_at:new Date().toISOString()}).eq("id",a.row.id).eq("user_id",a.actor).eq("status","ready").eq("updated_at",at).select("id").maybeSingle();
   if(error||!data)return out({ok:false,code:"revision_outcome_unconfirmed"},409);
   return out({ok:true,proposal:result.proposal,design:result.design,additionalCredits:0});
  }catch{return out({ok:false,code:"revision_outcome_unconfirmed"},409);}
 }
 const rendered=renderPaidWebsiteDesign(await readBoundedWebsiteJson(request,48000),a.limit,a.row.output_json?.plan?.websiteHeroMedia??[],a.row.output_json?.plan?.approvedIndustryScope??undefined),css=rendered.files.find(f=>f.path==="styles.css")!.content;
 return out({ok:true,pages:rendered.files.filter(f=>f.path.endsWith(".html")).map(f=>({path:f.path,content:f.content.replace('<link rel="stylesheet" href="./styles.css">',()=>"<style>"+css+"</style>")}))});
 }catch{return out({ok:false,code:"invalid_design"},422);}}
