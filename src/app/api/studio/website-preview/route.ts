import { z } from "zod";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { buildPreviewHtml } from "@/lib/automatic-delivery-builder";
import { websiteCreditDeliveryProof } from "@/lib/assistant-work/website-paid-delivery";
import { rateLimit } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (value: unknown, status=200) => Response.json(value,{status,headers:{"Cache-Control":"no-store"}});
const PageSchema=z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}\.html$/);
export async function GET(request: Request) {
  const token=bearerTokenFromRequest(request);
  if(!token)return json({ok:false,code:"sign_in"},401);
  const db=supabaseAdmin();
  const {data:auth,error:authError}=await db.auth.getUser(token);
  if(authError||!auth.user)return json({ok:false,code:"sign_in"},401);
  const limit=rateLimit({key:"studio-website-preview:"+auth.user.id,limit:30,windowMs:60000});
  if(!limit.allowed)return json({ok:false,code:"rate_limit"},429);
  const url=new URL(request.url);
  const parsedId=z.string().uuid().safeParse(url.searchParams.get("projectId"));
  const parsedPage=PageSchema.safeParse(url.searchParams.get("page")||"index.html");
  if(!parsedId.success||!parsedPage.success)return json({ok:false,code:"invalid_preview_request"},400);
  const id=parsedId.data;
  const {data:row,error}=await db.from("production_requests")
    .select("id,user_id,production_type,status,reserved_credits,title,output_json")
    .eq("id",id).eq("user_id",auth.user.id).eq("production_type","website").maybeSingle();
  if(error)return json({ok:false,code:"website_preview_unavailable"},503);
  if(!row)return json({ok:false,code:"website_not_found"},404);
  const output=row.output_json && typeof row.output_json==="object" && !Array.isArray(row.output_json)
    ? row.output_json as Record<string,unknown> : {};
  const {data:proof,error:proofError}=await db.from("website_credit_reservations")
    .select("state,credits").eq("production_id",id).eq("user_id",auth.user.id).maybeSingle();
  if(proofError)return json({ok:false,code:"website_credit_proof_unavailable"},503);
  if(proof||output.websiteBillingMode==="atomic_v1"||output.websiteBillingPending===true) {
    if(!websiteCreditDeliveryProof(row,proof))return json({ok:false,code:"website_atomic_delivery_not_settled"},409);
  }
  if(row.status!=="ready")return json({ok:true,state:"unavailable",reason:"output_not_ready",projectId:id,title:row.title,pages:[]});
  const files=Array.isArray(output.websiteFiles)?output.websiteFiles:[];
  if(files.length>100||files.some(file=>!file||typeof file!=="object"||typeof file.path!=="string"||typeof file.content!=="string"||file.content.length>2_000_000))
    return json({ok:false,code:"invalid_sources"},409);
  if(new Set(files.map(file=>file.path)).size!==files.length)return json({ok:false,code:"duplicate_source_paths"},409);
  const pages=files.filter(file=>PageSchema.safeParse(file.path).success).map(file=>({path:file.path,label:file.path==="index.html"?"Ana sayfa":file.path.slice(0,-5).replace(/-/g," ")}));
  if(!pages.some(page=>page.path==="index.html"))return json({ok:true,state:"unavailable",reason:"website_source_missing",projectId:id,title:row.title,pages:[]});
  if(!pages.some(page=>page.path===parsedPage.data))return json({ok:false,code:"page_not_found"},404);
  try{
    const html=buildPreviewHtml(row,parsedPage.data);
    return json({ok:true,state:"ready",projectId:id,title:row.title,pages,html});
  }catch{return json({ok:false,code:"website_preview_unavailable"},503);}
}
