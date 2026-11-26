import {websitePilotProviderKey} from "@/lib/studio-agent/website-pilot-provider";
import {createClient} from "@supabase/supabase-js";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {readCostPolicy} from "@/lib/studio-agent/cost-policy";
import {websiteAIPolicyDigest} from "@/lib/studio-agent/website-ai-orchestrator";
import {handleWebsiteAILaunch} from "@/lib/studio-agent/website-ai-launch";
import {isolatedDatabaseTarget} from "@/lib/studio-agent/environment-policy";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function POST(request:Request){
 const fail=(status:number,code:string)=>Response.json({ok:false,code,safeToRetryAutomatically:false},{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
 if(!websiteDesignPilotEnabled())return fail(404,"not_found");
 const token=bearerTokenFromRequest(request),key=process.env.STUDIO_AGENT_TEST_SERVICE_KEY;
 if(!token)return fail(401,"sign_in");
 if(!key||!isolatedDatabaseTarget())return fail(503,"isolated_database_unavailable");
 try{
 const db=createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await db.auth.getUser(token);
 if(error||!data.user||!(data.user.email_confirmed_at||data.user.confirmed_at))return fail(401,"sign_in");
 const userId=data.user.id,canaryId=process.env.STUDIO_WEBSITE_AI_TEST_USER_ID||"";
 if(userId!==canaryId)return fail(403,"website_ai_canary_required");
 if(!rateLimit({key:"website-ai-launch:"+userId,limit:10,windowMs:60000}).allowed)return fail(429,"rate_limit");
 const policy=readCostPolicy(),hash=websiteAIPolicyDigest(policy),apiKey=websitePilotProviderKey();
 const activation=await db.from("website_ai_activation").select("auto_metered_settlement").eq("singleton",true).maybeSingle();if(activation.error)return fail(503,"website_ai_configuration_unavailable");const autoMeteredSettlement=activation.data?.auto_metered_settlement===true;
 return await handleWebsiteAILaunch(request,{userId,canaryId,policy,apiKey,autoMeteredSettlement,
 enabled:()=>websiteDesignPilotEnabled()&&isolatedDatabaseTarget()&&process.env.STUDIO_WEBSITE_AI_LAUNCH_ENABLED==="true"&&process.env.STUDIO_AGENT_REAL_AI_APPROVED==="true"&&process.env.STUDIO_AGENT_REAL_AI_ENABLED==="true"&&process.env.STUDIO_AGENT_PROVIDER_VERIFIED==="true"&&process.env.STUDIO_AGENT_ACCOUNTING_ENABLED==="true"&&process.env.STUDIO_AGENT_TEST_OFFLINE!=="true",
 policyMatches:async()=>{const r=await db.from("website_ai_activation").select("policy_version,policy_hash,maximum_micro_usd,total_micro_usd,user_rpm,system_rpm,enabled,auto_metered_settlement").eq("singleton",true).maybeSingle();const p=r.data;return !r.error&&!!p&&p.enabled===true&&p.auto_metered_settlement===autoMeteredSettlement&&p.policy_version===policy.version&&p.policy_hash===hash&&p.maximum_micro_usd===policy.requestMicroUSD&&p.total_micro_usd===policy.totalMicroUSD&&p.user_rpm===policy.userRPM&&p.system_rpm===policy.systemRPM;},
 loadProject:async(user,id)=>{const r=await db.from("production_requests").select("id,user_id,production_type,status,estimated_credits,output_json").eq("id",id).eq("user_id",user).eq("production_type","website").maybeSingle();if(r.error)throw Error("storage");return r.data;},
 loadJob:async(user,id)=>{const r=await db.from("website_ai_jobs").select("production_id,user_id,plan_hash,policy_version,policy_hash,credits,maximum_micro_usd,state").eq("production_id",id).eq("user_id",user).maybeSingle();if(r.error)throw Error("storage");return r.data;},
 rpc:async(name,args)=>{const r=await db.rpc(name,args);return {data:r.data,error:r.error};}});
 }catch{return fail(503,"website_ai_configuration_unavailable");}
}
