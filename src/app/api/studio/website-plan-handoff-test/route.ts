import {createClient} from "@supabase/supabase-js";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {isolatedDatabaseTarget} from "@/lib/studio-agent/environment-policy";
import {rateLimit} from "@/lib/security";
import {handleWebsiteHandoff} from "@/lib/studio-agent/website-plan-handoff";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const fail=(status:number,code:string)=>Response.json({ok:false,code,safeToRetryAutomatically:false},{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
 if(!websiteDesignPilotEnabled())return fail(404,"not_found");
 const key=process.env.STUDIO_AGENT_TEST_SERVICE_KEY,token=bearerTokenFromRequest(request);
 if(!token)return fail(401,"sign_in");
 if(!key||!isolatedDatabaseTarget())return fail(503,"isolated_database_unavailable");
 try{
 const db=createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const auth=await db.auth.getUser(token),userId=auth.data.user?.id,canaryId=process.env.STUDIO_WEBSITE_AI_TEST_USER_ID||"";
 if(auth.error||!userId||!(auth.data.user?.email_confirmed_at||auth.data.user?.confirmed_at))return fail(401,"sign_in");
 if(userId!==canaryId)return fail(403,"website_ai_canary_required");
 if(!rateLimit({key:"website-plan-handoff:"+userId,limit:15,windowMs:60000}).allowed)return fail(429,"rate_limit");
 return await handleWebsiteHandoff(request,{userId,canaryId,
 list:async()=>{const r=await db.from("studio_agent_projects").select("id,title,revision,production_id").eq("user_id",userId).eq("category_id","website").gt("revision",0).order("updated_at",{ascending:false}).limit(30);if(r.error)throw Error("storage");return r.data;},
 load:async(id,user)=>{const r=await db.from("studio_agent_projects").select("id,user_id,category_id,revision,production_id,brief").eq("id",id).eq("user_id",user).eq("category_id","website").maybeSingle();if(r.error)throw Error("storage");return r.data;},
 rpc:async(args)=>{const r=await db.rpc("website_ai_handoff_approved_plan",args);return {data:r.data,error:r.error};}});
 }catch{return fail(503,"handoff_unavailable");}
}
