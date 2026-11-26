import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {rateLimit,rateLimitResponse} from "@/lib/security";
import {centralWebsiteAdapterEnabled} from "@/lib/studio-agent/production-adapter";
import {handleProductionDispatch} from "@/lib/studio-agent/production-dispatch";
import {executePaidWebsiteProduction,websitePaidProductionEnabled,websitePaidCanaryAllowed} from "@/lib/assistant-work/website-paid-production";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=120;
export async function POST(request:Request){
 // The isolated Website pilot uses its own authenticated API and database.
 // Never fall back to the live database from preview or development builds.
 if(process.env.VERCEL_ENV!=="production"||process.env.STUDIO_AGENT_ISOLATED_PREVIEW==="true")return Response.json({ok:false,code:"production_environment_required",safeToRetryAutomatically:false},{status:503,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
 try{
 const token=bearerTokenFromRequest(request);
 if(!token)return Response.json({ok:false,code:"sign_in"},{status:401});
 const db=supabaseAdmin(),{data,error}=await db.auth.getUser(token);
 if(error||!data.user||!(data.user.email_confirmed_at||data.user.confirmed_at))return Response.json({ok:false,code:"sign_in"},{status:401});
 const actor=data.user.id,limit=rateLimit({key:"studio-production:"+actor,limit:5,windowMs:15*60000});
 if(!limit.allowed)return rateLimitResponse(limit.resetAt);
 return await handleProductionDispatch(request,{
 authenticate:async()=>actor,
 loadStudio:async(userId,projectId)=>{const {data,error}=await db.from("studio_agent_projects").select("id,user_id,category_id,production_id").eq("id",projectId).eq("user_id",userId).eq("category_id","website").maybeSingle();if(error)throw Error("storage");return data;},
 loadWebsite:async(userId,productionId)=>{const {data,error}=await db.from("production_requests").select("id,user_id,production_type,status,estimated_credits,output_json").eq("id",productionId).eq("user_id",userId).eq("production_type","website").maybeSingle();if(error)throw Error("storage");return data;},
 adapter:{enabled:()=>centralWebsiteAdapterEnabled()&&websitePaidProductionEnabled()&&websitePaidCanaryAllowed(actor),execute:executePaidWebsiteProduction}});
 }catch{return Response.json({ok:false,code:"studio_production_unavailable",safeToRetryAutomatically:false},{status:503,headers:{"Cache-Control":"no-store"}});}
}
