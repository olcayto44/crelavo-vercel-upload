"use client";

import { useWorkspaceLanguage } from "@/components/assistant-work/useWorkspaceLanguage";
import { FormEvent, useEffect, useRef, useState } from "react";
import { websitePreviewDocument } from "@/lib/website-preview";
import { supabaseBrowser } from "@/lib/supabase";

type WebsitePlan = { editableDesign?: unknown; projectId?: string; brief?: { businessName?: string; businessDescription?: string }; manifest?: { entryPage?: string; pages?: Array<{ slug: string; title: string }>; features?: string[] }; status?: string };
type WebsiteContent = { heroTitle: string; heroBody: string; primaryCta: string; [key: string]: unknown };
type Outputs = { previewUrl: string; zipUrl: string; sourceUrl: string; readmeUrl: string; scope?: string; plan?: WebsitePlan; content?: WebsiteContent };

export function WebsiteBuilderForm({ initialProjectId, editorOnly = false, onContentChange }: { initialProjectId?: string; editorOnly?: boolean; onContentChange?: () => void } = {}) {
  const { t } = useWorkspaceLanguage();
  const [fields, setFields] = useState({ brief: "", siteType: "Marketing website", scope: "marketing_website", brand: "", audience: "", pages: "Home, About, Contact", features: "Responsive layout, contact information, navigation", style: "Modern, clear and conversion-focused", locale: "en" });
  const previewFrame = useRef<HTMLIFrameElement>(null);
  const [previewPages, setPreviewPages] = useState<Array<{ title: string; path: string }>>([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [savedProjects, setSavedProjects] = useState<Array<{ id: string; title: string; status: string }>>([]);
  const [projectId, setProjectId] = useState("");
  const [statusVariables, setStatusVariables] = useState<Record<string, string | number>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [contentBusy, setContentBusy] = useState(false);
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [history, setHistory] = useState<Array<{ revision: number; createdAt: string; source?: string }>>([]);
  const [focusVersionHistory, setFocusVersionHistory] = useState(false);
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const [content, setContent] = useState<WebsiteContent>({ heroTitle: "", heroBody: "", primaryCta: "" });
  const update = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  function notifyStudioUpdated(id: string | undefined) {
    if (window.parent === window || !id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return;
    window.parent.postMessage({ type: "crelavo-studio-website-updated", productionId: id }, window.location.origin);
  }

  const scopeLabel = fields.scope === "website_with_admin" ? t("Public website + admin starter") : t("Public static website");
  const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  async function session() {
    const supabase = supabaseBrowser();
    const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
    if (!userData.user) throw new Error("You must sign in to continue.");
    return { user: userData.user, token: sessionData.session?.access_token };
  }

  useEffect(() => { if (initialProjectId) void openProject(initialProjectId); }, [initialProjectId]);
  useEffect(() => {
    if (initialProjectId) return;
    const openSaved = (event: MessageEvent) => {
      if (window.parent === window || event.origin !== window.location.origin ||
        event.source !== window.parent || event.data?.type !== "crelavo-studio-website-open") return;
      const id = event.data.productionId;
      if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return;
      setFocusVersionHistory(event.data.panel === "history");
      void openProject(id);
    };
    window.addEventListener("message", openSaved);
    return () => window.removeEventListener("message", openSaved);
  }, [initialProjectId]);

  // Studio V2 owns the source brief. Transfer it over same-origin postMessage
  // instead of embedding customer text in a URL, history entry or server logs.
  useEffect(() => {
    if (editorOnly || initialProjectId) return;
    const receiveBrief = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent ||
          event.data?.type !== "crelavo-studio-website-brief") return;
      const item = event.data.brief;
      if (!item || typeof item !== "object" || Array.isArray(item)) return;
      const bounded = (value: unknown, limit: number) =>
        typeof value === "string" ? value.trim().slice(0, limit) : "";
      const entries = (value: unknown) => Array.isArray(value)
        ? value.filter((part): part is string => typeof part === "string").slice(0, 12).map(part => part.trim().slice(0, 80)).filter(Boolean).join(", ")
        : bounded(value, 600);
      setFields(current => ({
        ...current,
        brief: bounded(item.brief, 6000) || current.brief,
        brand: bounded(item.brand, 160) || current.brand,
        audience: bounded(item.audience, 400) || current.audience,
        siteType: bounded(item.siteType, 120) || current.siteType,
        style: bounded(item.style, 240) || current.style,
        pages: entries(item.pages) || current.pages,
        features: entries(item.features) || current.features
      }));
      setStatus("Studio V2 brief loaded. Review the fields before generating your website.");
    };
    window.addEventListener("message", receiveBrief);
    return () => window.removeEventListener("message", receiveBrief);
  }, [editorOnly, initialProjectId]);

  useEffect(() => {
    if (!focusVersionHistory || !projectId) return;
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById("website-version-history");
      if (heading) {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
        setFocusVersionHistory(false);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [focusVersionHistory, projectId, history]);
  async function listProjects() {
    setContentBusy(true);
    try { const { user, token } = await session(); const response = await fetch(`/api/websites?user_id=${encodeURIComponent(user.id)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Project list failed.'); setSavedProjects(data.websites || []); setStatusVariables({ count: data.websites?.length ?? 0 }); setStatus("{count} saved websites found."); }
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
    setBusy(true); setStatus("Checking the website price and available credits...");
    try {
      const { user, token } = await session();
      const headers = { "Content-Type":"application/json", Authorization:"Bearer "+token };
      const post = async (body:Record<string,unknown>) => {
        const r=await fetch("/api/websites/generate",{method:"POST",headers,body:JSON.stringify({user_id:user.id,...body})});
        const d=await r.json().catch(()=>({}));
        if(r.status===402){const message="Yetersiz kredi. Üretim başlamadı. Gereken: "+(d.required??d.need??"—")+" · Bakiye: "+(d.balance??"—");if(window.confirm(message+" — Kredi yükleme sayfasını açmak ister misiniz?"))window.open("/dashboard/payment","_blank","noopener,noreferrer");throw Error(message);}
        if(!r.ok||!d.ok)throw Error(d.message||d.code||d.error||"Website production unavailable.");
        return d;
      };
      const quote=await post({action:"quote",...fields,site_type:fields.siteType,site_scope:fields.scope,pages:list(fields.pages),features:list(fields.features)});
      if(!Number.isSafeInteger(quote.credits)||quote.credits<=0||!quote.productionId||!quote.planHash)throw Error("Website quote not verified.");
      if(!window.confirm("Website production: "+quote.credits+" credits. Start production?")){setStatus("Production cancelled. No credits spent.");return;}
      setProjectId(quote.productionId);setStatus("AI website production in progress...");
      const data=await post({action:"generate",productionId:quote.productionId,planHash:quote.planHash,confirmProduction:true});
      if(!["ready","already_ready"].includes(data.state)||data.productionId!==quote.productionId)throw Error("Production outcome not confirmed. Open the saved project before trying again.");
      await openProject(quote.productionId);
      if(window.parent!==window)window.parent.postMessage({type:"crelavo-studio-website-created",productionId:quote.productionId},window.location.origin);
      notifyStudioUpdated(quote.productionId);
    } catch(error){setStatus(error instanceof Error?error.message:"Website generation failed.");}finally{setBusy(false);}
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
      setContent({ heroTitle: "", heroBody: "", primaryCta: "", ...(data.content || content) }); setHistory(data.history || []); setRevisionInstruction(""); setStatus("Natural-language revision saved."); onContentChange?.(); notifyStudioUpdated(outputs?.plan?.projectId);
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
      setContent({ heroTitle: "", heroBody: "", primaryCta: "", ...(data.content || content) }); setHistory(data.history || []); setStatusVariables({ version: revision }); setStatus("Version {version} restored."); onContentChange?.(); notifyStudioUpdated(outputs?.plan?.projectId);
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
      setStatus("Website content saved. Preview and downloadable source files now use the latest copy."); onContentChange?.(); notifyStudioUpdated(outputs?.plan?.projectId);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Website content update failed."); } finally { setContentBusy(false); }
  }

  return (
    <section className="service-page-shell" style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1rem" }}>
      {!editorOnly ? <><span className="badge">{t("AI Website Builder")}</span>
      <h1>{t("Generate a premium website source package from a brief")}</h1>
      <p>{t("Enter the site type, brand context, target audience, pages, features and visual direction. The output includes responsive website source, a preview, a ZIP source bundle and an installation README.")}</p>
      <div className="mini-card" style={{ marginBottom: '1rem' }}>
        <h2>{t("Open a saved website")}</h2>
        <button className="btn secondary" type="button" disabled={contentBusy} onClick={listProjects}>{t("Load my websites")}</button>
        {savedProjects.length > 0 ? <label>{t("Saved projects")}<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">{t("Select a website")}</option>{savedProjects.map((project) => <option key={project.id} value={project.id}>{project.title} — {t(project.status)}</option>)}</select></label> : null}
        <label>{t("Project ID")}<input value={projectId} onChange={(event) => setProjectId(event.target.value)} placeholder={t("Existing website production ID")} /></label>
        <button className="btn" type="button" disabled={contentBusy || !projectId.trim()} onClick={() => openProject(projectId)}>{t("Open website")}</button>
      </div>
      <form onSubmit={submit} className="form-grid">
        <label>{t("Website brief")}<textarea required minLength={20} rows={5} value={fields.brief} onChange={(event) => update("brief", event.target.value)} placeholder={t("What does it offer, what problem does it solve and what should the user do?")} /></label>
        <label>{t("Site type")}<input required value={fields.siteType} onChange={(event) => update("siteType", event.target.value)} /></label>
        <label>{t("Site scope")}<select value={fields.scope} onChange={(event) => update("scope", event.target.value)}><option value="marketing_website">{t("Public static website - no admin panel")}</option></select><small>{t(scopeLabel)}</small></label>
        <label>{t("Brand / product")}<input required value={fields.brand} onChange={(event) => update("brand", event.target.value)} /></label>
        <label>{t("Target audience")}<input required value={fields.audience} onChange={(event) => update("audience", event.target.value)} /></label>
        <label>{t("Pages")}<small>{t("comma-separated")}</small><input value={fields.pages} onChange={(event) => update("pages", event.target.value)} /></label>
        <label>{t("Features")}<small>{t("comma-separated")}</small><input value={fields.features} onChange={(event) => update("features", event.target.value)} /></label>
        <label>Website language<select value={fields.locale} onChange={event=>update("locale",event.target.value)}><option value="en">English</option><option value="tr">Türkçe</option><option value="de">Deutsch</option><option value="fr">Français</option><option value="zh-Hans">中文</option></select></label>
        <label>{t("Style / visual direction")}<input required value={fields.style} onChange={(event) => update("style", event.target.value)} /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? t("Building...") : t("Generate website package")}</button>
      </form>
      </> : null}
      {status ? <p role="status" style={{ marginTop: "1rem" }}>{t(status, statusVariables)}</p> : null}
      {outputs?.plan?.editableDesign && outputs.plan.projectId ? <p><a className="btn" href={"/dashboard/website-draft?projectId="+encodeURIComponent(outputs.plan.projectId)}>{t("Open visual website editor")}</a></p> : null}
      {outputs ? (
        <>
          <div className="mini-card" style={{ marginTop: "1.5rem" }}>
            <h2>{t("Website outputs")}</h2>
            <p>{t("Scope:")}{outputs.scope === "website_with_admin" ? t("Public website + admin starter") : t("Public static website")}</p>
            {outputs.plan?.manifest ? <><p>{t("Plan status:")}{t(outputs.plan.status || "draft")}{t("- Entry page:")}{outputs.plan.manifest.entryPage || "home"}</p><small>{t("Planned pages:")}{(outputs.plan.manifest.pages || []).map((page) => page.title || page.slug).join(", ") || "Home"}{t(". Features:")}{(outputs.plan.manifest.features || []).join(", ") || t("None specified")}.</small></> : null}
            <p><button type="button" className="btn secondary" disabled={contentBusy} onClick={() => downloadOutput(outputs.previewUrl, true)}>{t("Open preview")}</button> <button type="button" className="btn secondary" disabled={contentBusy} onClick={() => downloadOutput(outputs.zipUrl)}>{t("Download ZIP/source")}</button> <button type="button" className="btn secondary" disabled={contentBusy} onClick={() => downloadOutput(outputs.readmeUrl)}>README</button> <button type="button" className="btn secondary" disabled={contentBusy} onClick={() => downloadOutput(outputs.sourceUrl)}>{t("Source guide")}</button></p>          </div>
          {previewPages.length ? <p>{previewPages.map((page) => <button key={page.path} disabled={contentBusy} type="button" onClick={() => downloadOutput(outputs.previewUrl + "&page=" + encodeURIComponent(page.path), true)}>{page.title}</button>)}</p> : null}
          {previewHtml ? <div className="mini-card"><h2>{t("Sandboxed website preview")}</h2><button type="button" onClick={() => setPreviewHtml("")}>{t("Close preview")}</button><iframe ref={previewFrame} title={t("Website preview")} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={previewHtml} style={{ width: "100%", height: 650, border: 0 }} /></div> : null}
          {!outputs.plan?.editableDesign && <>
          <form onSubmit={applyRevision} className="mini-card" style={{ marginTop: "1rem" }}>
            <h2>{t("Revise with natural language")}</h2>
            <textarea rows={3} value={revisionInstruction} onChange={(event) => setRevisionInstruction(event.target.value)} placeholder={t("Example: Change the hero title to Start faster.")} />
            <button className="btn" type="submit" disabled={contentBusy || !revisionInstruction.trim()}>{contentBusy ? t("Applying...") : t("Apply revision")}</button>
          </form>
          <form onSubmit={saveContent} className="mini-card" style={{ marginTop: "1rem" }}>
            <h2>{t("Edit website content")}</h2>
            <label>{t("Hero title")}<input value={content.heroTitle} onChange={(event) => setContent((current) => ({ ...current, heroTitle: event.target.value }))} /></label>
            <label>{t("Hero text")}<textarea rows={4} value={content.heroBody} onChange={(event) => setContent((current) => ({ ...current, heroBody: event.target.value }))} /></label>
            <label>{t("Primary button")}<input value={content.primaryCta} onChange={(event) => setContent((current) => ({ ...current, primaryCta: event.target.value }))} /></label>
            {([['siteTitle', 'Site title'], ['tagline', 'Tagline'], ['aboutTitle', 'About title'], ['aboutBody', 'About text'], ['contactTitle', 'Contact title'], ['contactBody', 'Contact text'], ['contactEmail', 'Contact email']] as const).map(([key, label]) => (
              <label key={key}>{t(label)}{key.endsWith('Body') ? <textarea rows={3} maxLength={2000} value={String(content[key] ?? '')} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} /> : <input type={key === 'contactEmail' ? 'email' : 'text'} maxLength={2000} value={String(content[key] ?? '')} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} />}</label>
            ))}
            {([['features', 'Feature titles'], ['featureBodies', 'Feature descriptions'], ['pricingTitles', 'Plan titles'], ['pricingBodies', 'Plan descriptions'], ['workflowTitles', 'Workflow step titles'], ['workflowBodies', 'Workflow step descriptions'], ['navLabels', 'Menu labels']] as const).map(([key, label]) => <label key={key}>{t(label)}{t("(one per line)")}<textarea rows={4} value={Array.isArray(content[key]) ? content[key].join('\n') : ''} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value.split('\n') }))} /></label>)}
            <label>{t("Footer text")}<input maxLength={2000} value={String(content.footerText ?? '')} onChange={(event) => setContent((current) => ({ ...current, footerText: event.target.value }))} /></label>
            <label>{t("SEO description")}<textarea rows={3} maxLength={2000} value={String(content.seoDescription ?? '')} onChange={(event) => setContent((current) => ({ ...current, seoDescription: event.target.value }))} /></label>
            <h3>{t("Brand images")}</h3>
            {([['logoUrl', 'Logo HTTPS URL'], ['heroImageUrl', 'Hero image HTTPS URL']] as const).map(([key, label]) => <label key={key}>{t(label)}<input type="url" value={String(content[key] ?? '')} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} placeholder="https://your-public-image-url" /></label>)}
            <h3>{t("Frequently asked questions")}</h3>
            <small>{t("Add, remove or reorder questions. Revision example: SSS 1 soru: Your question")}</small>
            {faqItems.map((item, index) => <fieldset key={index}><legend>{t("FAQ")}{index + 1}</legend><label>{t("Question")}<textarea maxLength={500} rows={2} value={item.question} onChange={(event) => changeFaq(index, 'question', event.target.value)} /></label><label>{t("Answer")}<textarea maxLength={2000} rows={3} value={item.answer} onChange={(event) => changeFaq(index, 'answer', event.target.value)} /></label><button type="button" disabled={index === 0 || contentBusy} onClick={() => moveFaq(index, -1)}>{t("Move up")}</button> <button type="button" disabled={index === faqItems.length - 1 || contentBusy} onClick={() => moveFaq(index, 1)}>{t("Move down")}</button> <button type="button" disabled={contentBusy} onClick={() => setContent((current) => ({ ...current, faq: (Array.isArray(current.faq) ? current.faq : []).filter((_item, i) => i !== index) }))}>{t("Remove question")}</button></fieldset>)}
            <button type="button" className="btn secondary" disabled={contentBusy || faqItems.length >= 20} onClick={() => setContent((current) => ({ ...current, faq: [...(Array.isArray(current.faq) ? current.faq : []), { question: '', answer: '' }] }))}>{t("Add question")}</button>
            <h3>{t("Contact delivery and publishing")}</h3>
            <label>{t("Verified Formspree endpoint")}<input type="url" value={String(content.contactEndpoint ?? '')} onChange={(event) => setContent((current) => ({ ...current, contactEndpoint: event.target.value }))} placeholder="https://formspree.io/f/yourFormId" /></label>
            <small>{t("Connect your own verified Formspree form. No API secret is stored in the source. Submission is enabled in the published source only; preview submissions stay blocked.")}</small>
            <label>{t("Target domain")}<input value={String(content.publishDomain ?? '')} onChange={(event) => setContent((current) => ({ ...current, publishDomain: event.target.value.toLowerCase() }))} placeholder="www.your-domain.com" /></label>
            <p>{t("Saving a domain does not deploy or change DNS. The ZIP includes PUBLISHING-GUIDE.md with hosting, DNS and HTTPS steps.")}</p>
            <p><a href="https://formspree.io/forms" target="_blank" rel="noreferrer">{t("Formspree forms")}</a> · <a href="https://vercel.com/new" target="_blank" rel="noreferrer">{t("Create a hosting project")}</a></p>
            <button className="btn" type="submit" disabled={contentBusy}>{contentBusy ? t("Saving...") : t("Save content")}</button>
          </form>
          {history.length > 0 ? <div id="website-version-history" className="mini-card" style={{ marginTop: "1rem" }}><h2>{t("Version history")}</h2>{history.slice().reverse().map((item) => <div key={`${item.revision}-${item.createdAt}`} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: ".5rem" }}><span>{t("Version")}{item.revision} - {item.source || "manual"}</span><button className="btn secondary" type="button" disabled={contentBusy} onClick={() => rollback(item.revision)}>{t("Restore")}</button></div>)}</div> : null}
          </>}
        </>
      ) : null}
    </section>
  );
}
