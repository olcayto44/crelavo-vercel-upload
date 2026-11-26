import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {buildSettledWebsiteCandidate,buildSettledWebsitePreview,directSettledWebsiteRows} from "@/lib/website-settled-delivery";
import {isolatedDatabaseTarget} from "@/lib/studio-agent/environment-policy";
import {websitePilotCanary} from "@/lib/studio-agent/website-pilot-provider";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const Input=z.union([z.strictObject({siteId:z.string().uuid(),productionId:z.string().uuid()}),z.strictObject({productionId:z.string().uuid(),format:z.enum(["preview","zip"])})]);
const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"};
export async function POST(request:Request){
 const fail=(status:number,code:string)=>Response.json({ok:false,code},{status,headers});
 if(!websiteDesignPilotEnabled())return fail(404,"not_found");
 const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co",key=process.env.STUDIO_AGENT_TEST_PUBLISHABLE_KEY,token=bearerTokenFromRequest(request);
 if(!token)return fail(401,"sign_in");
 if(!key?.startsWith("sb_publishable_")||process.env.STUDIO_AGENT_TEST_DATABASE_URL!==origin||process.env.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==origin)return fail(503,"isolated_database_unavailable");
 try{
 const db=createClient(origin,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const auth=await db.auth.getUser(token);if(auth.error||!auth.data.user)return fail(401,"sign_in");
 if(!rateLimit({key:"website-settled-delivery:"+auth.data.user.id,limit:6,windowMs:60000}).allowed)return fail(429,"rate_limit");
 const raw=await request.text();if(Buffer.byteLength(raw)>2000)return fail(413,"request_too_large");
 const input=Input.safeParse(JSON.parse(raw));if(!input.success)return fail(400,"invalid_request");
 const {productionId}=input.data;
 let rows:unknown;
 if("siteId" in input.data){
 const r=await db.rpc("website_cms_read_settled_designs",{p_site:input.data.siteId,p_production:productionId});
 if(r.error||!Array.isArray(r.data)||r.data.length!==1)return fail(404,"settled_design_unavailable");
 rows=r.data;
 }else{
 const actor=auth.data.user.id,serviceKey=process.env.STUDIO_AGENT_TEST_SERVICE_KEY;
 if(!(auth.data.user.email_confirmed_at||auth.data.user.confirmed_at)||!websitePilotCanary(actor))return fail(403,"website_ai_canary_required");
 if(!serviceKey||!isolatedDatabaseTarget())return fail(503,"isolated_database_unavailable");
 const admin=createClient(origin,serviceKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const [j,p,r]=await Promise.all([
 admin.from("website_ai_jobs").select("production_id,user_id,plan_hash,state,credits,maximum_micro_usd,receipt,reviewed_cost,artifact").eq("production_id",productionId).eq("user_id",actor).maybeSingle(),
 admin.from("production_requests").select("id,user_id,production_type,status,reserved_credits,output_json").eq("id",productionId).eq("user_id",actor).maybeSingle(),
 admin.from("website_credit_reservations").select("production_id,user_id,plan_hash,state,credits").eq("production_id",productionId).eq("user_id",actor).maybeSingle()
 ]);
 if(j.error||p.error||r.error)return fail(503,"settled_delivery_unavailable");
 if(!j.data||!p.data||!r.data||j.data.state!=="settled")return fail(409,"settled_design_unavailable");
 try{rows=directSettledWebsiteRows(actor,productionId,j.data,p.data,r.data);}catch{return fail(409,"settled_design_unavailable");}
 if(input.data.format==="preview")return Response.json({ok:true,...buildSettledWebsitePreview(rows,productionId)},{headers});
 }
 const bundle=buildSettledWebsiteCandidate(rows,productionId);
 return new Response(new Uint8Array(bundle.zip).buffer,{headers:{...headers,"Content-Type":"application/zip","Content-Disposition":'attachment; filename="crelavo-settled-website-candidate.zip"'}});
 }catch{return fail(400,"settled_design_invalid");}
}
