"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { websitePreviewDocument } from "@/lib/website-preview";
import { supabaseBrowser } from "@/lib/supabase";

type WebsitePlan = { projectId?: string; brief?: { businessName?: string; businessDescription?: string }; manifest?: { entryPage?: string; pages?: Array<{ slug: string; title: string }>; features?: string[] }; status?: string };
type WebsiteContent = { heroTitle: string; heroBody: string; primaryCta: string; [key: string]: unknown };
type Outputs = { previewUrl: string; zipUrl: string; sourceUrl: string; readmeUrl: string; scope?: string; plan?: WebsitePlan; content?: WebsiteContent };

export function WebsiteBuilderForm({ initialProjectId, editorOnly = false, onContentChange }: { initialProjectId?: string; editorOnly?: boolean; onContentChange?: () => void } = {}) {
  const [fields, setFields] = useState({ brief: "", siteType: "Marketing website", scope: "marketing_website", brand: "", audience: "", pages: "Home, About, Contact", features: "Responsive layout, contact form, navigation", style: "Modern, clear and conversion-focused" });
  const previewFrame = useRef<HTMLIFrameElement>(null);
  const [previewPages, setPreviewPages] = useState<Array<{ title: string; path: string }>>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [savedProjects, setSavedProjects] = useState<Array<{ id: string; title: string; status: string }>>([]);
  const [projectId, setProjectId] = useState("");
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

  useEffect(() => { if (initialProjectId) void openProject(initialProjectId); }, [initialProjectId]);
  async function listProjects() {
    setContentBusy(true);
    try { const { user, token } = await session(); const response = await fetch(`/api/websites?user_id=${encodeURIComponent(user.id)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Project list failed.'); setSavedProjects(data.websites || []); setStatus(`${data.websites?.length ?? 0} saved websites found.`); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Project list failed.'); } finally { setContentBusy(false); }
  }
  async function openProject(id: string) {
    if (!id.trim()) return; setPreviewHtml(""); setContentBusy(true);
    try { const { user, token } = await session(); const response = await fetch(`/api/website-content/${encodeURIComponent(id.trim())}?user_id=${encodeURIComponent(user.id)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Project could not be opened.'); const base = `/api/productions/${encodeURIComponent(id.trim())}/delivery`; setContent({ heroTitle: '', heroBody: '', primaryCta: '', ...data.content }); setHistory(data.history || []); setPreviewPages(Array.isArray(data.pageManifest) ? data.pageManifest : []); setOutputs({ previewUrl: `${base}?file=preview`, zipUrl: `${base}?file=zip`, sourceUrl: `${base}?file=source`, readmeUrl: `${base}?file=readme`, plan: { ...data.plan, projectId: id.trim() }, scope: data.scope }); setProjectId(id.trim()); setStatus('Saved website opened. Latest content and history loaded.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Project could not be opened.'); } finally { setContentBusy(false); }
  }
  async function downloadOutput(url: string, preview = false, anchor = "") {
    setContentBusy(true);
    try {
      const { token } = await session();
      const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Output could not be loaded.'); }
      if (preview) {
        const html = websitePreviewDocument(await response.text(), anchor);
        setPreviewHtml(html); return;
      }
      const objectUrl = URL.createObjectURL(await response.blob()); const a = document.createElement('a'); a.href = objectUrl;
      a.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'website-output';
      a.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Output failed.'); } finally { setContentBusy(false); }
  }  useEffect(() => { const onPage = (event: MessageEvent) => { if (event.source !== previewFrame.current?.contentWindow || event.data?.type !== "crelavo-website-page" || !outputs || !previewPages.some((page) => page.path === event.data.page)) return; void downloadOutput(outputs.previewUrl + "&page=" + encodeURIComponent(event.data.page), true, typeof event.data.anchor === "string" ? event.data.anchor : ""); }; window.addEventListener("message", onPage); return () => window.removeEventListener("message", onPage); }, [outputs, previewPages]);
  const faqItems = Array.isArray(content.faq) ? content.faq as Array<{ question: string; answer: string }> : [];
  function changeFaq(index: number, key: 'question' | 'answer', value: string) { setContent((current) => ({ ...current, faq: (Array.isArray(current.faq) ? current.faq : []).map((item, i) => i === index ? { ...item, [key]: value } : item) })); }
  function moveFaq(index: number, direction: number) { setContent((current) => { const items = [...(Array.isArray(current.faq) ? current.faq : [])]; const next = index + direction; if (next < 0 || next >= items.length) return current; [items[index], items[next]] = [items[next], items[index]]; return { ...current, faq: items }; }); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setOutputs(null); setPreviewHtml(""); setStatus("Building a premium static template and shaping the brief copy...");
    try {
      const { user, token } = await session();
      const response = await fetch("/api/websites/generate", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ user_id: user.id, user_email: user.email, ...fields, site_type: fields.siteType, site_scope: fields.scope, pages: list(fields.pages), features: list(fields.features) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { const missing = Array.isArray(data.missing) && data.missing.length ? ` Missing: ${data.missing.join("; ")}` : ""; throw new Error(`${data.message || data.error || "Website generation failed."}${missing}`); }
      const initialContent = { ...data.production?.output_json?.websiteContent, ...data.outputs?.content, heroTitle: data.production?.output_json?.websiteContent?.heroTitle || data.outputs?.content?.heroTitle || data.plan?.brief?.businessName || "", heroBody: data.production?.output_json?.websiteContent?.heroBody || data.outputs?.content?.heroBody || data.plan?.brief?.businessDescription || "", primaryCta: data.production?.output_json?.websiteContent?.primaryCta || data.outputs?.content?.primaryCta || "Get started" };
      setContent(initialContent); setPreviewPages(data.production?.output_json?.pageManifest || []); setHistory([]); setOutputs({ ...data.outputs, plan: data.plan, content: initialContent }); setStatus("Website generation complete. Preview, ZIP, README and plan details are ready.");
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
      setContent({ heroTitle: "", heroBody: "", primaryCta: "", ...(data.content || content) }); setHistory(data.history || []); setRevisionInstruction(""); setStatus("Natural-language revision saved."); onContentChange?.();
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
      setContent({ heroTitle: "", heroBody: "", primaryCta: "", ...(data.content || content) }); setHistory(data.history || []); setStatus(`Version ${revision} restored.`); onContentChange?.();
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
      setContent({ heroTitle: "", heroBody: "", primaryCta: "", ...(data.content || content) }); setHistory(data.history || []);
      setStatus("Website content saved. Preview and downloadable source files now use the latest copy."); onContentChange?.();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Website content update failed."); } finally { setContentBusy(false); }
  }

  return (
    <section className="service-page-shell" style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1rem" }}>
      {!editorOnly ? <><span className="badge">AI Website Builder</span>
      <h1>Generate a premium website source package from a brief</h1>
      <p>Enter the site type, brand context, target audience, pages, features and visual direction. The output includes renderable HTML/CSS/JS, a preview, a ZIP source bundle and an installation README.</p>
      <div className="mini-card" style={{ marginBottom: '1rem' }}>
        <h2>Open a saved website</h2>
        <button className="btn secondary" type="button" disabled={contentBusy} onClick={listProjects}>Load my websites</button>
        {savedProjects.length > 0 ? <label>Saved projects<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Select a website</option>{savedProjects.map((project) => <option key={project.id} value={project.id}>{project.title} — {project.status}</option>)}</select></label> : null}
        <label>Project ID<input value={projectId} onChange={(event) => setProjectId(event.target.value)} placeholder="Existing website production ID" /></label>
        <button className="btn" type="button" disabled={contentBusy || !projectId.trim()} onClick={() => openProject(projectId)}>Open website</button>
      </div>
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
      </> : null}
      {status ? <p role="status" style={{ marginTop: "1rem" }}>{status}</p> : null}
      {outputs ? (
        <>
          <div className="mini-card" style={{ marginTop: "1.5rem" }}>
            <h2>Website outputs</h2>
            <p>Scope: {outputs.scope === "website_with_admin" ? "Public website + admin starter" : "Public static website"}</p>
            {outputs.plan?.manifest ? <><p>Plan status: {outputs.plan.status || "draft"} - Entry page: {outputs.plan.manifest.entryPage || "home"}</p><small>Planned pages: {(outputs.plan.manifest.pages || []).map((page) => page.title || page.slug).join(", ") || "Home"}. Features: {(outputs.plan.manifest.features || []).join(", ") || "None specified"}.</small></> : null}
            <p><button type="button" className="btn secondary" disabled={contentBusy} onClick={() => downloadOutput(outputs.previewUrl, true)}>Open preview</button> <button type="button" className="btn secondary" disabled={contentBusy} onClick={() => downloadOutput(outputs.zipUrl)}>Download ZIP/source</button> <button type="button" className="btn secondary" disabled={contentBusy} onClick={() => downloadOutput(outputs.readmeUrl)}>README</button> <button type="button" className="btn secondary" disabled={contentBusy} onClick={() => downloadOutput(outputs.sourceUrl)}>Source guide</button></p>          </div>
          {previewPages.length ? <p>{previewPages.map((page) => <button key={page.path} disabled={contentBusy} type="button" onClick={() => downloadOutput(outputs.previewUrl + "&page=" + encodeURIComponent(page.path), true)}>{page.title}</button>)}</p> : null}
          {previewHtml ? <div className="mini-card"><h2>Sandboxed website preview</h2><button type="button" onClick={() => setPreviewHtml("")}>Close preview</button><iframe ref={previewFrame} title="Website preview" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={previewHtml} style={{ width: "100%", height: 650, border: 0 }} /></div> : null}
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
            {([['siteTitle', 'Site title'], ['tagline', 'Tagline'], ['aboutTitle', 'About title'], ['aboutBody', 'About text'], ['contactTitle', 'Contact title'], ['contactBody', 'Contact text'], ['contactEmail', 'Contact email']] as const).map(([key, label]) => (
              <label key={key}>{label}{key.endsWith('Body') ? <textarea rows={3} maxLength={2000} value={String(content[key] ?? '')} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} /> : <input type={key === 'contactEmail' ? 'email' : 'text'} maxLength={2000} value={String(content[key] ?? '')} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} />}</label>
            ))}
            {([['features', 'Feature titles'], ['featureBodies', 'Feature descriptions'], ['pricingTitles', 'Plan titles'], ['pricingBodies', 'Plan descriptions'], ['workflowTitles', 'Workflow step titles'], ['workflowBodies', 'Workflow step descriptions'], ['navLabels', 'Menu labels']] as const).map(([key, label]) => <label key={key}>{label} (one per line)<textarea rows={4} value={Array.isArray(content[key]) ? content[key].join('\n') : ''} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value.split('\n') }))} /></label>)}
            <label>Footer text<input maxLength={2000} value={String(content.footerText ?? '')} onChange={(event) => setContent((current) => ({ ...current, footerText: event.target.value }))} /></label>
            <label>SEO description<textarea rows={3} maxLength={2000} value={String(content.seoDescription ?? '')} onChange={(event) => setContent((current) => ({ ...current, seoDescription: event.target.value }))} /></label>
            <h3>Brand images</h3>
            {([['logoUrl', 'Logo HTTPS URL'], ['heroImageUrl', 'Hero image HTTPS URL']] as const).map(([key, label]) => <label key={key}>{label}<input type="url" value={String(content[key] ?? '')} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} placeholder="https://your-public-image-url" /></label>)}
            <h3>Frequently asked questions</h3>
            <small>Add, remove or reorder questions. Revision example: SSS 1 soru: Your question</small>
            {faqItems.map((item, index) => <fieldset key={index}><legend>FAQ {index + 1}</legend><label>Question<textarea maxLength={500} rows={2} value={item.question} onChange={(event) => changeFaq(index, 'question', event.target.value)} /></label><label>Answer<textarea maxLength={2000} rows={3} value={item.answer} onChange={(event) => changeFaq(index, 'answer', event.target.value)} /></label><button type="button" disabled={index === 0 || contentBusy} onClick={() => moveFaq(index, -1)}>Move up</button> <button type="button" disabled={index === faqItems.length - 1 || contentBusy} onClick={() => moveFaq(index, 1)}>Move down</button> <button type="button" disabled={contentBusy} onClick={() => setContent((current) => ({ ...current, faq: (Array.isArray(current.faq) ? current.faq : []).filter((_item, i) => i !== index) }))}>Remove question</button></fieldset>)}
            <button type="button" className="btn secondary" disabled={contentBusy || faqItems.length >= 20} onClick={() => setContent((current) => ({ ...current, faq: [...(Array.isArray(current.faq) ? current.faq : []), { question: '', answer: '' }] }))}>Add question</button>
            <h3>Contact delivery and publishing</h3>
            <label>Verified Formspree endpoint<input type="url" value={String(content.contactEndpoint ?? '')} onChange={(event) => setContent((current) => ({ ...current, contactEndpoint: event.target.value }))} placeholder="https://formspree.io/f/yourFormId" /></label>
            <small>Connect your own verified Formspree form. No API secret is stored in the source. Submission is enabled in the published source only; preview submissions stay blocked.</small>
            <label>Target domain<input value={String(content.publishDomain ?? '')} onChange={(event) => setContent((current) => ({ ...current, publishDomain: event.target.value.toLowerCase() }))} placeholder="www.your-domain.com" /></label>
            <p>Saving a domain does not deploy or change DNS. The ZIP includes PUBLISHING-GUIDE.md with hosting, DNS and HTTPS steps.</p>
            <p><a href="https://formspree.io/forms" target="_blank" rel="noreferrer">Formspree forms</a> · <a href="https://vercel.com/new" target="_blank" rel="noreferrer">Create a hosting project</a></p>
            <button className="btn" type="submit" disabled={contentBusy}>{contentBusy ? "Saving..." : "Save content"}</button>
          </form>
          {history.length > 0 ? <div className="mini-card" style={{ marginTop: "1rem" }}><h2>Version history</h2>{history.slice().reverse().map((item) => <div key={`${item.revision}-${item.createdAt}`} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: ".5rem" }}><span>Version {item.revision} - {item.source || "manual"}</span><button className="btn secondary" type="button" disabled={contentBusy} onClick={() => rollback(item.revision)}>Restore</button></div>)}</div> : null}
        </>
      ) : null}
    </section>
  );
}
