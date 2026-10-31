"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type WebsitePlan = { projectId?: string; brief?: { businessName?: string; businessDescription?: string }; manifest?: { entryPage?: string; pages?: Array<{ slug: string; title: string }>; features?: string[] }; status?: string };
type WebsiteContent = { heroTitle: string; heroBody: string; primaryCta: string; [key: string]: unknown };
type Outputs = { previewUrl: string; zipUrl: string; sourceUrl: string; readmeUrl: string; scope?: string; plan?: WebsitePlan; content?: WebsiteContent };

export function WebsiteBuilderForm() {
  const [fields, setFields] = useState({ brief: "", siteType: "Marketing website", scope: "marketing_website", brand: "", audience: "", pages: "Home, About, Contact", features: "Responsive layout, contact form, navigation", style: "Modern, clear and conversion-focused" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [contentBusy, setContentBusy] = useState(false);
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [history, setHistory] = useState<Array<{ revision: number; createdAt: string; source?: string }>>([]);
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const [content, setContent] = useState<WebsiteContent>({ heroTitle: "", heroBody: "", primaryCta: "" });
  const update = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  const scopeLabel = fields.scope === "website_with_admin" ? "Public website + admin starter" : "Public static website";
  const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  async function session() {
    const supabase = supabaseBrowser();
    const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
    if (!userData.user) throw new Error("You must sign in to continue.");
    return { user: userData.user, token: sessionData.session?.access_token };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setOutputs(null); setStatus("Building a premium static template and shaping the brief copy...");
    try {
      const { user, token } = await session();
      const response = await fetch("/api/websites/generate", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ user_id: user.id, user_email: user.email, ...fields, site_type: fields.siteType, site_scope: fields.scope, pages: list(fields.pages), features: list(fields.features) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { const missing = Array.isArray(data.missing) && data.missing.length ? ` Missing: ${data.missing.join("; ")}` : ""; throw new Error(`${data.message || data.error || "Website generation failed."}${missing}`); }
      const initialContent = { heroTitle: data.plan?.brief?.businessName || data.outputs?.content?.heroTitle || "", heroBody: data.plan?.brief?.businessDescription || data.outputs?.content?.heroBody || "", primaryCta: data.outputs?.content?.primaryCta || "Get started" };
      setContent(initialContent); setHistory([]); setOutputs({ ...data.outputs, plan: data.plan, content: initialContent }); setStatus("Website generation complete. Preview, ZIP, README and plan details are ready.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Website generation failed."); } finally { setBusy(false); }
  }

  async function applyRevision(event: FormEvent) {
    event.preventDefault();
    if (!outputs?.plan?.projectId || !revisionInstruction.trim()) return;
    setContentBusy(true); setStatus("Applying natural-language revision...");
    try {
      const { user, token } = await session();
      const response = await fetch(`/api/website-content/${outputs.plan.projectId}`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ user_id: user.id, action: "revision", instruction: revisionInstruction }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "Revision failed.");
      setContent(data.content || content); setHistory(data.history || []); setRevisionInstruction(""); setStatus("Natural-language revision saved.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Revision failed."); } finally { setContentBusy(false); }
  }

  async function rollback(revision: number) {
    if (!outputs?.plan?.projectId) return;
    setContentBusy(true); setStatus("Restoring selected version...");
    try {
      const { user, token } = await session();
      const response = await fetch(`/api/website-content/${outputs.plan.projectId}`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ user_id: user.id, action: "rollback", revision }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "Rollback failed.");
      setContent(data.content || content); setHistory(data.history || []); setStatus(`Version ${revision} restored.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Rollback failed."); } finally { setContentBusy(false); }
  }
  async function saveContent(event: FormEvent) {
    event.preventDefault();
    if (!outputs?.plan?.projectId) return;
    setContentBusy(true); setStatus("Saving website content...");
    try {
      const { user, token } = await session();
      const response = await fetch(`/api/website-content/${outputs.plan.projectId}`, { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ user_id: user.id, content }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "Website content update failed.");
      setStatus("Website content saved. Regenerate the package to include the latest copy in downloadable source files.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Website content update failed."); } finally { setContentBusy(false); }
  }

  return (
    <section className="service-page-shell" style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1rem" }}>
      <span className="badge">AI Website Builder</span>
      <h1>Generate a premium website source package from a brief</h1>
      <p>Enter the site type, brand context, target audience, pages, features and visual direction. The output includes renderable HTML/CSS/JS, a preview, a ZIP source bundle and an installation README.</p>
      <form onSubmit={submit} className="form-grid">
        <label>Website brief<textarea required minLength={20} rows={5} value={fields.brief} onChange={(event) => update("brief", event.target.value)} placeholder="What does it offer, what problem does it solve and what should the user do?" /></label>
        <label>Site type<input required value={fields.siteType} onChange={(event) => update("siteType", event.target.value)} /></label>
        <label>Site scope<select value={fields.scope} onChange={(event) => update("scope", event.target.value)}><option value="marketing_website">Public static website - no admin panel</option><option value="website_with_admin">Public website + admin panel source starter</option></select><small>{scopeLabel}. Admin files are included only when selected.</small></label>
        <label>Brand / product<input required value={fields.brand} onChange={(event) => update("brand", event.target.value)} /></label>
        <label>Target audience<input required value={fields.audience} onChange={(event) => update("audience", event.target.value)} /></label>
        <label>Pages <small>comma-separated</small><input value={fields.pages} onChange={(event) => update("pages", event.target.value)} /></label>
        <label>Features <small>comma-separated</small><input value={fields.features} onChange={(event) => update("features", event.target.value)} /></label>
        <label>Style / visual direction<input required value={fields.style} onChange={(event) => update("style", event.target.value)} /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Building..." : "Generate website package"}</button>
      </form>
      {status ? <p role="status" style={{ marginTop: "1rem" }}>{status}</p> : null}
      {outputs ? (
        <>
          <div className="mini-card" style={{ marginTop: "1.5rem" }}>
            <h2>Website outputs</h2>
            <p>Scope: {outputs.scope === "website_with_admin" ? "Public website + admin starter" : "Public static website"}</p>
            {outputs.plan?.manifest ? <><p>Plan status: {outputs.plan.status || "draft"} - Entry page: {outputs.plan.manifest.entryPage || "home"}</p><small>Planned pages: {(outputs.plan.manifest.pages || []).map((page) => page.title || page.slug).join(", ") || "Home"}. Features: {(outputs.plan.manifest.features || []).join(", ") || "None specified"}.</small></> : null}
            <p><a className="btn secondary" href={outputs.previewUrl} target="_blank" rel="noreferrer">Open preview</a> <a className="btn secondary" href={outputs.zipUrl}>Download ZIP/source</a> <a className="btn secondary" href={outputs.readmeUrl}>README</a></p>
            <small>Source guide: <a href={outputs.sourceUrl}>{outputs.sourceUrl}</a></small>
          </div>
          <form onSubmit={applyRevision} className="mini-card" style={{ marginTop: "1rem" }}>
            <h2>Revise with natural language</h2>
            <textarea rows={3} value={revisionInstruction} onChange={(event) => setRevisionInstruction(event.target.value)} placeholder="Example: Change the hero title to Start faster." />
            <button className="btn" type="submit" disabled={contentBusy || !revisionInstruction.trim()}>{contentBusy ? "Applying..." : "Apply revision"}</button>
          </form>
          <form onSubmit={saveContent} className="mini-card" style={{ marginTop: "1rem" }}>
            <h2>Edit website content</h2>
            <label>Hero title<input value={content.heroTitle} onChange={(event) => setContent((current) => ({ ...current, heroTitle: event.target.value }))} /></label>
            <label>Hero text<textarea rows={4} value={content.heroBody} onChange={(event) => setContent((current) => ({ ...current, heroBody: event.target.value }))} /></label>
            <label>Primary button<input value={content.primaryCta} onChange={(event) => setContent((current) => ({ ...current, primaryCta: event.target.value }))} /></label>
            <button className="btn" type="submit" disabled={contentBusy}>{contentBusy ? "Saving..." : "Save content"}</button>
          </form>
          {history.length > 0 ? <div className="mini-card" style={{ marginTop: "1rem" }}><h2>Version history</h2>{history.slice().reverse().map((item) => <div key={`${item.revision}-${item.createdAt}`} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: ".5rem" }}><span>Version {item.revision} - {item.source || "manual"}</span><button className="btn secondary" type="button" disabled={contentBusy} onClick={() => rollback(item.revision)}>Restore</button></div>)}</div> : null}
        </>
      ) : null}
    </section>
  );
}
