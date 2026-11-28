import Link from "next/link";
import {AdminShell} from "@/components/AdminShell";
import {PartnerApplicationStatusActions} from "@/components/PartnerApplicationStatusActions";
import {supabaseAdmin} from "@/lib/supabase";
export const dynamic="force-dynamic";
export default async function PartnersPage(){
 const db=supabaseAdmin();
 const [profiles,applications,commissions]=await Promise.all([
  db.from("partner_profiles").select("id,partner_code,partner_name,email,status,commission_percent,payout_status,created_at",{count:"exact"}).order("created_at",{ascending:false}).limit(100),
  db.from("partner_applications").select("id,full_name,email,channel_type,application_country,status,created_at",{count:"exact"}).order("created_at",{ascending:false}).limit(100),
  db.from("partner_commission_ledger").select("id",{count:"exact",head:true})
 ]);
 const fmt=(n:number|null|undefined)=>n==null?"Veri yok":n.toLocaleString("tr-TR");
 const date=(d:string)=>new Date(d).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"});
 return <AdminShell title="Affiliate / iş ortakları" description="Gerçek ortak kayıtları, başvurular, referanslar ve komisyon takibi.">
 <div className="admin-info-grid">{[["İş ortakları",profiles.error?null:profiles.count],["Başvurular",applications.error?null:applications.count],["Komisyon kayıtları",commissions.error?null:commissions.count]].map(([label,n])=><div key={String(label)}><span>{label}</span><strong>{fmt(typeof n==="number"?n:null)}</strong></div>)}</div>
 <section className="card admin-wide-card"><h2>İş ortakları</h2><p>Her ortağı açarak referans, müşteri, satış ve komisyon geçmişini inceleyin. Son 100 kayıt gösterilir.</p>
 {profiles.error?<p>Ortak kayıtları okunamadı.</p>:!profiles.data?.length?<p>Henüz ortak kaydı yok.</p>:<div className="admin-table-wrap"><table className="table"><thead><tr><th>Ortak / kod</th><th>Katılım</th><th>Durum</th><th>Komisyon oranı</th><th>Ödeme profili</th><th>Detay</th></tr></thead><tbody>{profiles.data.map(p=><tr key={p.id}><td><strong>{p.partner_name}</strong><br/>{p.email}<br/><small>{p.partner_code}</small></td><td>{date(p.created_at)}</td><td>{p.status}</td><td>{p.commission_percent==null?"—":p.commission_percent+"%"}</td><td>{p.payout_status??"—"}</td><td><Link className="btn secondary" href={"/admin/partners/"+encodeURIComponent(p.partner_code)}>Detay</Link></td></tr>)}</tbody></table></div>}</section>
 <section className="card admin-wide-card"><h2>Başvurular</h2>{applications.error?<p>Başvurular okunamadı.</p>:!applications.data?.length?<p>Henüz başvuru yok.</p>:applications.data.map(a=><details key={a.id} className="card"><summary>{a.full_name} · {a.status} · {date(a.created_at)}</summary><p>{a.email} · {a.channel_type} · {a.application_country??"—"}</p><PartnerApplicationStatusActions applicationId={a.id} currentStatus={a.status}/></details>)}</section>
 <section className="card admin-wide-card"><h2>Diğer affiliate işlemleri</h2><p>Eski kampanya planları, manuel komisyon araçları ve örnek içerikler ayrı sayfada saklanır.</p><Link className="btn secondary" href="/admin/partners/operations">Kampanya ve işlem araçları</Link></section></AdminShell>
}
