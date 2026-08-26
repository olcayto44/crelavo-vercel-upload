"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type Outputs = { previewUrl: string; zipUrl: string; sourceUrl: string; readmeUrl: string };

export function WebsiteBuilderForm() {
  const [fields, setFields] = useState({ brief: "", siteType: "Marketing website", brand: "", audience: "", pages: "Home, About, Contact", features: "Responsive layout, contact form, navigation", style: "Modern, clear and conversion-focused" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const update = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setOutputs(null);
    setStatus("Gerçek AI provider ile kaynak dosyaları üretiliyor...");
    try {
      const supabase = supabaseBrowser();
      const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
      const user = userData.user;
      if (!user) throw new Error("Website üretimi için giriş yapmalısınız.");
      const response = await fetch("/api/websites/generate", { method: "POST", headers: { "Content-Type": "application/json", ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}) }, body: JSON.stringify({ user_id: user.id, user_email: user.email, ...fields, pages: list(fields.pages), features: list(fields.features) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || (data.error === "provider_required" ? "Gerçek AI provider yapılandırılmamış: OPENAI_API_KEY gerekli." : data.error || "Website üretimi başarısız."));
      setOutputs(data.outputs);
      setStatus("Website üretimi tamamlandı. Önizleme, ZIP ve README bağlantıları hazır.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Website üretimi başarısız.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="service-page-shell" style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1rem" }}>
    <span className="badge">AI Website Builder</span>
    <h1>Brief’ten gerçek website kaynak dosyaları üret</h1>
    <p>Site türünü, marka bağlamını, hedef kitleyi, sayfaları, özellikleri ve stil yönünü gir. Çıktı yalnızca metin değil; render edilebilir HTML/CSS/JS, önizleme, ZIP source bundle ve kurulum README’sidir.</p>
    <form onSubmit={submit} className="form-grid">
      <label>Website brief<textarea required minLength={20} rows={5} value={fields.brief} onChange={(event) => update("brief", event.target.value)} placeholder="Ne sunuyor, hangi problemi çözüyor, kullanıcı ne yapmalı?" /></label>
      <label>Site türü<input required value={fields.siteType} onChange={(event) => update("siteType", event.target.value)} /></label>
      <label>Marka / ürün<input required value={fields.brand} onChange={(event) => update("brand", event.target.value)} /></label>
      <label>Hedef kitle<input required value={fields.audience} onChange={(event) => update("audience", event.target.value)} /></label>
      <label>Sayfalar <small>virgülle ayır</small><input value={fields.pages} onChange={(event) => update("pages", event.target.value)} /></label>
      <label>Özellikler <small>virgülle ayır</small><input value={fields.features} onChange={(event) => update("features", event.target.value)} /></label>
      <label>Stil / görsel yön<input required value={fields.style} onChange={(event) => update("style", event.target.value)} /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Üretiliyor..." : "Gerçek website üret"}</button>
    </form>
    {status ? <p role="status" style={{ marginTop: "1rem" }}>{status}</p> : null}
    {outputs ? <div className="mini-card" style={{ marginTop: "1.5rem" }}><h2>Website çıktıları</h2><p><a className="btn secondary" href={outputs.previewUrl} target="_blank" rel="noreferrer">Önizlemeyi aç</a> <a className="btn secondary" href={outputs.zipUrl}>ZIP/source indir</a> <a className="btn secondary" href={outputs.readmeUrl}>README</a></p><small>Source guide: <a href={outputs.sourceUrl}>{outputs.sourceUrl}</a></small></div> : null}
  </section>;
}
