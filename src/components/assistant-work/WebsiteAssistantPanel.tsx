"use client";
import { useEffect, useState } from "react";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { supabaseBrowser } from "@/lib/supabase";
import { WebsiteBuilderForm } from "@/components/WebsiteBuilderForm";
import type { ProductionSelection } from "@/components/assistant/AssistantPreProduction";
type Brief = { brand: string; brief: string; audience: string; siteType: string; style: string; pages: string[]; features: string[]; locale: string };
type Project = { productionId: string; status: string; outputs: { previewUrl: string; deliveryZipUrl: string }; website: { brief: Brief; messages: Array<{ role: string; content: string }>; planHash: string; approvedHash?: string; missing: string[]; unsupported: string[]; credits: number | null; packId: string; pageManifest?: Array<{ title: string; path: string }> } };
export function WebsiteAssistantPanel({ selection, request }: { selection?: ProductionSelection; request: (url: string, init: RequestInit) => Promise<Response> }) {
  const packs = getCategory('website')?.packs ?? [];
  const [packId, setPackId] = useState(selection?.packId || packs[0]?.id || '');
  const [brief, setBrief] = useState<Brief>({ brand: '', brief: '', audience: '', siteType: selection?.extras.site_type || '', style: selection?.extras.design_style || '', pages: [], features: [], locale: 'en' });
  const [activeId, setActiveId] = useState("");
  const [project, setProject] = useState<Project | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [dirty, setDirty] = useState(true); const [notice, setNotice] = useState('Describe your website. We will prepare a brief before any credit-priced production.');
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]); const [userId, setUserId] = useState('');
  useEffect(() => { void supabaseBrowser().auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); }); }, []);
  useEffect(() => { if (!userId) return; const saved = window.sessionStorage.getItem("crelavo-website-project:" + userId); if (saved) void perform("website_open", saved); }, [userId]);
  async function perform(action: string, id?: string) {
    setBusy(true);
    try {
      const response = await request('/api/assistant-work', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'website', type: 'Website', prompt: message || (action === 'revise' ? 'Please review the website brief and ask about missing information.' : ''), action, render: action === 'render', productionId: id || activeId || project?.productionId, websiteBrief: action === 'revise' ? brief : undefined, packId, planHash: project?.website.planHash, extras: selection?.extras ?? {} }) });
      const data = await response.json(); if (data.productionId) { setActiveId(data.productionId); if (userId) window.sessionStorage.setItem("crelavo-website-project:" + userId, data.productionId); } if (!response.ok || !data.ok) { if (data.productionId && !project) setNotice('Project ' + data.productionId + ': ' + (data.message || data.code)); throw new Error(data.message || data.code || 'Website request failed.'); }
      setProject(data); setBrief(data.website.brief); setPackId(data.website.packId || packId); setDirty(false); setMessage('');
      setNotice(action === 'render' ? 'Website generated. Preview, revisions and ZIP use this same project.' : action === 'website_approve' ? 'Plan approved on the server. Production can now start.' : data.body || 'Website project opened.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Website request failed.'); } finally { setBusy(false); }
  }
  async function loadProjects() { setBusy(true); try { const response = await request('/api/websites?user_id=' + encodeURIComponent(userId), { method: 'GET' }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setProjects(data.websites ?? []); } catch (error) { setNotice(error instanceof Error ? error.message : 'Project list failed.'); } finally { setBusy(false); } }
  const reviewed = project && !dirty && !project.website.missing.length && !project.website.unsupported.length;
  const approved = reviewed && project.website.approvedHash === project.website.planHash;
  return <section style={{ position: 'fixed', inset: 0, zIndex: 60, overflow: 'auto', background: '#0b1020', color: '#f5f7ff', padding: '24px max(18px,4vw)' }}>
    <header><a href="/dashboard">← Dashboard</a><h1>Website assistant</h1><p>Conversation → Website Brief → approved plan → shared Website Builder → preview, revisions and source ZIP.</p><p>This phase produces static websites. Working accounts, databases, checkout and admin systems are not included.</p></header>
    <p role="status">{notice}</p>
    <p>{project ? <button type="button" disabled={busy} onClick={() => perform("website_open", project.productionId)}>Refresh project</button> : null} <button type="button" disabled={busy || project?.status === "generating" || project?.status === "awaiting_payment"} onClick={() => { setActiveId(""); setProject(null); setBrief({ brand: "", brief: "", audience: "", siteType: "", style: "", pages: [], features: [], locale: "en" }); setDirty(true); setMessage(""); if (userId) window.sessionStorage.removeItem("crelavo-website-project:" + userId); setNotice("New Website Brief. No production has started."); }}>New website project</button></p>
    {project?.status === "generating" ? <p><button type="button" disabled={busy} onClick={() => perform("website_retry")}>Recover an interrupted generation after 3 minutes</button></p> : null}
    <details><summary>Open an existing project</summary><button type="button" disabled={!userId || busy} onClick={loadProjects}>Load my websites</button>{projects.map((item) => <button key={item.id} type="button" disabled={busy} onClick={() => perform('website_open', item.id)}>{item.title}</button>)}<p>Older standalone/legacy projects can be opened in <a href="/ai-website-builder">Website Builder</a> using their project ID.</p></details>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 24 }}>
      <section><h2>Conversation</h2><div aria-live="polite">{project?.website.messages.map((item, i) => <p key={i} style={{ padding: 12, background: item.role === 'assistant' ? '#17253b' : '#1c1d2d', whiteSpace: 'pre-wrap' }}><strong>{item.role === 'assistant' ? 'Assistant' : 'You'}:</strong> {item.content}</p>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); void perform('revise'); }}><label>Your message<textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe the business, audience, pages and visual direction. You can ask questions before approving." /></label><button type="submit" disabled={busy || !message.trim()}>Send message and update brief — no credit charge</button></form></section>
      <section><h2>Website Brief and plan</h2><form onSubmit={(event) => { event.preventDefault(); void perform('revise'); }}>
      {([['brand', 'Brand / business'], ['brief', 'Business description and site goal'], ['audience', 'Target audience'], ['siteType', 'Site type'], ['style', 'Design style']] as const).map(([key, label]) => <label key={key} style={{ display: 'block', marginBottom: 10 }}>{label}<textarea rows={key === 'brief' ? 4 : 2} maxLength={key === 'brief' ? 6000 : 500} value={brief[key]} onChange={(event) => { setBrief((current) => ({ ...current, [key]: event.target.value })); setDirty(true); }} /></label>)}
      {(['pages', 'features'] as const).map((key) => <label key={key} style={{ display: 'block' }}>{key === 'pages' ? 'Pages (comma separated, up to 12 including Home)' : 'Static features (comma separated)'}<input value={brief[key].join(', ')} onChange={(event) => { setBrief((current) => ({ ...current, [key]: event.target.value.split(',') })); setDirty(true); }} /></label>)}
      <label>Website language<select value={brief.locale} onChange={(event) => { setBrief((current) => ({ ...current, locale: event.target.value })); setDirty(true); }}><option value="en">English</option><option value="tr">Turkish</option></select></label>
      <label>Package<select value={packId} onChange={(event) => { setPackId(event.target.value); setDirty(true); }}>{packs.map((pack) => <option key={pack.id} value={pack.id} disabled={/admin|commerce/i.test(pack.label)}>{pack.label} — {pack.credits} credits</option>)}</select></label>
      <button disabled={busy} type="submit">Review brief and plan — no credit charge</button></form>
      {project ? <><p>Project ID: <code>{project.productionId}</code></p><p>Phase: {project.status}. Production estimate: {project.website.credits ?? 'Choose a package'} credits.</p>{project.website.missing.length ? <p>Missing: {project.website.missing.join(', ')}</p> : null}{project.website.unsupported.length ? <p>Outside this static-site phase: {project.website.unsupported.join(', ')}</p> : null}<p>Pages to generate: {project.website.brief.pages.join(', ')}</p></> : null}
      <button type="button" disabled={busy || !reviewed || approved === true} onClick={() => perform('website_approve')}>Approve this exact brief and credit estimate</button>{approved ? <p>Server-confirmed plan approval.</p> : null}
      <button type="button" disabled={busy || !approved || project?.status === 'ready' || project?.status === 'generating'} onClick={() => perform('render')}>{project?.status === 'awaiting_payment' ? 'Retry payment / finalize same project' : 'Generate approved website'}</button>
      </section>
    </div>
    {project?.status === 'ready' ? <section><h2>Delivered website</h2><p>{project.website.pageManifest?.map((page) => page.path).join(', ')}</p><WebsiteBuilderForm initialProjectId={project.productionId} editorOnly /></section> : null}
  </section>;
}
