import {createClient} from "@supabase/supabase-js";
import {timingSafeEqual} from "node:crypto";
import {ADMIN_SESSION_COOKIE,adminSessionCookieHeader,clearAdminSessionCookieHeader,createAdminSessionToken,getExpectedAdminEmail,getExpectedAdminPassword,getExpectedAdminUsername,getAdminSessionPayload,getCookieValue} from "@/lib/admin-session";
import {supabaseAdmin} from "@/lib/supabase";
import {clientIpFromRequest,rateLimit,rateLimitResponse} from "@/lib/security";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
function settings(){
 const email=getExpectedAdminEmail(),password=getExpectedAdminPassword();
 const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE||"").trim();
 const key=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"").trim();
 const session=Boolean((process.env.ADMIN_SESSION_SECRET||process.env.ADMIN_API_TOKEN||process.env.NEXTAUTH_SECRET||"").trim());
 const envLogin=Boolean(email.includes("@")&&password),supabaseLogin=Boolean(email.includes("@")&&url&&key&&process.env.SUPABASE_SERVICE_ROLE_KEY);
 return {email,password,url,key,ready:session&&(envLogin||supabaseLogin),envLogin,supabaseLogin};
}
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&x.length>0&&timingSafeEqual(x,y)}
function validOrigin(r:Request){const origin=r.headers.get("origin");return !origin||origin===new URL(r.url).origin}
export async function GET(request:Request){
 const config=settings();
 if(!config.ready){
  // Only booleans, never environment values, credentials, account identifiers or tokens.
  console.warn("admin_login_config_check",JSON.stringify({
   ownerEmailConfigured:config.email.includes("@"),
   passwordConfigured:Boolean(config.password),
   sessionSigningConfigured:Boolean((process.env.ADMIN_SESSION_SECRET||process.env.ADMIN_API_TOKEN||process.env.NEXTAUTH_SECRET||"").trim()),
   supabaseUrlConfigured:Boolean(config.url),
   supabasePublicKeyConfigured:Boolean(config.key),
   supabaseServiceRoleConfigured:Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY||"").trim())
  }));
 }
 let session=null;try{session=getAdminSessionPayload(getCookieValue(request.headers.get("cookie"),ADMIN_SESSION_COOKIE))}catch{}
 return reply({authenticated:Boolean(session&&session.email===config.email),available:config.ready,revision:"admin-login-v3"});
}
export async function POST(request:Request){
 if(!validOrigin(request))return reply({error:"Invalid request origin."},403);
 const limit=rateLimit({key:"admin-login:"+clientIpFromRequest(request),limit:8,windowMs:60_000});
 if(!limit.allowed)return rateLimitResponse(limit.resetAt);
 const config=settings();
 if(!config.ready){console.warn("admin_login_configuration_unavailable");return reply({error:"Yönetici girişi bu dağıtımda yapılandırılmamış. Vercel ortam ayarlarını kontrol edin.",code:"admin_configuration_unavailable"},503);}
 try{
 const body=await request.json().catch(()=>({}));
 const identifier=String(body.identifier??body.email??body.username??"").trim().toLowerCase(),password=String(body.password??"");
 if(!identifier||!password||identifier.length>254||password.length>1024)return reply({error:"Yönetici kullanıcı adı/e-posta veya parola hatalı."},401);
 const owner=identifier===config.email||identifier===getExpectedAdminUsername();
 const success=()=>{const token=createAdminSessionToken(config.email);return token?Response.json({ok:true},{headers:{...headers,"Set-Cookie":adminSessionCookieHeader(token)}}):reply({error:"Yönetici oturumu oluşturulamadı."},503)};
 if(owner&&config.envLogin&&equal(password,config.password))return success();
 if(owner&&config.supabaseLogin){
 const client=createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.signInWithPassword({email:config.email,password});
 const user=data.user;
 if(!error&&user?.id&&user.email?.toLowerCase()===config.email){
 const {data:profile,error:profileError}=await supabaseAdmin().from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(!profileError&&String(profile?.role??"").toLowerCase()==="admin"&&user.app_metadata?.role==="admin")return success();
 console.warn("admin_login_owner_role_verification_failed");
 return reply({error:"Parola doğrulandı ancak yönetici yetkisi doğrulanamadı. Site sahibi rolü kontrol edilmeli.",code:"admin_role_unverified"},403);
 }
 }
 return reply({error:"Yönetici kullanıcı adı/e-posta veya parola hatalı. Test ortamı giriş bilgilerinizi kontrol edin."},401);
 }catch{console.warn("admin_login_request_failed");return reply({error:"Yönetici giriş hizmetine erişilemedi."},503)}
}
export async function DELETE(request:Request){if(!validOrigin(request))return reply({error:"Invalid request origin."},403);return Response.json({ok:true},{headers:{...headers,"Set-Cookie":clearAdminSessionCookieHeader()}})}
