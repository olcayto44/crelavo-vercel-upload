import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {isolatedDatabaseTarget} from "@/lib/studio-agent/environment-policy";
import {websitePilotCanary} from "@/lib/studio-agent/website-pilot-provider";
import {rateLimit} from "@/lib/security";
import {buildWebsiteMediaPlan} from "@/lib/website-media-art-direction";
import {handleImageLaunch} from "@/lib/studio-agent/image-launch";
import {websiteImageCandidates,verifyWebsiteOpenAIImageModel} from "@/lib/studio-agent/website-image-routes";
import {generateSingleMinimaxImage,generateSingleOpenAIWebsiteImage,generateAlternativeWebsiteImage} from "@/lib/studio-agent/image-provider";
import {optimizeSettledImageForWebsite} from "@/lib/studio-agent/website-settled-image";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=120;
const base={siteId:z.string().uuid(),version:z.number().int().positive(),pageSlug:z.string().regex(/^[a-z][a-z0-9-]{0,48}$/)};
const Input=z.discriminatedUnion("action",[
 z.strictObject({...base,action:z.literal("status")}),
 z.strictObject({...base,action:z.literal("quote")}),
 z.strictObject({...base,action:z.literal("submit"),requestId:z.string().uuid(),quoteHash:z.string().regex(/^[a-f0-9]{64}$/),approvedCredits:z.number().int().positive(),confirmProduction:z.literal(true)}),
 z.strictObject({...base,action:z.literal("preview"),requestId:z.string().uuid()}),
 z.strictObject({...base,action:z.literal("place"),requestId:z.string().uuid(),alt:z.string().trim().min(1).max(160),rightsConfirmed:z.literal(true)})
]);
export async function POST(request:Request){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
 const fail=(status:number,code:string)=>json({ok:false,code,safeToRetryAutomatically:false},status);
 if(!websiteDesignPilotEnabled()||!isolatedDatabaseTarget())return fail(404,"not_found");
 const token=bearerTokenFromRequest(request),key=process.env.STUDIO_AGENT_TEST_SERVICE_KEY;
 if(!token)return fail(401,"sign_in");if(!key)return fail(503,"isolated_database_unavailable");
 try{
 const db=createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await db.auth.getUser(token);if(error||!data.user||!(data.user.email_confirmed_at||data.user.confirmed_at))return fail(401,"sign_in");
 const userId=data.user.id;if(!websitePilotCanary(userId))return fail(403,"website_pilot_only");
 if(!rateLimit({key:"website-page-image:"+userId,limit:20,windowMs:60000}).allowed)return fail(429,"rate_limit");
 const body=await request.text();if(Buffer.byteLength(body)>4000)return fail(413,"request_too_large");
 const parsed=Input.safeParse(JSON.parse(body));if(!parsed.success)return fail(400,"invalid_request");const v=parsed.data;
 const member=await db.from("website_cms_members").select("role").eq("site_id",v.siteId).eq("user_id",userId).maybeSingle();
 if(member.error||!member.data||!["owner","editor"].includes(member.data.role))return fail(404,"project_not_found");
 const draft=await db.from("website_cms_design_drafts").select("design,version").eq("site_id",v.siteId).maybeSingle();
 if(draft.error||draft.data?.version!==v.version)return fail(409,"project_changed_reload");
 const plan=buildWebsiteMediaPlan(draft.data.design).find(p=>p.pageSlug===v.pageSlug);if(!plan)return fail(404,"page_not_found");
 const canaryId=userId;
 const enabled=()=>process.env.STUDIO_WEBSITE_IMAGE_PILOT_ENABLED==="true"&&process.env.STUDIO_AGENT_REAL_AI_APPROVED==="true"&&process.env.STUDIO_AGENT_ACCOUNTING_ENABLED==="true"&&process.env.STUDIO_AGENT_TEST_OFFLINE!=="true";
 const candidates=websiteImageCandidates(userId);
 const cfg=await db.from("studio_image_activation").select("enabled,total_micro_usd").eq("singleton",true).maybeSingle();
 if(cfg.error)return fail(503,"image_policy_unavailable");
 const routes=await db.from("studio_website_image_routes").select("version,provider,model,enabled").eq("enabled",true);
 if(routes.error)return fail(503,"image_policy_unavailable");
 const tariffs=await db.from("studio_image_tariffs").select("version,credits,max_micro_usd,enabled").eq("enabled",true);
 if(tariffs.error)return fail(503,"image_policy_unavailable");
 const budget=await db.from("studio_image_operations").select("max_micro_usd").neq("state","released").limit(1000);
 if(budget.error)return fail(503,"image_budget_unavailable");
 const remaining=Math.max(0,(cfg.data?.total_micro_usd??0)-(budget.data??[]).reduce((sum,row)=>sum+row.max_micro_usd,0));
 const wallet=await db.from("credit_balances").select("balance,reserved").eq("user_id",userId).maybeSingle();if(wallet.error)return fail(503,"image_wallet_unavailable");
 const available=Math.max(0,(wallet.data?.balance??0)-(wallet.data?.reserved??0));
 const eligible=enabled()&&cfg.data?.enabled?candidates.filter(c=>routes.data?.some(r=>r.version===c.route.version&&r.provider===c.route.provider&&r.model===c.route.model)&&tariffs.data?.some(t=>t.version===c.route.version&&t.credits===c.route.credits&&t.max_micro_usd===c.route.max_micro_usd)&&c.route.max_micro_usd<=remaining&&c.route.credits<=available):[];
 let selected:(typeof eligible)[number]|undefined=eligible[0];
 // Free metadata check before quoting or submitting. No provider switch after dispatch.
 if(v.action==="quote"||v.action==="submit"){for(const c of eligible){if(c.route.provider==="openai"&&!await verifyWebsiteOpenAIImageModel(c.key)){selected=undefined;continue;}selected=c;break;}}
 const loadTariff=async()=>selected?{version:selected.route.version,credits:selected.route.credits,max_micro_usd:selected.route.max_micro_usd,enabled:true}:null;
 const loadTarget=async()=>{const t=await db.from("studio_website_image_targets").select("request_id,project_id,prompt,placed_media_version").eq("user_id",userId).eq("site_id",v.siteId).eq("design_version",v.version).eq("page_slug",v.pageSlug).maybeSingle();if(t.error)throw Error("target");return t.data;};
 const loadOperation=async(user:string,id:string)=>{const r=await db.from("studio_image_operations").select("request_id,user_id,project_id,state").eq("request_id",id).eq("user_id",user).maybeSingle();if(r.error)throw Error("operation");return r.data;};
 let target=await loadTarget();
 if(v.action==="status"){
 const tariff=await loadTariff();let op=target?await loadOperation(userId,target.request_id):null;
 if(target&&op?.state==="artifact_cost_pending"){await db.rpc("studio_website_image_finalize_estimate",{p_user:userId,p_site:v.siteId,p_request:target.request_id});op=await loadOperation(userId,target.request_id);}
 return json({ok:true,enabled:enabled()&&!!tariff,code:!enabled()?"image_provider_not_configured":!tariff?"image_tariff_or_budget_unavailable":null,provider:selected?.route.provider??null,availableCredits:available,state:target?.placed_media_version?"placed":op?.state??(target?"prepared":"not_started"),requestId:target?.request_id??null});
 }
 if(v.action==="quote"){
 if(!enabled()||!await loadTariff())return fail(503,"image_provider_or_tariff_unavailable");
 if(!target){const r=await db.rpc("studio_website_image_prepare",{p_user:userId,p_site:v.siteId,p_version:v.version,p_slug:v.pageSlug,p_prompt:plan.prompt});if(r.error||!r.data)return fail(409,"image_target_conflict");target=await loadTarget();}
 }
 if(!target||target.prompt!==plan.prompt||("requestId" in v&&target.request_id!==v.requestId))return fail(409,"image_target_conflict");
 if(v.action==="preview"||v.action==="place"){
 const image=await db.from("studio_image_operations").select("request_id,user_id,project_id,state,plan,receipt,actual_micro_usd,max_micro_usd,artifact").eq("user_id",userId).eq("request_id",target.request_id).eq("project_id",target.project_id).eq("state","settled").maybeSingle();
 if(image.error||!image.data)return fail(409,"image_not_settled");
 const estimate=await db.from("studio_website_image_estimates").select("request_id,provider_request_id,estimated_micro_usd,policy_version,invoice_pending").eq("request_id",target.request_id).maybeSingle();if(estimate.error)return fail(503,"image_cost_unavailable");
 const candidate=await optimizeSettledImageForWebsite(image.data,userId,target.request_id,v.pageSlug,v.action==="place"?v.alt:"Concept image for "+plan.pageLabel,estimate.data);
 if(v.action==="preview")return json({ok:true,media:candidate.media,requiresRightsConfirmation:true});
 const m=candidate.media,r=await db.rpc("studio_website_image_place",{p_user:userId,p_site:v.siteId,p_version:v.version,p_slug:v.pageSlug,p_request:target.request_id,p_source_sha:candidate.sourceSha256,p_data:m.image_data,p_alt:m.alt,p_width:m.width,p_height:m.height,p_rights:v.rightsConfirmed});
 if(r.error||typeof r.data!=="number")return fail(409,"image_placement_conflict_reload");
 return json({ok:true,state:"placed",mediaVersion:r.data,requestId:target.request_id});
 }
 if(!enabled()||!selected)return fail(503,"image_provider_not_configured");
 const chosen=selected;
 const payload={action:v.action,projectId:target.project_id,requestId:target.request_id,request:{prompt:target.prompt,aspect:plan.aspect},...(v.action==="submit"?{quoteHash:v.quoteHash,approvedCredits:v.approvedCredits,confirmProduction:true}:{})};
 const result=await handleImageLaunch(new Request("https://internal.invalid/image",{method:"POST",body:JSON.stringify(payload)}),{userId,canaryId,enabled:()=>enabled()&&!!selected,loadTariff,loadOperation,route:selected.route,
 loadProject:async(user,id)=>{const r=await db.from("production_requests").select("id,user_id,production_type").eq("id",id).eq("user_id",user).eq("production_type","image").maybeSingle();if(r.error)throw Error("project");return r.data;},
 rpc:async(name,args)=>{const r=await db.rpc(name,args);return {data:r.data,error:r.error};},generate:input=>chosen.route.provider==="openai"?generateSingleOpenAIWebsiteImage(input,chosen.key):chosen.route.provider==="minimax"?generateSingleMinimaxImage(input,chosen.key):generateAlternativeWebsiteImage(chosen.route.provider,input,chosen.key)});
 if(v.action==="submit"&&result.ok){const output=await result.clone().json();if(output.state==="artifact_recorded_cost_pending"){const finalized=await db.rpc("studio_website_image_finalize_estimate",{p_user:userId,p_site:v.siteId,p_request:target.request_id});if(!finalized.error&&["settled","already_settled"].includes(String(finalized.data)))return json({ok:true,state:"settled",requestId:target.request_id,costSource:"metered_or_published_price_estimate",invoicePending:true,safeToRetryAutomatically:false});}}
 if(v.action==="quote"&&result.ok){const output=await result.json();return json({...output,requiresReviewedProviderCost:false,maximumProviderMicroUsd:selected.route.max_micro_usd,invoicePending:true});}
 return result;
 }catch{return fail(503,"website_image_unavailable");}
}
