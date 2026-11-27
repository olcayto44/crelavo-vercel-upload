import {createClient} from "@supabase/supabase-js";
import {websitePilotCanary,websitePilotScope} from "@/lib/studio-agent/website-pilot-provider";
import {websiteCommercialAcceptanceBranch} from "@/lib/website-pilot-branches";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {websiteCreditDeliveryProof} from "@/lib/assistant-work/website-paid-delivery";
import {WebsiteDraftSave,readBoundedWebsiteJson} from "@/lib/website-production-draft";
import {WebsiteDesignSpec} from "@/lib/website-design-schema";
import {renderPremiumReview,savePremiumReview} from "@/lib/website-premium-review";
export const runtime="nodejs";export const dynamic="force-dynamic";
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
async function owned(request:Request){
 if(!websitePilotScope()||process.env.VERCEL_GIT_COMMIT_REF!==websiteCommercialAcceptanceBranch)throw Error("scope");
 const token=bearerTokenFromRequest(request);if(!token)throw Error("sign_in");
 const db=createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",process.env.STUDIO_AGENT_TEST_SERVICE_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const auth=await db.auth.getUser(token),actor=auth.data.user?.id;
 if(auth.error||!actor||!(auth.data.user?.email_confirmed_at||auth.data.user?.confirmed_at)||!websitePilotCanary(actor)||!rateLimit({key:"premium-review:"+actor,limit:90,windowMs:60000}).allowed)throw Error("scope");
 const p=await db.from("production_requests").select("id,user_id,production_type,status,reserved_credits,output_json,updated_at").eq("user_id",actor).eq("production_type","website").eq("request_metadata->>source","studio_premium_pilot_v1").maybeSingle();
 if(p.error||!p.data||p.data.output_json?.websiteAssistant?.phase!=="ready")throw Error("settled");
 const r=await db.from("website_credit_reservations").select("state,credits,plan_hash").eq("production_id",p.data.id).eq("user_id",actor).maybeSingle();
 if(r.error||!r.data||r.data.plan_hash!==p.data.output_json?.websiteAssistant?.planHash||!websiteCreditDeliveryProof(p.data,r.data))throw Error("settled");
 return {db,actor,row:p.data,output:p.data.output_json,version:Number(p.data.output_json.websiteDesignVersion??1)};
}
export async function GET(request:Request){try{const a=await owned(request);return out({ok:true,version:a.version,design:WebsiteDesignSpec.parse(a.output.plan.editableDesign)});}catch{return out({ok:false,code:"review_unavailable"},403);}}
export async function POST(request:Request){try{const a=await owned(request),next=renderPremiumReview(a.output,await readBoundedWebsiteJson(request,50000));const css=next.files.find(f=>f.path==="styles.css")!.content;
 return out({ok:true,pages:next.files.filter(f=>f.path.endsWith(".html")).map(f=>({path:f.path,content:f.content.replace('<link rel="stylesheet" href="./styles.css">',()=>"<style>"+css+"</style>")}))});
 }catch{return out({ok:false,code:"preview_unavailable"},422);}}
export async function PUT(request:Request){try{const a=await owned(request),p=WebsiteDraftSave.parse(await readBoundedWebsiteJson(request,50000));
 if(p.version!==a.version)return out({ok:false,code:"version_conflict"},409);
 const now=new Date().toISOString(),next=savePremiumReview(a.output,p.design,now);
 if(Buffer.byteLength(JSON.stringify(next))>7000000)return out({ok:false,code:"project_size_limit"},413);
 const r=await a.db.from("production_requests").update({output_json:next,updated_at:now}).eq("id",a.row.id).eq("user_id",a.actor).eq("status","ready").eq("updated_at",a.row.updated_at).select("id").maybeSingle();
 if(r.error)return out({ok:false,code:"storage_unavailable"},503);if(!r.data)return out({ok:false,code:"version_conflict"},409);
 return out({ok:true,version:next.websiteDesignVersion});
 }catch{return out({ok:false,code:"save_unavailable"},422);}}
