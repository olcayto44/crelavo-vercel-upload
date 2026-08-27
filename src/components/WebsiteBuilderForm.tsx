"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type Outputs = { previewUrl: string; zipUrl: string; sourceUrl: string; readmeUrl: string; scope?: string };

export function WebsiteBuilderForm() {
  const [fields, setFields] = useState({ brief: "", siteType: "Marketing website", scope: "marketing_website", brand: "", audience: "", pages: "Home, About, Contact", features: "Responsive layout, contact form, navigation", style: "Modern, clear and conversion-focused" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const update = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  const scopeLabel = fields.scope === "website_with_admin" ? "Public website + admin starter" : "Public static website";
  const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setOutputs(null);
    setStatus("Building a premium static template and shaping the brief copy...");
    try {
      const supabase = supabaseBrowser();
      const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
      const user = userData.user;
      if (!user) throw new Error("You must sign in to generate a website.");
      const response = await fetch("/api/websites/generate", { method: "POST", headers: { "Content-Type": "application/json", ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}) }, body: JSON.stringify({ user_id: user.id, user_email: user.email, ...fields, site_type: fields.siteType, site_scope: fields.scope, pages: list(fields.pages), features: list(fields.features) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const missing = Array.isArray(data.missing) && data.missing.length ? ` Missing: ${data.missing.join("; ")}` : "";
        throw new Error(`${data.message || (data.error === "provider_required" ? "Real AI provider is not configured: OPENAI_API_KEY is required." : data.error || "Website generation failed.")}${missing}`);
      }
      setOutputs(data.outputs);
      setStatus("Website generation complete. Preview, ZIP and README links are ready.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Website generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="service-page-shell" style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1rem" }}>
    <span className="badge">AI Website Builder</span>
    <h1>Generate a premium website source package from a brief</h1>
    <p>Enter the site type, brand context, target audience, pages, features and visual direction. A fixed premium template guarantees the visual structure; available AI may refine only structured copy. The output includes renderable HTML/CSS/JS, a preview, a ZIP source bundle and an installation README.</p>
    <form onSubmit={submit} className="form-grid">
      <label>Website brief<textarea required minLength={20} rows={5} value={fields.brief} onChange={(event) => update("brief", event.target.value)} placeholder="What does it offer, what problem does it solve and what should the user do?" /></label>
      <label>Site type<input required value={fields.siteType} onChange={(event) => update("siteType", event.target.value)} /></label>
       <label>Site scope<select value={fields.scope} onChange={(event) => update("scope", event.target.value)}><option value="marketing_website">Public static website — no admin panel</option><option value="website_with_admin">Public website + admin panel source starter</option></select><small>{scopeLabel}. Admin files are included only when selected.</small></label>
       <label>Brand / product<input required value={fields.brand} onChange={(event) => update("brand", event.target.value)} /></label>
      <label>Target audience<input required value={fields.audience} onChange={(event) => update("audience", event.target.value)} /></label>
      <label>Pages <small>comma-separated</small><input value={fields.pages} onChange={(event) => update("pages", event.target.value)} /></label>
      <label>Features <small>comma-separated</small><input value={fields.features} onChange={(event) => update("features", event.target.value)} /></label>
      <label>Style / visual direction<input required value={fields.style} onChange={(event) => update("style", event.target.value)} /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Building..." : "Generate website package"}</button>
    </form>
    {status ? <p role="status" style={{ marginTop: "1rem" }}>{status}</p> : null}
    {outputs ? <div className="mini-card" style={{ marginTop: "1.5rem" }}><h2>Website outputs</h2><p>Scope: {outputs.scope === "website_with_admin" ? "Public website + admin starter" : "Public static website"}</p><p><a className="btn secondary" href={outputs.previewUrl} target="_blank" rel="noreferrer">Open preview</a> <a className="btn secondary" href={outputs.zipUrl}>Download ZIP/source</a> <a className="btn secondary" href={outputs.readmeUrl}>README</a></p><small>Source guide: <a href={outputs.sourceUrl}>{outputs.sourceUrl}</a></small></div> : null}
  </section>;
}
