import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
export async function GET(request:Request){
 const reply=(body:Record<string,unknown>,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
 const token=bearerTokenFromRequest(request);if(!token)return reply({error:"Sign in required."},401);
 try{
 const db=supabaseAdmin();const {data,error}=await db.auth.getUser(token);const user=data?.user;
 if(error||!user?.id)return reply({error:"Sign in required."},401);
 if(!user.email||!(user.email_confirmed_at||user.confirmed_at))return reply({error:"Verify your email."},403);
 const section=new URL(request.url).searchParams.get("section");
 if(section==="payments"){
  const {data:rows,error:readError}=await db.from("payment_fulfillments").select("id,whop_payment_id,product_title,amount_usd,credits,kind,status,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
  if(readError)return reply({error:"Payment history unavailable."},503);return reply({payments:rows??[]});
 }
 if(section==="partner"){
  const {data:profile,error:profileError}=await db.from("partner_profiles").select("partner_code,status,commission_percent,tier").eq("email",user.email.trim().toLowerCase()).maybeSingle();
  if(profileError)return reply({error:"Partner information unavailable."},503);
  if(!profile)return reply({partner:null,commissions:[]});
  const {data:rows,error:readError}=await db.from("partner_commission_ledger").select("id,package_name,commission_amount,currency,payout_status,created_at").eq("partner_code",profile.partner_code).order("created_at",{ascending:false}).limit(50);
  if(readError)return reply({error:"Commission history unavailable."},503);
  return reply({partner:profile,commissions:rows??[]});
 }
 return reply({error:"Unknown account section."},400);
 }catch{return reply({error:"Account information unavailable."},503);}
}
