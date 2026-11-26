import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {verifyWebsiteHeroMedia} from "@/lib/website-hero-media-verify";
import {inspectWebsiteDelivery} from "@/lib/website-delivery-preflight";
import {buildWebsiteReviewBundle} from "@/lib/website-review-bundle";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const Input=z.strictObject({siteId:z.string().uuid(),format:z.enum(["review","selfhost","preflight"]),expectedSha256:z.string().regex(/^[a-f0-9]{64}$/).optional()});
const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"};
export async function POST(request:Request){
 const fail=(status:number,code:string)=>Response.json({ok:false,code},{status,headers});
 if(!websiteDesignPilotEnabled())return fail(404,"not_found");
 const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co",key=process.env.STUDIO_AGENT_TEST_PUBLISHABLE_KEY,token=bearerTokenFromRequest(request);
 if(!token)return fail(401,"sign_in");
 if(!key?.startsWith("sb_publishable_")||process.env.STUDIO_AGENT_TEST_DATABASE_URL!==origin||process.env.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==origin)return fail(503,"isolated_database_unavailable");
 try{
 const db=createClient(origin,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const auth=await db.auth.getUser(token);if(auth.error||!auth.data.user)return fail(401,"sign_in");
 if(!rateLimit({key:"website-snapshot-delivery:"+auth.data.user.id,limit:6,windowMs:60000}).allowed)return fail(429,"rate_limit");
 const raw=await request.text();if(Buffer.byteLength(raw)>2000)return fail(413,"request_too_large");
 const input=Input.safeParse(JSON.parse(raw));if(!input.success)return fail(400,"invalid_request");
 // The authenticated owner-only RPC supplies one consistent snapshot. Never
 // accept caller-supplied design, media, user identity, billing status or revision.
 const r=await db.rpc("website_cms_export_content",{p_site:input.data.siteId});
 if(r.error||!r.data||r.data.format!=="crelavo-private-content-snapshot-v1")return fail(404,"snapshot_unavailable");
 const s=r.data;if(!s.design?.design||!Array.isArray(s.catalog))return fail(409,"saved_design_required");
 const payload={design:s.design.design,revision:s.design.version,catalog:s.catalog.map((p:Record<string,unknown>)=>({sku:p.sku,name:p.name,description:p.description,price_minor:p.price_minor,currency:p.currency,stock:p.stock,visible:p.visible})),articles:(Array.isArray(s.articles)?s.articles:[]).filter((a:Record<string,unknown>)=>a.state==="reviewed").map((a:Record<string,unknown>)=>({slug:a.slug,title:a.title,description:a.description,body:a.body,state:a.state})),heroMedia:await verifyWebsiteHeroMedia(s.heroMedia??[])};
 const selfHost=input.data.format!=="review";
 if(selfHost){
 const {result,review}=inspectWebsiteDelivery(payload);
 if(input.data.format==="preflight")return Response.json({ok:true,...review},{headers});
 if(input.data.expectedSha256!==review.sha256)return fail(409,"delivery_review_required_or_snapshot_changed");
 return new Response(new Uint8Array(result.zip).buffer,{headers:{...headers,"Content-Type":"application/zip","Content-Disposition":'attachment; filename="crelavo-independent-website-candidate.zip"',"X-Artifact-SHA256":review.sha256}});
 }
 const result=buildWebsiteReviewBundle(payload);
 return new Response(new Uint8Array(result.zip).buffer,{headers:{...headers,"Content-Type":"application/zip","Content-Disposition":'attachment; filename="crelavo-private-site-review.zip"'}});
 }catch{return fail(400,"saved_snapshot_invalid");}
}
