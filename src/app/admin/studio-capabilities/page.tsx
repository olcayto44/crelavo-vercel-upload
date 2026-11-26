import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";
import { AdminLoginPanel } from "@/components/AdminLoginPanel";
import { AdminShell } from "@/components/AdminShell";
import { listProductionCapabilities } from "@/lib/studio-agent/capability-registry";

export const dynamic="force-dynamic";
export default async function StudioCapabilitiesPage(){
 const session=(await cookies()).get(ADMIN_SESSION_COOKIE)?.value??"";
 if(!verifyAdminSessionToken(session))return <AdminLoginPanel/>;
 const categories=listProductionCapabilities();
 const evidenceLabels={catalog_only:"Katalog / doğrulanmadı",existing_api_unbound:"Mevcut API / merkezi bağlantı yok",local_editor_implemented:"Yerel editör kodu mevcut",provider_adapter_coded:"Sağlayıcı adaptörü kodlandı / canlı test bekliyor",planned:"Planlanan"};
 return <AdminShell title="Studio Production Engine" description="37 kategorinin kaynak sözleşmeleri, yerel araçları ve merkezi üretim engelleri.">
  <section className="card admin-wide-card">
   <div className="admin-info-grid"><div><span>Kategori kapsamı</span><strong>{categories.length}/37</strong></div><div><span>Merkezi üretim hazır</span><strong>0/37</strong></div><div><span>Mod</span><strong>Salt okunur</strong></div></div>
   <p>Bu ekran kaynak kodu sözleşmelerini gösterir; sağlayıcı testi, gerçek ücret, hesap bakiyesi veya başarılı üretim kanıtı değildir. Buradan üretim başlatılamaz.</p>
  </section>
  {categories.map((category,index)=><details className="card admin-wide-card" key={category.id}>
   <summary><strong>{String(index+1).padStart(2,"0")} — {category.label}</strong> · {category.fields.length} alan · {category.packs.length} paket · Merkezi üretim kapalı</summary>
   <p>Kimlik: {category.id} · Faturalama: {category.billing} · Adaptör: {category.specialistAdapterStatus}</p>
   <h3>Brief alanları</h3><ul>{category.fields.map(field=><li key={field.id}>{field.label} ({field.required?"Zorunlu":"İsteğe bağlı"}; {field.kind}){field.serverOnly?" — yalnız sunucu":""}{field.options.length?" — "+field.options.join(", "):""}{field.mediaKinds?.length?" — "+field.mediaKinds.join(", "):""}</li>)}</ul>
   <h3>Katalog paketleri (tarife doğrulaması değildir)</h3><ul>{category.packs.map(pack=><li key={pack.id}>{pack.id}: {pack.priceLabel??(pack.credits===undefined?"Doğrulanmadı":pack.credits+" kredi")}</li>)}</ul>
   <h3>Yetenek durumu</h3><ul>{category.operations.map(op=><li key={op.id}>{op.label??op.id} — {evidenceLabels[op.evidence]}</li>)}</ul>
   <h3>Planlanan teslimatlar</h3><ul>{category.proposedOutputs.map(output=><li key={output}>{output}</li>)}</ul>
   <h3>Kalite kontrolleri</h3><ul>{category.qualityChecks.map(check=><li key={check}>{check}</li>)}</ul>
   <h3>Üretim önkoşulları</h3><ul>{category.releaseGates.map(gate=><li key={gate}>{gate}</li>)}</ul>
  </details>)}
 </AdminShell>;
}
