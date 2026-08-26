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
    setStatus("Generating source files with the real AI provider...");
    try {
      const supabase = supabaseBrowser();
      const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
      const user = userData.user;
      if (!user) throw new Error("You must sign in to generate a website.");
      const response = await fetch("/api/websites/generate", { method: "POST", headers: { "Content-Type": "application/json", ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}) }, body: JSON.stringify({ user_id: user.id, user_email: user.email, ...fields, site_type: fields.siteType, pages: list(fields.pages), features: list(fields.features) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || (data.error === "provider_required" ? "Real AI provider is not configured: OPENAI_API_KEY is required." : data.error || "Website generation failed."));
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
    <h1>Generate real website source files from a brief</h1>
    <p>Enter the site type, brand context, target audience, pages, features and visual direction. The output is not just text; it includes renderable HTML/CSS/JS, a preview, a ZIP source bundle and an installation README.</p>
    <form onSubmit={submit} className="form-grid">
      <label>Website brief<textarea required minLength={20} rows={5} value={fields.brief} onChange={(event) => update("brief", event.target.value)} placeholder="What does it offer, what problem does it solve and what should the user do?" /></label>
      <label>Site type<input required value={fields.siteType} onChange={(event) => update("siteType", event.target.value)} /></label>
      <label>Brand / product<input required value={fields.brand} onChange={(event) => update("brand", event.target.value)} /></label>
      <label>Target audience<input required value={fields.audience} onChange={(event) => update("audience", event.target.value)} /></label>
      <label>Pages <small>comma-separated</small><input value={fields.pages} onChange={(event) => update("pages", event.target.value)} /></label>
      <label>Features <small>comma-separated</small><input value={fields.features} onChange={(event) => update("features", event.target.value)} /></label>
      <label>Style / visual direction<input required value={fields.style} onChange={(event) => update("style", event.target.value)} /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Generating..." : "Generate real website"}</button>
    </form>
    {status ? <p role="status" style={{ marginTop: "1rem" }}>{status}</p> : null}
    {outputs ? <div className="mini-card" style={{ marginTop: "1.5rem" }}><h2>Website outputs</h2><p><a className="btn secondary" href={outputs.previewUrl} target="_blank" rel="noreferrer">Open preview</a> <a className="btn secondary" href={outputs.zipUrl}>Download ZIP/source</a> <a className="btn secondary" href={outputs.readmeUrl}>README</a></p><small>Source guide: <a href={outputs.sourceUrl}>{outputs.sourceUrl}</a></small></div> : null}
  </section>;
}
