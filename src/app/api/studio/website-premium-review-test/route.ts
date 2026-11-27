import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {prepareWebsiteRevisionContext,paidRevisionPrompt,proposePaidWebsiteRevision,applySavedPaidRevision} from "@/lib/website-paid-revision";
import {rejectSuspiciousText} from "@/lib/security";
import {websitePilotProviderKey,websitePilotCanary,websitePilotScope} from "@/lib/studio-agent/website-pilot-provider";
import {websiteCommercialAcceptanceBranch} from "@/lib/website-pilot-branches";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {websiteCreditDeliveryProof} from "@/lib/assistant-work/website-paid-delivery";
import {WebsiteDraftSave,readBoundedWebsiteJson} from "@/lib/website-production-draft";
import {WebsiteDesignSpec} from "@/lib/website-design-schema";
import {renderPremiumReview,savePremiumReview} from "@/lib/website-premium-review";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=60;
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
async function owned(request:Request){
 if(!websitePilotScope()||process.env.VERCEL_GIT_COMMIT_REF!==websiteCommercialAcceptanceBranch)throw Error("scope");
 const token=bearerTokenFromRequest(request);if(!token)throw Error("sign_in");
 const db=createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",process.env.STUDIO_AGENT_TEST_SERVICE_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const auth=await db.auth.getUser(token),actor=auth.data.user?.id;
 if(auth.error||!actor||!(auth.data.user?.email_confirmed_at||auth.data.user?.confirmed_at)||!websitePilotCanary(actor)||!rateLimit({key:"premium-review:"+actor,limit:90,windowMs:60000}).allowed)throw Error("scope");
 const p=await db.from("production_requests").select("id,user_id,production_type,status,reserved_credits,output_json,updated_at").eq("user_id",actor).eq("production_type","website").eq("request_metadata->>source","studio_premium_pilot_v1").maybeSingle();
 if(p.error||!p.data||p.data.output_json?.websiteAssistant?.phase!=="ready")throw Error("settled");
 const r=await db.from("website_credit_reservations").select("state,credits,plan_hash").eq("production_id",p.data.id).eq("user_id",actor).maybeSingle();
 if(r.error||!r.data||r.data.plan_hash!==p.data.output_json?.websiteAssistant?.planHash||!websiteCreditDeliveryProof(p.data,r.data))throw Error("settled");
 return {db,actor,row:p.data,output:p.data.output_json,version:Number(p.data.output_json.websiteDesignVersion??1)};
}
const revisionEnabled=()=>process.env.STUDIO_AGENT_WEBSITE_REVISION_ENABLED==="true"&&process.env.STUDIO_AGENT_REAL_AI_APPROVED==="true"&&process.env.STUDIO_AGENT_REAL_AI_ENABLED==="true"&&process.env.STUDIO_AGENT_PROVIDER_VERIFIED==="true"&&process.env.STUDIO_AGENT_ACCOUNTING_ENABLED==="true"&&process.env.STUDIO_AGENT_TEST_OFFLINE!=="true"&&Boolean(websitePilotProviderKey());
export async function GET(request:Request){try{const a=await owned(request);return out({ok:true,version:a.version,design:WebsiteDesignSpec.parse(a.output.plan.editableDesign),revisionAvailable:revisionEnabled()&&!a.output.websiteAIRevision,revisionProposal:a.output.websiteAIRevision?.state==="proposed"?a.output.websiteAIRevision.proposal:null});}catch{return out({ok:false,code:"review_unavailable"},403);}}
export async function POST(request:Request){try{const a=await owned(request);const operation=new URL(request.url).searchParams.get("operation");
 if(operation==="revision"||operation==="revision-preview")return await revision(a,request,operation);
 if(operation)return out({ok:false,code:"operation_unavailable"},400);
 const next=renderPremiumReview(a.output,await readBoundedWebsiteJson(request,50000));const css=next.files.find(f=>f.path==="styles.css")!.content;
 return out({ok:true,pages:next.files.filter(f=>f.path.endsWith(".html")).map(f=>({path:f.path,content:f.content.replace('<link rel="stylesheet" href="./styles.css">',()=>"<style>"+css+"</style>")}))});
 }catch{return out({ok:false,code:"preview_unavailable"},422);}}
