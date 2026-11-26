import {createClient} from "@supabase/supabase-js";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {isolatedDatabaseTarget} from "@/lib/studio-agent/environment-policy";
import {handleImageLaunch} from "@/lib/studio-agent/image-launch";
import {generateSingleMinimaxImage} from "@/lib/studio-agent/image-provider";
import {websiteImagePilotConnection} from "@/lib/studio-agent/website-pilot-provider";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=120;
export async function POST(request:Request){
 const fail=(status:number,code:string)=>Response.json({ok:false,code,safeToRetryAutomatically:false},{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
 if(!websiteDesignPilotEnabled())return fail(404,"not_found");
 const token=bearerTokenFromRequest(request),key=process.env.STUDIO_AGENT_TEST_SERVICE_KEY;
 if(!token)return fail(401,"sign_in");
 if(!key||!isolatedDatabaseTarget())return fail(503,"isolated_database_unavailable");
 try{
 const db=createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await db.auth.getUser(token);if(error||!data.user||!(data.user.email_confirmed_at||data.user.confirmed_at))return fail(401,"sign_in");
 const userId=data.user.id,{canaryId,apiKey}=websiteImagePilotConnection();
 if(userId!==canaryId)return fail(403,"image_canary_required");
 if(!rateLimit({key:"studio-image-launch:"+userId,limit:10,windowMs:60000}).allowed)return fail(429,"rate_limit");
 return await handleImageLaunch(request,{userId,canaryId,
 enabled:()=>websiteDesignPilotEnabled()&&isolatedDatabaseTarget()&&!!apiKey.trim()&&process.env.STUDIO_IMAGE_LAUNCH_ENABLED==="true"&&process.env.STUDIO_IMAGE_PROVIDER_VERIFIED==="true"&&process.env.STUDIO_AGENT_REAL_AI_APPROVED==="true"&&process.env.STUDIO_AGENT_ACCOUNTING_ENABLED==="true"&&process.env.STUDIO_AGENT_TEST_OFFLINE!=="true",
 loadProject:async(user,id)=>{const r=await db.from("production_requests").select("id,user_id,production_type").eq("id",id).eq("user_id",user).eq("production_type","image").maybeSingle();if(r.error)throw Error("storage");return r.data;},
 loadOperation:async(user,id)=>{const r=await db.from("studio_image_operations").select("request_id,user_id,project_id,state").eq("request_id",id).eq("user_id",user).maybeSingle();if(r.error)throw Error("storage");return r.data;},
 loadTariff:async()=>{const r=await db.from("studio_image_activation").select("tariff_version,enabled").eq("singleton",true).maybeSingle();if(r.error||!r.data?.enabled)return null;const t=await db.from("studio_image_tariffs").select("version,credits,max_micro_usd,enabled").eq("version",r.data.tariff_version).eq("enabled",true).maybeSingle();if(t.error)throw Error("storage");return t.data;},
 rpc:async(name,args)=>{const r=await db.rpc(name,args);return {data:r.data,error:r.error};},generate:input=>generateSingleMinimaxImage(input,apiKey)});
 }catch{return fail(503,"image_configuration_unavailable");}
}
