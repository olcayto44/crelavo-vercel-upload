"use client";
import { useEffect, useRef, useState } from "react";
import { resolveReplyLanguage } from "@/lib/assistant-work/chat-language";
import { translateWorkspaceText, websiteWorkspaceStatus } from "@/lib/assistant-work/workspace-i18n";
import { useWorkspaceLanguage } from "./useWorkspaceLanguage";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { supabaseBrowser } from "@/lib/supabase";
import type { ProductionSelection } from "@/components/assistant/AssistantPreProduction";
type Brief = { brand: string; brief: string; audience: string; siteType: string; style: string; pages: string[]; features: string[]; locale: string };
type Project = { productionId: string; status: string; website: { review?: { ready: boolean; blockers: string[] }; brief: Brief; messages: Array<{ role: "user" | "assistant"; content: string }>; planHash: string; approvedHash?: string; missing: string[]; unsupported: string[]; credits: number | null; packId: string; pageManifest?: Array<{ title: string; path: string }> } };
const emptyBrief = (): Brief => ({ brand: "", brief: "", audience: "", siteType: "", style: "", pages: [], features: [], locale: "en" });
export function useWebsiteAssistant({ enabled, selection, request }: { enabled: boolean; selection?: ProductionSelection; request: (url: string, init: RequestInit) => Promise<Response> }) {
  const packs = getCategory("website")?.packs ?? [];
  const [packId, setPackId] = useState(selection?.packId || "");
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [activeId, setActiveId] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Describe your website in the conversation. No production starts before plan approval.");
  const [userId, setUserId] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);
  const [transientMessages, setTransientMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const enabledRef = useRef(enabled); enabledRef.current = enabled;
  const activeRequest = useRef(0);
  useEffect(() => { if (!enabled) { activeRequest.current++; setBusy(false); return; } let disposed = false; void supabaseBrowser().auth.getUser().then(({ data }) => { if (!disposed && data.user) setUserId(data.user.id); }); return () => { disposed = true; }; }, [enabled]);
  useEffect(() => { if (!enabled || !userId) return; const saved = window.sessionStorage.getItem("crelavo-website-project:" + userId); if (saved && !activeId) void perform("website_open", saved); }, [enabled, userId]);
  useEffect(() => { if (selection?.packId && selection.packId !== packId) { setPackId(selection.packId); setDirty(true); } }, [selection?.packId]);
  useEffect(() => { if (enabled && userId && activeId) window.sessionStorage.setItem("crelavo-website-project:" + userId, activeId); }, [enabled, userId, activeId]);
  function acceptProject(data: Project) {
    setActiveId(data.productionId); setProject(data); setBrief(data.website.brief); setPackId(data.website.packId || ""); setDirty(false); setTransientMessages([]);
    if (userId) window.sessionStorage.setItem("crelavo-website-project:" + userId, data.productionId);
  }
  async function perform(action: string, id?: string, message = "") {
    if (!enabled || busy) return false;
    const sequence = ++activeRequest.current; setBusy(true); setError("");
    if (action === "revise" && message) setTransientMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const response = await request("/api/assistant-work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: "website", type: "Website", prompt: message || (action === "revise" ? "Please review the website brief and ask about missing information." : ""), action, uiAction: action === "revise" && !message, render: action === "render", productionId: id || activeId || project?.productionId, websiteBrief: action === "revise" ? brief : undefined, packId, planHash: project?.website.planHash, extras: selection?.extras ?? {} }) });
      const data = await response.json();
      if (!enabledRef.current || sequence !== activeRequest.current) return false;
      if (data.productionId) { setActiveId(data.productionId); if (userId) window.sessionStorage.setItem("crelavo-website-project:" + userId, data.productionId); }
      if (!response.ok || !data.ok) throw new Error(data.message || data.code || data.error || "Website request failed.");
      acceptProject(data);
      setNotice(action === "render" ? "Website ready. Preview, revisions and ZIP belong to this same project." : action === "website_approve" ? "Plan approved on the server. Production can now start." : data.body || "Website project opened.");
      return true;
    } catch (error) { if (sequence === activeRequest.current) { const detail = error instanceof Error ? error.message : "Website request failed."; setNotice(detail); setError(detail); const language = resolveReplyLanguage(message, project?.website.messages ?? []); setTransientMessages((current) => [...current, { role: "assistant", content: translateWorkspaceText("Request failed", language) + ": " + translateWorkspaceText(detail, language) }]); } return false; }
    finally { if (sequence === activeRequest.current) setBusy(false); }
  }
  async function loadProjects() { setBusy(true); setError(""); try { const response = await request("/api/websites?user_id=" + encodeURIComponent(userId), { method: "GET" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setProjects(data.websites ?? []); } catch (error) { setError(error instanceof Error ? error.message : "Project list failed."); } finally { setBusy(false); } }
  function newProject() { setError(""); setTransientMessages([]); setActiveId(""); setProject(null); setBrief(emptyBrief()); setDirty(true); if (userId) window.sessionStorage.removeItem("crelavo-website-project:" + userId); setNotice("New Website Brief. No production has started."); }
  const reviewed = Boolean(project && !dirty && packId && project.website.packId === packId && typeof project.website.credits === "number" && !project.website.missing.length && !project.website.unsupported.length && (project.website.review?.ready ?? true));
  const approved = Boolean(reviewed && project?.website.approvedHash === project?.website.planHash);
  return { acceptProject, messages: [...(project?.website.messages ?? []), ...transientMessages], project, brief, setBrief, packId, setPackId, packs, busy, dirty, setDirty, notice, error, userId, projects, reviewed, approved, perform, loadProjects, newProject };
}
export type WebsiteAssistantController = ReturnType<typeof useWebsiteAssistant>;
export function WebsitePlanControls({ controller: c }: { controller: WebsiteAssistantController }) {
  const { t } = useWorkspaceLanguage();
  const locked = c.busy || c.project?.status === "generating" || c.project?.status === "awaiting_payment";
  return <section aria-label={t("Website plan and approval")} style={{ display: "grid", gap: 10 }}>
    <p role="status" style={{ margin: 0, fontSize: 12 }}>{t(websiteWorkspaceStatus(c.project, c.dirty, c.approved))}</p>
    {c.error ? <p role="alert">{t(c.error)}</p> : null}
    <small>{t("Static website phase. Accounts, payments, databases and working admin modules are not included.")}</small>
    <details><summary>{t("Website Brief details")}</summary><form onSubmit={(event) => { event.preventDefault(); void c.perform("revise"); }}>
      {([ ["brand", "Brand / business"], ["brief", "Business description and site goal"], ["audience", "Target audience"], ["siteType", "Site type"], ["style", "Design style"] ] as const).map(([key, label]) => <label key={key} style={{ display: "block", marginTop: 8 }}>{t(label)}<textarea disabled={locked} rows={2} maxLength={key === "brief" ? 6000 : 500} value={c.brief[key]} onChange={(event) => { c.setBrief((current) => ({ ...current, [key]: event.target.value })); c.setDirty(true); }} style={{ width: "100%" }} /></label>)}
      {(["pages", "features"] as const).map((key) => <label key={key} style={{ display: "block", marginTop: 8 }}>{key === "pages" ? t("Pages (comma separated)") : t("Static features")}<input disabled={locked} value={c.brief[key].join(", ")} onChange={(event) => { c.setBrief((current) => ({ ...current, [key]: event.target.value.split(",") })); c.setDirty(true); }} style={{ width: "100%" }} /></label>)}
      <label>{t("Website language")}<select disabled={locked} value={c.brief.locale} onChange={(event) => { c.setBrief((current) => ({ ...current, locale: event.target.value })); c.setDirty(true); }}><option value="en">{t("English")}</option><option value="tr">{t("Turkish")}</option></select></label>
      <button type="submit" disabled={locked}>{t("Review brief — no credit charge")}</button>
    </form></details>
    <label>{t("Package")}<select disabled={locked} value={c.packId} onChange={(event) => { c.setPackId(event.target.value); c.setDirty(true); }} style={{ width: "100%" }}><option value="">{t("Select package")}</option>{c.packs.map((pack) => <option key={pack.id} value={pack.id} disabled={/admin|commerce/i.test(pack.label)}>{t(pack.label)} — {pack.credits} {t("credits")}</option>)}</select></label>
    {c.dirty || (c.project && !c.reviewed) ? <button type="button" disabled={locked} onClick={() => c.perform("revise")}>{t("Update plan — no credit charge")}</button> : null}
    {c.project ? <><small>{t("Project:")}{c.project.productionId} · {t(c.project.status)}</small><p style={{ margin: 0 }}>{t("Estimate:")} {c.project.website.credits ?? t("Select package")} {t("credits")}</p><p style={{ margin: 0 }}>{t("Pages:")}{c.project.website.brief.pages.join(", ")}</p>{c.project.website.missing.length ? <small>{t("Missing:")}{c.project.website.missing.map((field) => t(field)).join(", ")}</small> : null}{c.project.website.unsupported.length ? <small>{t("Outside static scope:")}{c.project.website.unsupported.join(", ")}</small> : null}</> : null}
    <button type="button" disabled={locked || !c.reviewed || c.approved} onClick={() => c.perform("website_approve")}>{c.approved ? t("Server-confirmed plan approval") : t("Approve plan and credit estimate")}</button>
    {c.project ? <button type="button" disabled={c.busy} onClick={() => c.perform("website_open", c.project!.productionId)}>{t("Refresh project")}</button> : null}
    {c.project?.status === "generating" ? <button type="button" disabled={c.busy} onClick={() => c.perform("website_retry")}>{t("Recover interrupted generation after 3 minutes")}</button> : null}
    <button type="button" disabled={locked} onClick={c.newProject}>{t("New website project")}</button>
    <details><summary>{t("Open an existing website")}</summary><button type="button" disabled={!c.userId || c.busy} onClick={c.loadProjects}>{t("Load my websites")}</button>{c.projects.map((item) => <button key={item.id} type="button" disabled={c.busy} onClick={() => c.perform("website_open", item.id)}>{item.title}</button>)}<p>{t("Legacy projects remain available in")}<a href="/ai-website-builder">{t("Website Builder")}</a>.</p></details>
  </section>;
}
