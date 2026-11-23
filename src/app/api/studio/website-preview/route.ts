import { websiteCreditDeliveryProof } from "@/lib/assistant-work/website-paid-delivery";
import { bearerTokenFromRequest, supabaseAdmin } from '@/lib/supabase';
import { websiteView } from '@/lib/studio-agent/website-preview';
import { rateLimit } from '@/lib/security';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 try{
  const token=bearerTokenFromRequest(request);if(!token)return json({ok:false,code:'sign_in'},401);
  const db=supabaseAdmin(),auth=await db.auth.getUser(token);if(auth.error||!auth.data.user)return json({ok:false,code:'sign_in'},401);
  if(!rateLimit({key:'studio-preview:'+auth.data.user.id,limit:90,windowMs:60000}).allowed)return json({ok:false,code:'rate_limit'},429);
  const params=new URL(request.url).searchParams,id=params.get('projectId')||'',page=params.get('page')||'index.html';
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||!/^[a-z0-9][a-z0-9-]{0,79}\.html$/.test(page))return json({ok:false,code:'invalid_request'},400);
  const {data,error}=await db.from('production_requests').select('id,title,status,production_type,reserved_credits,output_json').eq('id',id).eq('user_id',auth.data.user.id).eq('production_type','website').maybeSingle();
  if(error)return json({ok:false,code:'preview_unavailable'},503);
  if(!data)return json({ok:false,code:'project_not_found'},404);
  // Preview, like ZIP delivery, requires settled ledger proof for atomically billed Websites.
  if(data.output_json?.websiteBillingMode==='atomic_v1'){
   const settlement=await db.from('website_credit_reservations').select('state,credits')
    .eq('production_id',id).eq('user_id',auth.data.user.id).maybeSingle();
   if(settlement.error || !websiteCreditDeliveryProof(data,settlement.data))
    return json({ok:false,code:'website_atomic_delivery_not_settled'},409);
  }
  return json({ok:true,projectId:id,...websiteView(data,page)});
 }catch{return json({ok:false,code:'preview_unavailable'},503);}
}
