import {z} from "zod";
import {getCategory} from "@/lib/crelavo/categoryCatalog";
import {requireVerifiedRequestUser,supabaseAdmin} from "@/lib/supabase";
import {clientIpFromRequest,rateLimit,rateLimitResponse,rejectSuspiciousText} from "@/lib/security";
import {validateProductionSafety} from "@/lib/content-safety";
import {normalizeAssistantWebsiteBrief,missingWebsiteBrief,unsupportedWebsiteScope,websitePlanHash} from "@/lib/assistant-work/website-brief";
import {websitePageManifest} from "@/lib/website-engine";
import {executePaidWebsiteProduction,websitePaidProductionEnabled,websitePaidCanaryAllowed} from "@/lib/assistant-work/website-paid-production";
import {productionCreditCheck} from "@/lib/studio-agent/production-credit-policy";
import {readBoundedWebsiteJson} from "@/lib/website-production-draft";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=120;
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
const uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
export async function POST(request:Request){
 try{
 const body=await readBoundedWebsiteJson(request,50000);
 if(!body||typeof body!=="object"||Array.isArray(body))return reply({ok:false,code:"invalid_request"},400);
 const userId=uuid.parse(body.user_id);
 const verified=await requireVerifiedRequestUser(request,userId);if(!verified.ok)return verified.response;
 const limit=rateLimit({key:"website-builder:"+userId+":"+clientIpFromRequest(request),limit:12,windowMs:15*60000});if(!limit.allowed)return rateLimitResponse(limit.resetAt);
 if(!websitePaidProductionEnabled()||!websitePaidCanaryAllowed(userId))return reply({ok:false,code:"website_production_not_enabled"},503);
 const db=supabaseAdmin();
 if(body.action==="generate"){
  const productionId=uuid.parse(body.productionId),planHash=hash.parse(body.planHash);
  if(body.confirmProduction!==true)return reply({ok:false,code:"explicit_production_confirmation_required"},400);
  const {data:row,error}=await db.from("production_requests").select("output_json,updated_at,status").eq("id",productionId).eq("user_id",userId).eq("production_type","website").maybeSingle();
  if(error||!row)return reply({ok:false,code:"website_project_not_found"},404);
  const a=row.output_json?.websiteAssistant;
  if(a?.planHash!==planHash)return reply({ok:false,code:"website_plan_changed_review_again"},409);
  if(a.phase==="draft"){
   const {data:approved,error:approveError}=await db.from("production_requests").update({output_json:{...row.output_json,websiteAssistant:{...a,phase:"approved",approvedHash:planHash,approvedAt:new Date().toISOString()}},updated_at:new Date().toISOString()}).eq("id",productionId).eq("user_id",userId).eq("updated_at",row.updated_at).eq("status","pending").select("id").maybeSingle();
   if(approveError||!approved)return reply({ok:false,code:"website_plan_changed_review_again"},409);
  }
  const result=await executePaidWebsiteProduction({productionId,planHash},{id:userId});
  if(result.status!==200)return reply(result.payload,result.status);
  return reply(result.payload);
 }
 if(body.action!=="quote")return reply({ok:false,code:"quote_required",message:"Review the credit price and confirm production first."},400);
 const brief=normalizeAssistantWebsiteBrief({...body,siteType:body.siteType??body.site_type});
 if(missingWebsiteBrief(brief).length||unsupportedWebsiteScope(brief).length||body.site_scope==="website_with_admin"||body.scope==="website_with_admin")return reply({ok:false,code:"website_brief_or_scope_invalid"},422);
 const pages=websitePageManifest(brief.pages);
 const packId=pages.length===1?"landing_page":"business_website";
 if(pages.length>3)return reply({ok:false,code:"website_maximum_three_pages",message:"The first release supports up to three pages."},422);
 const pack=getCategory("website")?.packs.find(p=>p.id===packId);
 if(!pack||typeof pack.credits!=="number"||pack.credits<=0)return reply({ok:false,code:"website_tariff_unavailable"},503);
 const values=[brief.brief,brief.brand,brief.siteType,brief.audience,brief.style,...brief.pages,...brief.features];
 const safe=rejectSuspiciousText(values);if(!safe.ok)return reply({ok:false,code:"unsafe_brief",message:safe.message},400);
 const safety=validateProductionSafety(values);if(!safety.ok)return reply({ok:false,code:"unsafe_brief",message:safety.message},400);
 const {data:wallet,error:walletError}=await db.from("credit_balances").select("balance,reserved").eq("user_id",userId).maybeSingle();if(walletError)return reply({ok:false,code:"credit_read_failed"},503);
 const check=productionCreditCheck(pack.credits,Math.max(0,Number(wallet?.balance??0)-Number(wallet?.reserved??0)));if(!check.ok)return reply(check,check.status);
 const planHash=websitePlanHash(brief,packId);
 // A quote persists the exact reviewed plan; it never starts production or holds credits.
 // The separate generate request must explicitly confirm and recheck the same owner/hash.
 const {data,error}=await db.from("production_requests").insert({user_id:userId,production_type:"website",package_id:"website_builder",title:brief.brand+" website",prompt:brief.brief,status:"pending",generation_status:"pending",estimated_credits:pack.credits,reserved_credits:0,input_json:{source:"website_builder",websiteBrief:brief},request_metadata:{source:"website_builder",category:"website",engine:"website_builder"},output_json:{websiteAssistant:{brief,messages:[],phase:"draft",packId,credits:pack.credits,planHash,approvedHash:null}}}).select("id").single();
 if(error||!data)return reply({ok:false,code:"website_project_create_failed"},503);
 return reply({ok:true,productionId:data.id,planHash,packId,credits:pack.credits,balance:check.balance,productionStarted:false});
 }catch{return reply({ok:false,code:"website_request_unavailable"},400);}
}
