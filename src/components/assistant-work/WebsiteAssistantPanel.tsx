"use client";
import { useEffect, useRef, useState } from "react";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { supabaseBrowser } from "@/lib/supabase";
import type { ProductionSelection } from "@/components/assistant/AssistantPreProduction";
type Brief = { brand: string; brief: string; audience: string; siteType: string; style: string; pages: string[]; features: string[]; locale: string };
type Project = { productionId: string; status: string; website: { brief: Brief; messages: Array<{ role: "user" | "assistant"; content: string }>; planHash: string; approvedHash?: string; missing: string[]; unsupported: string[]; credits: number | null; packId: string; pageManifest?: Array<{ title: string; path: string }> } };
const emptyBrief = (): Brief => ({ brand: "", brief: "", audience: "", siteType: "", style: "", pages: [], features: [], locale: "en" });
export function useWebsiteAssistant({ enabled, selection, request }: { enabled: boolean; selection?: ProductionSelection; request: (url: string, init: RequestInit) => Promise<Response> }) {
  const packs = getCategory("website")?.packs ?? [];
  const [packId, setPackId] = useState(selection?.packId || packs[0]?.id || "");
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [activeId, setActiveId] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(true);
  const [notice, setNotice] = useState("Describe your website in the conversation. No production starts before plan approval.");
  const [userId, setUserId] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);
  const enabledRef = useRef(enabled); enabledRef.current = enabled;
  const activeRequest = useRef(0);
  useEffect(() => { if (!enabled) { activeRequest.current++; setBusy(false); return; } let disposed = false; void supabaseBrowser().auth.getUser().then(({ data }) => { if (!disposed && data.user) setUserId(data.user.id); }); return () => { disposed = true; }; }, [enabled]);
  useEffect(() => { if (!enabled || !userId) return; const saved = window.sessionStorage.getItem("crelavo-website-project:" + userId); if (saved && !activeId) void perform("website_open", saved); }, [enabled, userId]);
  useEffect(() => { if (selection?.packId) { setPackId(selection.packId); setDirty(true); } }, [selection?.packId]);
  async function perform(action: string, id?: string, message = "") {
    if (!enabled || busy) return false;
    const sequence = ++activeRequest.current; setBusy(true);
    try {
      const response = await request("/api/assistant-work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: "website", type: "Website", prompt: message || (action === "revise" ? "Please review the website brief and ask about missing information." : ""), action, render: action === "render", productionId: id || activeId || project?.productionId, websiteBrief: action === "revise" ? brief : undefined, packId, planHash: project?.website.planHash, extras: selection?.extras ?? {} }) });
      const data = await response.json();
      if (!enabledRef.current || sequence !== activeRequest.current) return false;
      if (data.productionId) { setActiveId(data.productionId); if (userId) window.sessionStorage.setItem("crelavo-website-project:" + userId, data.productionId); }
      if (!response.ok || !data.ok) throw new Error(data.message || data.code || data.error || "Website request failed.");
      setProject(data); setBrief(data.website.brief); setPackId(data.website.packId || packId); setDirty(false);
      setNotice(action === "render" ? "Website ready. Preview, revisions and ZIP belong to this same project." : action === "website_approve" ? "Plan approved on the server. Production can now start." : data.body || "Website project opened.");
      return true;
    } catch (error) { if (sequence === activeRequest.current) setNotice(error instanceof Error ? error.message : "Website request failed."); return false; }
    finally { if (sequence === activeRequest.current) setBusy(false); }
  }
  async function loadProjects() { setBusy(true); try { const response = await request("/api/websites?user_id=" + encodeURIComponent(userId), { method: "GET" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setProjects(data.websites ?? []); } catch (error) { setNotice(error instanceof Error ? error.message : "Project list failed."); } finally { setBusy(false); } }
  function newProject() { setActiveId(""); setProject(null); setBrief(emptyBrief()); setDirty(true); if (userId) window.sessionStorage.removeItem("crelavo-website-project:" + userId); setNotice("New Website Brief. No production has started."); }
  const reviewed = Boolean(project && !dirty && !project.website.missing.length && !project.website.unsupported.length);
  const approved = Boolean(reviewed && project?.website.approvedHash === project?.website.planHash);
  return { project, brief, setBrief, packId, setPackId, packs, busy, dirty, setDirty, notice, userId, projects, reviewed, approved, perform, loadProjects, newProject };
}
export type WebsiteAssistantController = ReturnType<typeof useWebsiteAssistant>;
export function WebsitePlanControls({ controller: c }: { controller: WebsiteAssistantController }) {
  const locked = c.busy || c.project?.status === "generating" || c.project?.status === "awaiting_payment";
  return <section aria-label="Website plan and approval" style={{ display: "grid", gap: 10 }}>
    <p role="status" style={{ margin: 0, fontSize: 12 }}>{c.notice}</p>
    <small>Static website phase. Accounts, payments, databases and working admin modules are not included.</small>
    <details><summary>Website Brief details</summary><form onSubmit={(event) => { event.preventDefault(); void c.perform("revise"); }}>
      {([ ["brand", "Brand / business"], ["brief", "Business description and site goal"], ["audience", "Target audience"], ["siteType", "Site type"], ["style", "Design style"] ] as const).map(([key, label]) => <label key={key} style={{ display: "block", marginTop: 8 }}>{label}<textarea disabled={locked} rows={2} maxLength={key === "brief" ? 6000 : 500} value={c.brief[key]} onChange={(event) => { c.setBrief((current) => ({ ...current, [key]: event.target.value })); c.setDirty(true); }} style={{ width: "100%" }} /></label>)}
      {(["pages", "features"] as const).map((key) => <label key={key} style={{ display: "block", marginTop: 8 }}>{key === "pages" ? "Pages (comma separated)" : "Static features"}<input disabled={locked} value={c.brief[key].join(", ")} onChange={(event) => { c.setBrief((current) => ({ ...current, [key]: event.target.value.split(",") })); c.setDirty(true); }} style={{ width: "100%" }} /></label>)}
      <label>Website language<select disabled={locked} value={c.brief.locale} onChange={(event) => { c.setBrief((current) => ({ ...current, locale: event.target.value })); c.setDirty(true); }}><option value="en">English</option><option value="tr">Turkish</option></select></label>
      <button type="submit" disabled={locked}>Review brief — no credit charge</button>
    </form></details>
    <label>Package<select disabled={locked} value={c.packId} onChange={(event) => { c.setPackId(event.target.value); c.setDirty(true); }} style={{ width: "100%" }}>{c.packs.map((pack) => <option key={pack.id} value={pack.id} disabled={/admin|commerce/i.test(pack.label)}>{pack.label} — {pack.credits} credits</option>)}</select></label>
    {c.dirty ? <button type="button" disabled={locked} onClick={() => c.perform("revise")}>Update plan — no credit charge</button> : null}
    {c.project ? <><small>Project: {c.project.productionId} · {c.project.status}</small><p style={{ margin: 0 }}>Estimate: {c.project.website.credits ?? "Select package"} credits</p><p style={{ margin: 0 }}>Pages: {c.project.website.brief.pages.join(", ")}</p>{c.project.website.missing.length ? <small>Missing: {c.project.website.missing.join(", ")}</small> : null}{c.project.website.unsupported.length ? <small>Outside static scope: {c.project.website.unsupported.join(", ")}</small> : null}</> : null}
    <button type="button" disabled={locked || !c.reviewed || c.approved} onClick={() => c.perform("website_approve")}>{c.approved ? "Server-confirmed plan approval" : "Approve plan and credit estimate"}</button>
    {c.project ? <button type="button" disabled={c.busy} onClick={() => c.perform("website_open", c.project!.productionId)}>Refresh project</button> : null}
    {c.project?.status === "generating" ? <button type="button" disabled={c.busy} onClick={() => c.perform("website_retry")}>Recover interrupted generation after 3 minutes</button> : null}
    <button type="button" disabled={locked} onClick={c.newProject}>New website project</button>
    <details><summary>Open an existing website</summary><button type="button" disabled={!c.userId || c.busy} onClick={c.loadProjects}>Load my websites</button>{c.projects.map((item) => <button key={item.id} type="button" disabled={c.busy} onClick={() => c.perform("website_open", item.id)}>{item.title}</button>)}<p>Legacy projects remain available in <a href="/ai-website-builder">Website Builder</a>.</p></details>
  </section>;
}
