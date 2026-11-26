import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {rateLimit,rateLimitResponse} from "@/lib/security";
import {handleProductionStatus} from "@/lib/studio-agent/production-status";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
 const token=bearerTokenFromRequest(request);
 if(!token)return Response.json({ok:false,code:"sign_in"},{status:401,headers:{"Cache-Control":"no-store"}});
 const db=supabaseAdmin(),{data,error}=await db.auth.getUser(token);
 if(error||!data.user||!(data.user.email_confirmed_at||data.user.confirmed_at))return Response.json({ok:false,code:"sign_in"},{status:401,headers:{"Cache-Control":"no-store"}});
 const user=data.user.id,limit=rateLimit({key:"studio-production-status:"+user,limit:60,windowMs:60000});
 if(!limit.allowed)return rateLimitResponse(limit.resetAt);
 return await handleProductionStatus(request,{
 authenticate:async()=>user,
 loadBinding:async(u,p)=>{const {data,error}=await db.from("studio_agent_projects").select("id,user_id,category_id,production_id").eq("id",p).eq("user_id",u).eq("category_id","website").maybeSingle();if(error)throw Error("storage");return data;},
 loadProduction:async(u,p)=>{const {data,error}=await db.from("production_requests").select("id,user_id,production_type,status,generation_status,reserved_credits,estimated_credits,updated_at,output_json").eq("id",p).eq("user_id",u).eq("production_type","website").maybeSingle();if(error)throw Error("storage");return data;},
 loadAIJob:async(u,p)=>{const {data,error}=await db.from("website_ai_jobs").select("production_id,user_id,plan_hash,state").eq("production_id",p).eq("user_id",u).maybeSingle();if(error?.code==="42P01"||error?.code==="PGRST205")return null;if(error)throw Error("storage");return data;},
 loadReservation:async(u,p)=>{const {data,error}=await db.from("website_credit_reservations").select("production_id,user_id,plan_hash,credits,state").eq("production_id",p).eq("user_id",u).maybeSingle();if(error)throw Error("storage");return data;}
 });
 }catch{return Response.json({ok:false,code:"production_status_unavailable",safeToRetryAutomatically:false},{status:503,headers:{"Cache-Control":"no-store"}});}
}
