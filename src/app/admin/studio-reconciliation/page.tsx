import {cookies} from "next/headers";
import Link from "next/link";
import {ADMIN_SESSION_COOKIE,getAdminSessionPayload,getExpectedAdminEmail} from "@/lib/admin-session";
import {AdminLoginPanel} from "@/components/AdminLoginPanel";
import {AdminShell} from "@/components/AdminShell";
import {supabaseAdmin} from "@/lib/supabase";
import {isOwnerMonitorAllowed,readReconciliationMetrics} from "@/lib/studio-agent/reconciliation-monitor";

export const dynamic="force-dynamic";
export default async function StudioReconciliationPage(){
 const session=getAdminSessionPayload((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
 if(!session)return <AdminLoginPanel/>;
 if(!isOwnerMonitorAllowed(session.email,getExpectedAdminEmail()))return <AdminShell title="Studio mutabakat"><section className="card admin-wide-card"><p>Bu finansal izleme ekranı yalnızca site sahibi içindir.</p></section></AdminShell>;
 const metrics=await readReconciliationMetrics(async metric=>{
  const {count,error}=await supabaseAdmin().from(metric.table).select("*",{count:"exact",head:true}).eq(metric.column,metric.value).abortSignal(AbortSignal.timeout(5000));
  return {count,error};
 });
 const observedAt=new Date().toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"});
 return <AdminShell title="Studio ödeme ve üretim mutabakatı" description="Salt okunur, site sahibine özel işlem durumları.">
  <section className="card admin-wide-card">
   <div className="admin-info-grid"><div><span>Aktif ödeme altyapısı</span><strong>Whop</strong></div><div><span>Stripe</span><strong>Pasif / mevcut altyapı</strong></div><div><span>İzleme zamanı (TR)</span><strong>{observedAt}</strong></div><div><span>Yetki</span><strong>Salt okunur</strong></div></div>
   <p>Bu sayfa ödeme başlatmaz, kredi yüklemez, iade yapmaz ve üretim tetiklemez. Kayıt sayıları ayrı sorgulardan gelir; tek bir tutarlı finansal anlık görüntü veya sağlayıcı doğrulaması değildir.</p>
  </section>
  <section className="card admin-wide-card">
   <h2>Mevcut veritabanı kayıtları</h2>
   <div className="admin-info-grid">{metrics.map(metric=><div key={metric.id}><span>{metric.label}</span><strong>{metric.state==="observed"?metric.count.toLocaleString("tr-TR"):"Veri alınamadı"}</strong><small>{metric.state==="observed"?"Kayıt sayısı (tüm dönemler)":"Sorgu doğrulanamadı; sıfır kabul edilmez"}</small></div>)}</div>
   <p>Whop fulfillment kayıtları muhasebe denetim görünümüdür; tek başına tahsilat veya doğru kredi yükleme kanıtı değildir. İade/itiraz inceleme bildirimleri otomatik kredi kesintisi veya kesin para iadesi kanıtı değildir. Website kayıtları mevcut rezervasyon defterinin durumudur.</p>
   <Link href="/admin/finance">Finans ekranına git</Link>
  </section>
  <section className="card admin-wide-card">
   <h2>Merkezi üretim altyapısı — yayına hazır olmayan bölümler</h2>
   <div className="admin-info-grid"><div><span>Whop bekleyen ödeme kurtarma</span><strong>İzole test aşaması</strong><small>Canlı kayıt takibi bağlı değil</small></div><div><span>Image üretim maliyeti / kredi defteri</span><strong>İzole test aşaması</strong><small>Canlı kayıt takibi bağlı değil</small></div><div><span>Gerçek sağlayıcı maliyeti</span><strong>Doğrulanmadı</strong><small>Fatura ve kullanım kanıtı gerekli</small></div></div>
   <p>Burada test sonuçları canlı işlem sayısı olarak gösterilmez. Gerçek Whop doğrulaması, eski kredi yazma yollarının uyumu, yetkili proje/onay bağlantısı ve kontrollü üretim testi tamamlanmadan yeni ücretli üretim açılmayacaktır.</p>
   <Link href="/admin/studio-capabilities">37 kategori yetenek ve önkoşulları</Link>
  </section>
 </AdminShell>;
}
