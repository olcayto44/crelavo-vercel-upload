import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {buildSettledWebsiteCandidate} from "@/lib/website-settled-delivery";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const Input=z.strictObject({siteId:z.string().uuid(),productionId:z.string().uuid()});
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
 const {siteId,productionId}=input.data;
 const r=await db.rpc("website_cms_read_settled_designs",{p_site:siteId,p_production:productionId});
 if(r.error||!Array.isArray(r.data)||r.data.length!==1)return fail(404,"settled_design_unavailable");
 const bundle=buildSettledWebsiteCandidate(r.data,productionId);
 return new Response(new Uint8Array(bundle.zip).buffer,{headers:{...headers,"Content-Type":"application/zip","Content-Disposition":'attachment; filename="crelavo-settled-website-candidate.zip"'}});
 }catch{return fail(400,"settled_design_invalid");}
}
