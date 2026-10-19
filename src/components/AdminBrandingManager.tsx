"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";
import { defaultBrandConfig, validateBrandConfig, type BrandConfig } from "@/lib/brand-config";
export function AdminBrandingManager() {
  const [branding, setBranding] = useState<BrandConfig>(defaultBrandConfig);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabaseBrowser().auth.getUser().then(({data}) => setAdminEmail(data.user?.email ?? "")).catch(() => {}); }, []);
  async function load() {
    setBusy(true);
    try { const r = await fetch("/api/admin/branding", { headers: adminApiHeaders(adminEmail, adminToken), cache: "no-store" }); const result = await r.json(); if (!r.ok) throw new Error(result.error || "Logo yüklenemedi."); setBranding(result.branding); setMessage("Kayıtlı logo yüklendi."); } catch (e) { setMessage(e instanceof Error ? e.message : "Bağlantı hatası."); } finally { setBusy(false); }
  }
  async function save() {
    setBusy(true);
    try { const value = validateBrandConfig(branding); const r = await fetch("/api/admin/branding", { method: "POST", headers: { ...adminApiHeaders(adminEmail, adminToken), "Content-Type": "application/json" }, body: JSON.stringify({ branding: value, adminEmail, adminToken }) }); const result = await r.json(); if (!r.ok) throw new Error(result.error || "Kaydedilemedi."); setBranding(result.branding); window.dispatchEvent(new Event("crelavo:branding-updated")); setMessage("Logo kalıcı olarak kaydedildi. Siteyi yenileyerek kontrol edebilirsiniz."); } catch (e) { setMessage(e instanceof Error ? e.message : "Kayıt hatası."); } finally { setBusy(false); }
  }
  return <section className="card" style={{maxWidth: 900}}><h2>Logo ve Marka</h2><p>Bu alan yalnızca site logosunu değiştirir. Dosya seçimi önce önizlenir; Kaydet düğmesine basılmadan yayınlanmaz.</p>
    <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
    <div className="field"><label htmlFor="brand-logo-url">Logo adresi</label><input id="brand-logo-url" value={branding.logoUrl} onChange={e => setBranding({...branding,logoUrl:e.target.value})} /></div>
    <div className="field"><label htmlFor="brand-logo-file">Logo dosyası yükle — PNG, JPG, WebP; en fazla 512 KB</label><input id="brand-logo-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file=e.target.files?.[0]; if (!file) return; if(file.size>512*1024 || !["image/png","image/jpeg","image/webp"].includes(file.type)){setMessage("PNG, JPG veya WebP seçin; dosya en fazla 512 KB olabilir.");return;} const reader=new FileReader();reader.onload=()=>{try{const next=validateBrandConfig({...branding,logoUrl:String(reader.result),fit:"contain"});setBranding(next);setMessage("Yeni logo önizlemede; yayınlamak için Kaydet düğmesine basın.");}catch(error){setMessage(error instanceof Error?error.message:"Dosya geçersiz.");}};reader.onerror=()=>setMessage("Dosya okunamadı.");reader.readAsDataURL(file); }} /></div>
    <div className="field"><label htmlFor="brand-logo-alt">Logo açıklaması</label><input id="brand-logo-alt" maxLength={100} value={branding.alt} onChange={e=>setBranding({...branding,alt:e.target.value})} /></div>
    <div className="field"><label htmlFor="brand-logo-fit">Görsel yerleşimi</label><select id="brand-logo-fit" value={branding.fit} onChange={e=>setBranding({...branding,fit:e.target.value as BrandConfig["fit"]})}><option value="cover">Yatay alana doldur (seçilen logo)</option><option value="contain">Görselin tamamını göster</option></select></div>
    <div style={{padding:24,background:"#07111f",borderRadius:12,marginBlock:20}}><img src={branding.logoUrl} alt={branding.alt} width={300} height={90} style={{display:"block",maxWidth:"100%",width:300,height:90,objectFit:branding.fit,objectPosition:"50% 48%",mixBlendMode:"lighten"}} /></div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}><button type="button" className="btn" disabled={busy} onClick={load}>Kayıtlı logoyu yükle</button><button type="button" className="btn" disabled={busy} onClick={save}>Logoyu kaydet</button><button type="button" className="btn" disabled={busy} onClick={()=>{setBranding(defaultBrandConfig);setMessage("Başlangıç logosu önizlemede. Uygulamak için kaydedin.");}}>Başlangıç logosuna dön</button><Link href="/" target="_blank">Siteyi kontrol et →</Link></div><p role="status" aria-live="polite">{message}</p>
  </section>;
}
