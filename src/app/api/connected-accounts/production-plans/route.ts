import {requireVerifiedRequestUser,supabaseAdmin} from "@/lib/supabase";
import {normalizeConnectedProvider} from "@/lib/connected-accounts";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
const reply=(d:unknown,status=200)=>Response.json(d,{status,headers});
const validId=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function media(row:Record<string,unknown>){
 const o=row.output_json&&typeof row.output_json==="object"?row.output_json as Record<string,unknown>:{};
 for(const raw of [o.finalVideoUrl,o.finalImageUrl,row.delivery_link]){
 if(typeof raw!=="string"||raw.length>2048)continue;
 try{const u=new URL(raw);if(u.protocol==="https:"&&!u.username&&!u.password&&/\.(mp4|webm|png|jpe?g|webp)$/i.test(u.pathname))return {url:u.href,kind:/\.(mp4|webm)$/i.test(u.pathname)?"video":"image"};}catch{}
 }return null;
}
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get("user_id")??"";
 const auth=await requireVerifiedRequestUser(request,id);if(!auth.ok)return auth.response;
 try{const db=supabaseAdmin();const [projects,accounts,jobs]=await Promise.all([
 db.from("production_requests").select("id,title,status,production_type,delivery_link,output_json,created_at").eq("user_id",auth.user.id).in("status",["ready","completed"]).order("created_at",{ascending:false}).limit(100),
 db.from("connected_accounts").select("id,provider,display_name,status,account_type").eq("user_id",auth.user.id).order("created_at",{ascending:false}).limit(100),
 db.from("connected_account_jobs").select("id,provider,production_id,status,created_at,payload").eq("user_id",auth.user.id).eq("payload->>mode","production_publish_plan").order("created_at",{ascending:false}).limit(50)]);
 if(projects.error||accounts.error||jobs.error)throw Error("source unavailable");
 return reply({projects:(projects.data??[]).flatMap(p=>{const m=media(p);return m?[{id:p.id,title:p.title,kind:m.kind,category:p.production_type}]:[]}),accounts:accounts.data??[],jobs:(jobs.data??[]).map(j=>({id:j.id,provider:j.provider,status:j.status,created_at:j.created_at,title:j.payload?.title}))});
 }catch{return reply({error:"Publishing workspace data unavailable"},503)}
}
export async function POST(request:Request){
 const b=await request.json().catch(()=>({}));const id=String(b.user_id??"");
 const auth=await requireVerifiedRequestUser(request,id);if(!auth.ok)return auth.response;
 const production=String(b.production_id??""),accountId=String(b.account_id??""),title=String(b.title??"").trim(),caption=String(b.caption??"").trim(),target=String(b.target??"").trim();
 if(!validId(production)||!validId(accountId)||!title||title.length>150||caption.length>5000||target.length>250||b.approved!==true)return reply({error:"Choose a project, account and approve the publication plan."},400);
 try{const db=supabaseAdmin();const [p,a]=await Promise.all([
 db.from("production_requests").select("id,status,delivery_link,output_json").eq("id",production).eq("user_id",auth.user.id).maybeSingle(),
 db.from("connected_accounts").select("id,provider,account_type,status").eq("id",accountId).eq("user_id",auth.user.id).maybeSingle()]);
 if(p.error||a.error)throw Error("source unavailable");
 if(!p.data||!a.data)return reply({error:"Project or account not found"},404);
 const m=media(p.data),provider=normalizeConnectedProvider(a.data.provider);
 if(!m||!["ready","completed"].includes(p.data.status)||!provider)return reply({error:"Completed project with supported media required"},409);
 if(a.data.account_type==="commerce"&&!target)return reply({error:"Choose a store product ID"},400);
 if(["youtube","tiktok"].includes(provider)&&m.kind!=="video")return reply({error:"This target requires video in this workflow"},400);
 const job=await db.from("connected_account_jobs").insert({user_id:auth.user.id,connected_account_id:accountId,production_id:production,provider,job_type:a.data.account_type==="commerce"?"store_upload":"one_click_publish",status:"approval_required",approval_required:true,payload:{mode:"production_publish_plan",title,caption,target,mediaUrl:m.url,mediaType:m.kind,finalUserApproval:false,planApproved:true},result:{directApiCallStarted:false,note:"Saved plan only; no external publication or schedule."}}).select("id,status,provider").single();
 if(job.error)throw job.error;return reply({job:job.data,message:"Publication plan saved. No external publish was attempted."});
 }catch{return reply({error:"Publication plan could not be saved"},503)}
}
