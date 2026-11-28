import Link from "next/link";
import {AdminShell} from "@/components/AdminShell";
import {supabaseAdmin} from "@/lib/supabase";
import {notFound} from "next/navigation";
import {PartnerPayoutDetailsForm} from "@/components/PartnerPayoutDetailsForm";
export const dynamic="force-dynamic";
export default async function PartnerDetail({params}:{params:Promise<{code:string}>}){
 const {code}=await params;if(!/^[A-Za-z0-9-]{1,80}$/.test(code))notFound();
 const db=supabaseAdmin();
 const p=await db.from("partner_profiles").select("partner_code,partner_name,email,status,commission_percent,tier,channel_type,channel_url,payout_status,payout_method,payout_email,bank_name,bank_account_holder,bank_iban,bank_swift,payout_verified_at,payout_notes,created_at,approved_at,application_id").eq("partner_code",code).maybeSingle();
 if(p.error)return <AdminShell title="İş ortağı"><p>Kayıt okunamadı.</p></AdminShell>;
 if(!p.data)notFound();const partner=p.data;
 const [links,events,ledger,application]=await Promise.all([
 db.from("partner_referral_links").select("id,link_type,path,full_url,status",{count:"exact"}).eq("partner_code",code).limit(100),
 db.from("partner_referral_events").select("id,event_type,source_path,user_id,country,created_at",{count:"exact"}).eq("partner_code",code).order("created_at",{ascending:false}).limit(100),
 db.from("partner_commission_ledger").select("id,customer_email,customer_user_id,package_name,purchase_amount,commission_percent,commission_amount,currency,payout_status,payment_reference,source,created_at",{count:"exact"}).eq("partner_code",code).order("created_at",{ascending:false}).limit(100),
 partner.application_id?db.from("partner_applications").select("status,channel_type,audience_size,main_audience,created_at").eq("id",partner.application_id).maybeSingle():Promise.resolve({data:null,error:null})
 ]);
 const date=(d:string|null)=>d?new Date(d).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"}):"—";
 const cash=(v:number|null,c:string)=>v==null?"—":String(v)+" "+c;
 const summary=new Map<string,number>();if(!ledger.error&&ledger.count===ledger.data?.length)for(const r of ledger.data??[]){if(r.commission_amount==null)continue;const k=r.currency+" / "+r.payout_status;summary.set(k,(summary.get(k)??0)+Number(r.commission_amount));}
 return <AdminShell title={partner.partner_name||code} description="Ortak hesabı, referanslar, komisyon ve ödeme kayıtları."><Link className="btn secondary" href="/admin/partners">Tüm ortaklar</Link>
 <section className="card admin-wide-card"><h2>Ortak profili</h2><div className="admin-info-grid">{[["Kod",code],["E-posta",partner.email],["Durum",partner.status],["Kayıt",date(partner.created_at)],["Onay",date(partner.approved_at)],["Komisyon",partner.commission_percent==null?"—":partner.commission_percent+"%"],["Kanal",partner.channel_type],["Başvuru",application.data?.status],["Kitle",application.data?.main_audience],["Ödeme doğrulaması",partner.payout_status]].map(([l,v])=><div key={l}><span>{l}</span><strong>{v??"—"}</strong></div>)}</div></section>
 <section className="card admin-wide-card"><h2>Komisyon özeti</h2><p>Defter kayıtları, banka ödemesi kanıtı değildir. Ödeme durumları ve para birimleri ayrı tutulur.</p>{ledger.error||ledger.count!==ledger.data?.length?<p>Tam toplam hesaplanamadı.</p>:!summary.size?<p>Komisyon kaydı yok.</p>:<div className="admin-info-grid">{[...summary].map(([k,v])=><div key={k}><span>{k}</span><strong>{v.toFixed(2)}</strong></div>)}</div>}</section>
 <section className="card admin-wide-card"><h2>Referans bağlantıları</h2>{links.error?<p>Kaynak okunamadı.</p>:links.data?.map(x=><p key={x.id}>{x.link_type} · {x.full_url||x.path} · {x.status}</p>)}</section>
 <section className="card admin-wide-card"><h2>Referans hareketleri ve üyeler</h2><p>Son 100 olay; tekil müşteri sayısı değildir.</p><div className="admin-table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Olay</th><th>Sayfa</th><th>Ülke</th><th>Üye</th></tr></thead><tbody>{events.data?.map(x=><tr key={x.id}><td>{date(x.created_at)}</td><td>{x.event_type}</td><td>{x.source_path}</td><td>{x.country}</td><td>{x.user_id?<Link href={"/admin/users/"+x.user_id}>Üye detayı</Link>:"—"}</td></tr>)}</tbody></table></div>{events.error&&<p>Kaynak okunamadı.</p>}</section>
 <section className="card admin-wide-card"><h2>Satış / komisyon defteri</h2><p>Son 100 kayıt. Kaynak ve ödeme referansı doğrulanmadan satış kesinleşmiş sayılmaz.</p><div className="admin-table-wrap"><table className="table"><thead><tr><th>Tarih</th><th>Müşteri</th><th>Paket</th><th>Satış kaydı</th><th>Komisyon</th><th>Durum / kaynak</th></tr></thead><tbody>{ledger.data?.map(x=><tr key={x.id}><td>{date(x.created_at)}</td><td>{x.customer_user_id?<Link href={"/admin/users/"+x.customer_user_id}>{x.customer_email}</Link>:x.customer_email}</td><td>{x.package_name}</td><td>{cash(x.purchase_amount,x.currency)}</td><td>{cash(x.commission_amount,x.currency)} · {x.commission_percent}%</td><td>{x.payout_status} · {x.source}<br/>{x.payment_reference??"Referans yok"}</td></tr>)}</tbody></table></div>{ledger.error&&<p>Kaynak okunamadı.</p>}</section>
 <details className="card admin-wide-card"><summary>Ödeme profili yönetimi</summary><PartnerPayoutDetailsForm partnerCode={code} initialPayoutMethod={partner.payout_method??undefined} initialPayoutEmail={partner.payout_email??undefined} initialBankName={partner.bank_name??undefined} initialBankAccountHolder={partner.bank_account_holder??undefined} initialBankIban={partner.bank_iban??undefined} initialBankSwift={partner.bank_swift??undefined} initialPayoutStatus={partner.payout_status??undefined} initialPayoutNotes={partner.payout_notes??undefined}/></details>
 <Link href="/admin/partners/operations">Manuel komisyon ve kampanya araçları</Link></AdminShell>
}
