import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {listSettledWebsiteImages,optimizeSettledImageForWebsite} from "@/lib/studio-agent/website-settled-image";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const Import=z.strictObject({siteId:z.string().uuid(),requestId:z.string().uuid(),pageSlug:z.string().regex(/^[a-z][a-z0-9-]{0,48}$/),alt:z.string().trim().min(1).max(160)});
const Input=z.union([Import,z.strictObject({action:z.literal("list"),siteId:z.string().uuid()})]);
export async function POST(request:Request){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
 if(!websiteDesignPilotEnabled())return json({ok:false},404);
 const url="https://bwzxdxqgrgbsvndinmrv.supabase.co",key=process.env.STUDIO_AGENT_TEST_SERVICE_KEY,token=bearerTokenFromRequest(request);
 if(!token)return json({ok:false,code:"sign_in"},401);
 if(!key||process.env.STUDIO_AGENT_TEST_DATABASE_URL!==url||process.env.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==url)return json({ok:false,code:"isolated_database_unavailable"},503);
 try{
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await db.auth.getUser(token);if(error||!data.user||!(data.user.email_confirmed_at||data.user.confirmed_at))return json({ok:false,code:"sign_in"},401);
 const user=data.user.id;if(!rateLimit({key:"website-image-import:"+user,limit:6,windowMs:60000}).allowed)return json({ok:false,code:"rate_limit"},429);
 const raw=await request.text();if(Buffer.byteLength(raw)>4000)return json({ok:false,code:"request_too_large"},413);
 const input=Input.safeParse(JSON.parse(raw));if(!input.success)return json({ok:false,code:"invalid_request"},400);
 const v=input.data;
 const member=await db.from("website_cms_members").select("role").eq("site_id",v.siteId).eq("user_id",user).maybeSingle();
 if(member.error||!member.data||!["owner","editor"].includes(member.data.role))return json({ok:false,code:"project_not_found"},404);
 if("action" in v){
 const list=await db.from("studio_image_operations").select("request_id,user_id,state,plan,receipt,actual_micro_usd,max_micro_usd,updated_at").eq("user_id",user).eq("state","settled").order("updated_at",{ascending:false}).limit(30);
 if(list.error)return json({ok:false,code:"image_list_unavailable"},503);
 return json({ok:true,images:listSettledWebsiteImages(list.data??[],user)});
 }
 const draft=await db.from("website_cms_design_drafts").select("design").eq("site_id",v.siteId).maybeSingle();
 if(draft.error||!Array.isArray(draft.data?.design?.pages)||!draft.data.design.pages.some((p:{slug?:string})=>p.slug===v.pageSlug))return json({ok:false,code:"page_not_found"},404);
 const image=await db.from("studio_image_operations").select("request_id,user_id,state,plan,receipt,actual_micro_usd,max_micro_usd,artifact").eq("request_id",v.requestId).eq("user_id",user).eq("state","settled").maybeSingle();
 if(image.error||!image.data)return json({ok:false,code:"settled_image_not_found"},404);
 const candidate=await optimizeSettledImageForWebsite(image.data,user,v.requestId,v.pageSlug,v.alt);
 // Do not claim rights or save; use existing explicit owner-attested media save.
 return json({ok:true,...candidate});
 }catch{return json({ok:false,code:"image_import_unavailable"},503);}
}
