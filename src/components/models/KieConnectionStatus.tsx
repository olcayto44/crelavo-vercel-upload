import {estimateKieMagiDraft} from "@/lib/model-kie-task-contract";
import {cookies} from "next/headers";
import {ADMIN_SESSION_COOKIE,getAdminSessionPayload,getExpectedAdminEmail} from "@/lib/admin-session";
export async function KieConnectionStatus(){
 const jar=await cookies(),owner=getExpectedAdminEmail(),session=getAdminSessionPayload(jar.get(ADMIN_SESSION_COOKIE)?.value);
 if(!owner||session?.email!==owner)return null;
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feat/crelavo-premium-v3-20261128")return <section className="card admin-wide-card"><h2>Kie.ai bağlantısı</h2><p>Yalnızca entegrasyon test dalında etkin.</p></section>;
 const key=process.env.KIE_API_KEY?.trim();
 let status="API anahtarı tanımlı değil",balance:number|null=null;
 if(key){try{
 const r=await fetch("https://api.kie.ai/api/v1/chat/credit",{headers:{Authorization:"Bearer "+key,Accept:"application/json"},redirect:"error",cache:"no-store",signal:AbortSignal.timeout(8000)});
 if(!r.ok)status="HTTP bağlantısı reddedildi";
 else{const d=await r.json();if(d.code===200&&typeof d.data==="number"&&Number.isFinite(d.data)&&d.data>=0){status="API bağlantısı doğrulandı";balance=d.data}else status=d.code===401?"Anahtar reddedildi":"Sağlayıcı yanıtı doğrulanamadı"}
 }catch{status="Sağlayıcıya erişilemedi"}}
 return <section className="card admin-wide-card"><h2>Kie.ai — sağlayıcı bakiyesi</h2><p>{status}</p>{balance!==null&&<p><strong>{new Intl.NumberFormat("tr-TR",{maximumFractionDigits:4}).format(balance)} Kie kredisi</strong></p>}<h3>MAGI-2 — onaysız maliyet tahmini</h3><p>28.11.2026 hesap ekranı baz alınmıştır; güncel tarifeyi ve fatura tutarını garanti etmez.</p><div className="admin-table-wrap"><table className="table"><thead><tr><th>Süre</th><th>Kie kredisi (tahmin)</th><th>USD (tahmin)</th></tr></thead><tbody>{[4,10,15,30].map(s=>{const q=estimateKieMagiDraft(s)!;return <tr key={s}><td>{s} sn</td><td>{q.milliKieCredits/1000}</td><td>${(q.microUsd/1000000).toFixed(3)}</td></tr>})}</tbody></table></div><p>Salt okunur bakiye sorgusu. Ücretli üretim kapalı; ticari izin ve maliyet mutabakatı gerekli.</p></section>;
}
