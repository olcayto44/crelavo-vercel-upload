import Link from "next/link";
import {cookies} from "next/headers";
import {AdminShell} from "@/components/AdminShell";
import {AdminLoginPanel} from "@/components/AdminLoginPanel";
import {ADMIN_SESSION_COOKIE,getAdminSessionPayload,getExpectedAdminEmail} from "@/lib/admin-session";
import {isOwnerMonitorAllowed} from "@/lib/studio-agent/reconciliation-monitor";
import {supabaseAdmin} from "@/lib/supabase";
import styles from "./overview.module.css";
export const dynamic="force-dynamic";
type Count={count:number|null;error:unknown};
async function count(q:()=>PromiseLike<Count>){try{const r=await q();return !r.error&&typeof r.count==="number"?r.count:null}catch{return null}}
async function sum(q:()=>PromiseLike<{data:any[]|null;error:unknown;count:number|null}>,field:string){try{const r=await q();if(r.error||!r.data||r.count!==r.data.length||r.data.some(x=>x[field]===null||x[field]===""||!Number.isFinite(Number(x[field]))))return null;return r.data.reduce((s,x)=>s+Number(x[field]),0)}catch{return null}}
function format(n:number|null,currency=false){return n===null?"Veri yok":new Intl.NumberFormat("tr-TR",currency?{style:"currency",currency:"USD"}:{maximumFractionDigits:0}).format(n)}
const quick=[["Yeni video","/admin/showcase-videos"],["Kredi yükle","/admin/credits"],["Yeni blog","/admin/blog"],["Üye yönet","/admin/users"],["Gelen kutusu","/admin/inbox"],["SEO / GEO","/admin/seo-workbench"],["Affiliate","/admin/partners"],["Ödemeler","/admin/studio-reconciliation"],["API durumu","/admin/providers"]];
export default async function AdminPage({searchParams}:{searchParams:Promise<{period?:string}>}){
 const session=getAdminSessionPayload((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
 if(!session)return <AdminLoginPanel/>;
 if(!isOwnerMonitorAllowed(session.email,getExpectedAdminEmail()))return <AdminShell title="Yönetim merkezi"><p>Finansal genel bakış yalnızca site sahibine açıktır. Yetkili bölümleri menüden açabilirsiniz.</p></AdminShell>;
 const p=(await searchParams).period;const period=p==="7"||p==="30"?p:"1";
 const now=new Date(),day=new Date(now.getTime()+3*3600000);day.setUTCHours(0,0,0,0);const since=new Date(day.getTime()-3*3600000-(Number(period)-1)*86400000).toISOString();
 const cutoff=new Date(now.getTime()-60000).toISOString();const db=()=>supabaseAdmin();
 const [members,total,production,purchases,revenue,paid,affiliate,pending,live]=await Promise.all([
 count(()=>db().from("profiles").select("*",{count:"exact",head:true}).gte("created_at",since)),
 count(()=>db().from("profiles").select("*",{count:"exact",head:true})),
 count(()=>db().from("production_requests").select("*",{count:"exact",head:true}).gte("created_at",since)),
 sum(()=>db().from("credit_events").select("amount",{count:"exact"}).eq("type","purchase").gte("created_at",since).limit(1000),"amount"),
 sum(()=>db().from("payment_fulfillments").select("amount_usd",{count:"exact"}).eq("status","fulfilled").gte("created_at",since).limit(1000),"amount_usd"),
 count(()=>db().from("payment_fulfillments").select("*",{count:"exact",head:true}).eq("status","fulfilled").gte("created_at",since)),
 count(()=>db().from("partner_applications").select("*",{count:"exact",head:true}).gte("created_at",since)),
 count(()=>db().from("payment_fulfillments").select("*",{count:"exact",head:true}).eq("status","pending_user")),
 count(()=>db().from("presence").select("*",{count:"exact",head:true}).gte("seen_at",cutoff))
 ]);
 const cards=[["Anlık presence kayıtları",format(live),"Son 60 saniye; tekil kişi değildir"],["Yeni üyeler",format(members),"Seçili dönem"],["Toplam hesap",format(total),"Tüm dönemler"],["Whop kayıtlı brüt tutar",format(revenue,true),"Fulfilled kayıtları; banka mutabakatı değil"],["Satın alma kredi kaydı",format(purchases),"Purchase olayları; doğrulama gerekli"],["Üretim talepleri",format(production),"Seçili dönem"],["Tamamlanan ödeme kaydı",format(paid),"Seçili dönem"],["Yeni affiliate başvurusu",format(affiliate),"Seçili dönem"],["Bekleyen ödeme eşleşmesi",format(pending),"Tüm dönemler"]];
 return <AdminShell title="Genel bakış" description="Crelavo işletme ve operasyon merkezi"><div className={styles.toolbar}><span>İstanbul saati · Whop aktif</span><nav aria-label="Rapor dönemi">{[["1","Bugün"],["7","7 gün"],["30","30 gün"]].map(([v,l])=><Link key={v} className={period===v?styles.active:undefined} href={"/admin?period="+v}>{l}</Link>)}</nav></div><div className={styles.metrics}>{cards.map(([label,value,detail])=><article key={label} className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div><section className="card admin-wide-card"><h2>Hızlı işlemler</h2><div className={styles.quick}>{quick.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</div></section><section className="card admin-wide-card"><h2>Veri bağlantısı ve finansal güvenilirlik</h2><p>Günlük tekil ziyaret, abonelik süresi, net kâr, gerçek API maliyeti ve ülke geçmişi için doğrulanmış kaynak bağlantısı gerekli. Bu değerler tahmin edilmez. Toplamlar 1.000 kaydı aşarsa eksik toplam gösterilmez. Ödeme ve kredi kayıtları ayrı sorgulardır.</p><Link href="/admin/studio-reconciliation">Mutabakat ayrıntıları</Link> · <Link href="/admin/live">Canlı trafik</Link></section></AdminShell>
}