export async function PUT(request:Request){try{const a=await owned(request),p=WebsiteDraftSave.parse(await readBoundedWebsiteJson(request,50000));
 if(p.version!==a.version)return out({ok:false,code:"version_conflict"},409);
 const now=new Date().toISOString(),next=savePremiumReview(a.output,p.design,now);
 if(Buffer.byteLength(JSON.stringify(next))>7000000)return out({ok:false,code:"project_size_limit"},413);
 const r=await a.db.from("production_requests").update({output_json:next,updated_at:now}).eq("id",a.row.id).eq("user_id",a.actor).eq("status","ready").eq("updated_at",a.row.updated_at).select("id").maybeSingle();
 if(r.error)return out({ok:false,code:"storage_unavailable"},503);if(!r.data)return out({ok:false,code:"version_conflict"},409);
 return out({ok:true,version:next.websiteDesignVersion});
 }catch{return out({ok:false,code:"save_unavailable"},422);}}

async function revision(a:Awaited<ReturnType<typeof owned>>,request:Request,operation:string){
 const schema=z.discriminatedUnion("action",[z.strictObject({action:z.literal("propose"),version:z.number().int().positive(),instruction:z.string().trim().min(3).max(1500),confirmIncludedRevision:z.literal(true)}),z.strictObject({action:z.literal("apply"),version:z.number().int().positive()})]);
 const p=operation==="revision-preview"?{...z.strictObject({version:z.number().int().positive()}).parse(await readBoundedWebsiteJson(request,1024)),action:"preview" as const}:schema.parse(await readBoundedWebsiteJson(request,6000));
 if(p.version!==a.version)return out({ok:false,code:"version_conflict"},409);
 const context=prepareWebsiteRevisionContext({siteId:a.row.id,version:a.version,design:WebsiteDesignSpec.parse(a.output.plan.editableDesign)});
 const persist=async(next:Record<string,unknown>,previousAt:string,now:string)=>{
  if(Buffer.byteLength(JSON.stringify(next))>7000000)return false;
  const r=await a.db.from("production_requests").update({output_json:next,updated_at:now}).eq("id",a.row.id).eq("user_id",a.actor).eq("status","ready").eq("updated_at",previousAt).select("id").maybeSingle();
  return !r.error&&Boolean(r.data);
 };
 if(p.action==="apply"||p.action==="preview"){
  const design=applySavedPaidRevision(context,a.output.websiteAIRevision);
  if(p.action==="preview"){const rendered=renderPremiumReview(a.output,design),css=rendered.files.find(f=>f.path==="styles.css")!.content;return out({ok:true,pages:rendered.files.filter(f=>f.path.endsWith(".html")).map(f=>({path:f.path,content:f.content.replace('<link rel="stylesheet" href="./styles.css">',()=>"<style>"+css+"</style>")}))});}
  const now=new Date().toISOString(),next=savePremiumReview(a.output,design,now);
  Object.assign(next,{websiteAIRevision:{...a.output.websiteAIRevision,state:"applied"}});
  return await persist(next,a.row.updated_at,now)?out({ok:true,version:next.websiteDesignVersion}):out({ok:false,code:"version_conflict"},409);
 }
 if(p.action!=="propose")return out({ok:false,code:"operation_unavailable"},400);
 if(!revisionEnabled()||a.output.websiteAIRevision)return out({ok:false,code:"revision_unavailable"},409);
 if(!rejectSuspiciousText([p.instruction]).ok)return out({ok:false,code:"invalid_instruction"},400);
 paidRevisionPrompt(context,p.instruction);
 const claimed={...a.output,websiteAIRevision:{state:"claimed",baseVersion:a.version,baseHash:context.baseHash}},at=new Date().toISOString();
 if(!await persist(claimed,a.row.updated_at,at))return out({ok:false,code:"revision_claim_unconfirmed"},409);
 try{
 const result=await proposePaidWebsiteRevision(context,p.instruction,websitePilotProviderKey());
 renderPremiumReview(a.output,result.design);
 const next={...claimed,websiteAIRevision:{state:"proposed",proposal:result.proposal,receipt:result.receipt}};
 if(!await persist(next,at,new Date().toISOString()))return out({ok:false,code:"revision_outcome_unconfirmed"},409);
 return out({ok:true,proposal:result.proposal,additionalCredits:0});
 }catch{return out({ok:false,code:"revision_outcome_unconfirmed"},409);}
}
