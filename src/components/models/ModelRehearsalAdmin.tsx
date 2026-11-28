import {cookies} from "next/headers";
import {ADMIN_SESSION_COOKIE,getAdminSessionPayload,getExpectedAdminEmail} from "@/lib/admin-session";
import {supabaseAdmin} from "@/lib/supabase";
const testOrigin="https://bwzxdxqgrgbsvndinmrv.supabase.co";
export async function ModelRehearsalAdmin(){
 const jar=await cookies(),session=getAdminSessionPayload(jar.get(ADMIN_SESSION_COOKIE)?.value??""),owner=getExpectedAdminEmail();
 if(!owner||session?.email!==owner)return null;
 const enabled=process.env.VERCEL_ENV==="preview"&&process.env.MODEL_REHEARSAL_ENABLED==="true"&&(process.env.NEXT_PUBLIC_SUPABASE_URL??process.env.NEXT_PUBLIC_SUPABASE??"").trim().replace(/\/$/,"")===testOrigin&&!!process.env.MODEL_MEDIA_PILOT_USER_ID;
 const status=<p>Gerçek sağlayıcı üretimi ve müşteri kredisi işlemleri kapalı. Test cüzdanı ve FFmpeg test deseni gerçek AI üretimi değildir. Gerçek API gideri doğrulanmış sağlayıcı verisi gelene kadar bilinmiyor.</p>;
 if(!enabled)return <section className="card admin-wide-card"><h2>Üretim kuyruğu / maliyet denetimi</h2>{status}<p>Özel test pilotu etkin değil.</p></section>;
 try{
 const db=supabaseAdmin(),user=process.env.MODEL_MEDIA_PILOT_USER_ID!;
 const [jobs,runs,wallet]=await Promise.all([
 db.from("model_production_jobs").select("id,model_id,provider,estimated_micro_usd,actual_micro_usd,state").eq("user_id",user).order("created_at",{ascending:false}).limit(20),
 db.from("model_rehearsal_runs").select("job_id,state,progress,test_credits,reservation_state").eq("user_id",user).order("created_at",{ascending:false}).limit(20),
 db.from("model_rehearsal_wallets").select("balance,reserved").eq("user_id",user).maybeSingle()
 ]);
 if(jobs.error||runs.error||wallet.error)throw Error("unavailable");
 return <section className="card admin-wide-card"><h2>Üretim kuyruğu / maliyet denetimi</h2>{status}<p>Test bakiyesi: {wallet.data?.balance??"—"} · Test rezervasyonu: {wallet.data?.reserved??"—"}</p><div className="admin-table-wrap"><table className="table"><thead><tr><th>İş</th><th>Model / sağlayıcı</th><th>Tahmini API gideri</th><th>Gerçek API gideri</th><th>Test durumu</th><th>Test kredileri</th></tr></thead><tbody>{(jobs.data??[]).map(j=>{const run=runs.data?.find(r=>r.job_id===j.id);return <tr key={j.id}><td>{j.id.slice(0,8)}</td><td>{j.model_id} / {j.provider}</td><td>{j.estimated_micro_usd==null?"Bilinmiyor":"$"+(j.estimated_micro_usd/1e6).toFixed(2)}</td><td>{j.actual_micro_usd==null?"Doğrulanmadı":"$"+(j.actual_micro_usd/1e6).toFixed(6)}</td><td>{run?run.state+" · "+run.progress+"%":j.state}</td><td>{run?run.test_credits+" · "+run.reservation_state:"—"}</td></tr>})}</tbody></table></div></section>
 }catch{return <section className="card admin-wide-card"><h2>Üretim kuyruğu / maliyet denetimi</h2>{status}<p>Test kayıtları okunamadı.</p></section>}
}
