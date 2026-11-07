"use client";
import { useEffect, useRef, useState } from "react";
import { resolveReplyLanguage } from "@/lib/assistant-work/chat-language";
import { translateWorkspaceText, websiteWorkspaceStatus } from "@/lib/assistant-work/workspace-i18n";
import { useWorkspaceLanguage } from "./useWorkspaceLanguage";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { supabaseBrowser } from "@/lib/supabase";
import type { ProductionSelection } from "@/components/assistant/AssistantPreProduction";
type Brief = { brand: string; brief: string; audience: string; siteType: string; style: string; pages: string[]; features: string[]; locale: string };
type Project = { productionId: string; status: string; website: { runtimeAccepted?: boolean; runtimePackIds?: string[]; runtimeDevelopment?: boolean; review?: { ready: boolean; blockers: string[] }; brief: Brief; messages: Array<{ role: "user" | "assistant"; content: string }>; planHash: string; approvedHash?: string; missing: string[]; unsupported: string[]; credits: number | null; packId: string; pageManifest?: Array<{ title: string; path: string }> } };
const emptyBrief = (): Brief => ({ brand: "", brief: "", audience: "", siteType: "", style: "", pages: [], features: [], locale: "en" });
export function useWebsiteAssistant({ enabled, selection, request }: { enabled: boolean; selection?: ProductionSelection; request: (url: string, init: RequestInit) => Promise<Response> }) {
  const packs = getCategory("website")?.packs ?? [];
  const [packId, setPackId] = useState(selection?.packId || "");
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [activeId, setActiveId] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [runtimePlan, setRuntimePlan] = useState<{ hash: string; stale?: boolean; revision?: { status: string; blockers: string[]; additions: string[] }; pages: Array<{ title: string; purpose: string }>; capabilities: Array<{ name: string; kind: string; status: string }> } | null>(null);
  const [runtimeArtifact, setRuntimeArtifact] = useState<{ artifactVersion: string; stale?: boolean; blockers: string[]; sourceChanges?: { added: string[]; modified: string[]; removed: string[] } } | null>(null);
  const [runtimeHistory, setRuntimeHistory] = useState<Array<{ artifactVersion: string; createdAt?: string; canRestore: boolean }>>([]);
  const [runtimeMessages, setRuntimeMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [runtimeJob, setRuntimeJob] = useState<{ id: string; status: string } | null>(null);
  const [runtimeAutomation, setRuntimeAutomation] = useState<{ status: string; error?: string } | null>(null);
  const runtimeLoaded = useRef("");
  const [runtimeInstruction, setRuntimeInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Describe your website in the conversation. No production starts before plan approval.");
  const [userId, setUserId] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; title: string; status?: string; updated_at?: string }>>([]);
  const [transientMessages, setTransientMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const enabledRef = useRef(enabled); enabledRef.current = enabled;
  const activeRequest = useRef(0);
  useEffect(() => { if (!enabled) { activeRequest.current++; setBusy(false); return; } let disposed = false; void supabaseBrowser().auth.getUser().then(({ data }) => { if (!disposed && data.user) setUserId(data.user.id); }); return () => { disposed = true; }; }, [enabled]);
  useEffect(() => { if (!enabled || !userId) return; const saved = window.sessionStorage.getItem("crelavo-website-project:" + userId); if (saved && !activeId) void perform("website_open", saved); }, [enabled, userId]);
  useEffect(() => { if (selection?.packId && selection.packId !== packId) { setPackId(selection.packId); setDirty(true); } }, [selection?.packId]);
  useEffect(() => { if (enabled && userId && activeId) window.sessionStorage.setItem("crelavo-website-project:" + userId, activeId); }, [enabled, userId, activeId]);
  function acceptProject(data: Project) {
    runtimeLoaded.current = ""; setRuntimeMessages([]); setRuntimeJob(null); setRuntimeAutomation(null); setRuntimePlan(null); setRuntimeArtifact(null); setRuntimeHistory([]); setActiveId(data.productionId); setProject(data); setBrief(data.website.brief); setPackId(data.website.packId || ""); setDirty(false); setTransientMessages([]);
    if (userId) window.sessionStorage.setItem("crelavo-website-project:" + userId, data.productionId);
  }
  async function perform(action: string, id?: string, message = "") {
    if (!enabled || busy) return false;
    if (action === "revise" && message && project?.website.runtimeDevelopment && runtimePlan) return runtimeAction("propose", undefined, message);
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
  async function runtimeAction(action: "status" | "propose" | "compile" | "restore" | "test" | "poll", artifactVersion?: string, instruction?: string) {
    if (!enabled || busy || dirty || !project?.website.runtimeDevelopment || !userId) return false;
    if (action === "compile" && (!runtimePlan || runtimePlan.stale)) return false;
    const sequence = ++activeRequest.current; setBusy(true); setError("");
    try {
      const response = await request("/api/websites/blueprint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, productionId: project.productionId, user_id: userId, instruction: instruction ?? runtimeInstruction, ...(action === "propose" ? { expectedBlueprintHash: runtimePlan?.hash || null } : {}), ...(action === "test" ? { approve: true, artifactVersion: runtimeArtifact?.artifactVersion } : {}), ...(action === "restore" ? { approve: true, artifactVersion, expectedArtifactVersion: runtimeArtifact?.artifactVersion } : {}), ...(action === "compile" ? { approve: true, blueprintHash: runtimePlan?.hash } : {}) }) });
      const data = await response.json();
      if (!enabledRef.current || sequence !== activeRequest.current) return false;
      if (!response.ok) throw new Error(data.error === "runtime_data_migration_required" ? "Mevcut veriyi korumak için migration gerekiyor: " + (data.revision?.blockers || []).join(", ") : (data.error === "blueprint_plan_validation_failed" && typeof data.validationCode === "string" && /^(blueprint|runtime)_[a-z0-9_]+$/.test(data.validationCode) ? data.error + ": " + data.validationCode : data.error) || "Uygulama işlemi başarısız.");
      if (data.messages) setRuntimeMessages(data.messages);
      if (data.job) setRuntimeJob(data.job);
      if (data.automation) setRuntimeAutomation(data.automation);
      if (action === "status") { setRuntimeJob(data.job || null); setRuntimePlan(data.blueprint); setRuntimeArtifact(data.artifact); setRuntimeHistory(data.history || []); }
      if (action === "propose") { setRuntimePlan(data.blueprint); setRuntimeArtifact(null); setNotice("Uygulama planını inceleyin. Kaynak üretimi ve canlı Preview henüz başlamadı."); setProject(current => current ? { ...current, website: { ...current.website, approvedHash: undefined, review: { ready: false, blockers: ["runtime_acceptance_pending"] } } } : current); }
      if (action === "restore") { setRuntimePlan(data.blueprint); setRuntimeArtifact({ artifactVersion: data.artifactVersion, blockers: data.blockers }); setRuntimeHistory([]); setNotice("Kaynak sürümü geri alındı. Canlı veri değiştirilmedi; dağıtım ve kabul yeniden gerekiyor."); }
      if (action === "compile") { setRuntimeArtifact({ artifactVersion: data.artifactVersion, blockers: data.blockers, sourceChanges: data.sourceChanges }); setNotice(data.job ? "Yeni kaynak sürümü kaydedildi; projeye özel kabul testleri otomatik sıraya alındı." : "Kaynaklar kaydedildi. Kabul worker bağlantısı eksik; test edilmeden teslim açılmaz."); }
      if (action === "poll") { if (data.artifact) setRuntimeArtifact(current => ({ ...current, ...data.artifact })); setNotice(data.job?.status === "passed" ? "Bu kaynak sürümünün kabul testleri geçti. Paket/kredi onayı ayrı aşamadır." : data.job?.status === "failed" ? "Kabul testi başarısız; engeller düzeltilmeden ZIP teslim edilmez." : "Projeye özel kabul testleri çalışıyor."); }
      return true;
    } catch (error) { if (sequence === activeRequest.current) { setError(error instanceof Error ? error.message : "Uygulama işlemi başarısız."); if (action === "poll") setRuntimeJob(current => current ? { ...current, status: "connection_failed" } : null); } return false; }
    finally { if (sequence === activeRequest.current) setBusy(false); }
  }
  useEffect(() => {
    if (!enabled || busy || dirty || !userId || !project?.website.runtimeDevelopment || runtimeLoaded.current === project.productionId) return;
    runtimeLoaded.current = project.productionId; void runtimeAction("status");
  }, [enabled, busy, dirty, userId, project?.productionId]);
  useEffect(() => {
    if (!enabled || busy || !runtimeJob || !["queued", "running"].includes(runtimeJob.status)) return;
    const timer = setTimeout(() => { void runtimeAction("poll"); }, 2500); return () => clearTimeout(timer);
  }, [enabled, busy, runtimeJob?.id, runtimeJob?.status]);
  async function loadProjects() { setBusy(true); setError(""); try { const response = await request("/api/websites?user_id=" + encodeURIComponent(userId), { method: "GET" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setProjects(data.websites ?? []); } catch (error) { setError(error instanceof Error ? error.message : "Project list failed."); } finally { setBusy(false); } }
  function newProject() { runtimeLoaded.current = ""; setRuntimeMessages([]); setRuntimeJob(null); setRuntimeAutomation(null); activeRequest.current++; setRuntimePlan(null); setRuntimeArtifact(null); setRuntimeHistory([]); setRuntimeInstruction(""); setError(""); setTransientMessages([]); setActiveId(""); setProject(null); setBrief(emptyBrief()); setDirty(true); if (userId) window.sessionStorage.removeItem("crelavo-website-project:" + userId); setNotice("New Website Brief. No production has started."); }
  const reviewed = Boolean(project && !dirty && packId && project.website.packId === packId && typeof project.website.credits === "number" && !project.website.missing.length && !project.website.unsupported.length && (project.website.review?.ready ?? true));
  const approved = Boolean(reviewed && project?.website.approvedHash === project?.website.planHash);
  return { runtimeJob, runtimeAutomation, runtimePlan, runtimeArtifact, runtimeHistory, runtimeInstruction, setRuntimeInstruction, runtimeAction, acceptProject, messages: [...(project?.website.messages ?? []), ...runtimeMessages, ...transientMessages], project, brief, setBrief, packId, setPackId, packs, busy, dirty, setDirty, notice, error, userId, projects, reviewed, approved, perform, loadProjects, newProject };
}
export type WebsiteAssistantController = ReturnType<typeof useWebsiteAssistant>;
export function WebsitePlanControls({ controller: c }: { controller: WebsiteAssistantController }) {
  const { t } = useWorkspaceLanguage();
  const locked = c.busy || !!(c.runtimeJob && ["queued", "running"].includes(c.runtimeJob.status)) || c.project?.status === "generating" || c.project?.status === "awaiting_payment";
  const adminPack = c.packs.find(pack => /admin/i.test(pack.label));
  const adminReason = !c.project ? "Önce brief'i kaydedin; paket izinleri kayıtlı proje üzerinden yüklenir." : !c.project.website.runtimeDevelopment ? "Sunucu geliştirme modu kapalı: WEBSITE_RUNTIME_ENABLED=1 Preview ortamında uygulanmamış." : adminPack && !c.project.website.runtimePackIds?.includes(adminPack.id) ? "Sunucu bu pakete izin vermiyor: Preview için WEBSITE_RUNTIME_ALLOWED_PACK_IDS=" + adminPack.id + " gerekli. Mevcut izinler: " + (c.project.website.runtimePackIds?.join(", ") || "boş") : "";
  return <section className="website-plan-controls" aria-label={t("Website plan and approval")} style={{ display: "grid", gap: 10 }}>
    <p role="status" style={{ margin: 0, fontSize: 12 }}>{t(websiteWorkspaceStatus(c.project, c.dirty, c.approved))}</p>
    {c.error ? <p role="alert">{t(c.error)}</p> : null}
    <small>{c.project?.website.runtimeDevelopment && !c.project.website.runtimeAccepted ? "Geliştirme modu: admin ve veritabanı kapsamı uygulama planında belirlenir. Test geçmeden teslim açılmaz." : c.project?.website.runtimeAccepted ? "Uygulama kaynakları kabul edildi; paket/kredi onayı ve sonlandırma bekleniyor." : t("Static website phase. Accounts, payments, databases and working admin modules are not included.")}</small>
    <details><summary>{t("Website Brief details")}</summary><form onSubmit={(event) => { event.preventDefault(); void c.perform("revise"); }}>
      {([ ["brand", "Brand / business"], ["brief", "Business description and site goal"], ["audience", "Target audience"], ["siteType", "Site type"], ["style", "Design style"] ] as const).map(([key, label]) => <label key={key} style={{ display: "block", marginTop: 8 }}>{t(label)}<textarea disabled={locked} rows={2} maxLength={key === "brief" ? 6000 : 500} value={c.brief[key]} onChange={(event) => { c.setBrief((current) => ({ ...current, [key]: event.target.value })); c.setDirty(true); }} style={{ width: "100%", background: "#191d26", color: "#f3f4f6", colorScheme: "dark", border: "1px solid #4b5563" }} /></label>)}
      {(["pages", "features"] as const).map((key) => <label key={key} style={{ display: "block", marginTop: 8 }}>{key === "pages" ? t("Pages (comma separated)") : t("Static features")}<input disabled={locked} value={c.brief[key].join(", ")} onChange={(event) => { c.setBrief((current) => ({ ...current, [key]: event.target.value.split(",") })); c.setDirty(true); }} style={{ width: "100%" }} /></label>)}
      <label>{t("Website language")}<select style={{ background: "#191d26", color: "#f3f4f6", colorScheme: "dark" }} disabled={locked} value={c.brief.locale} onChange={(event) => { c.setBrief((current) => ({ ...current, locale: event.target.value })); c.setDirty(true); }}><option value="en">{t("English")}</option><option value="tr">{t("Turkish")}</option></select></label>
      <small className="website-plan-hint">Alanları doldurduktan sonra aşağıdaki plan güncelleme düğmesini kullanın.</small>
    </form></details>
    <label>{t("Package")}<select disabled={locked} value={c.packId} onChange={(event) => { c.setPackId(event.target.value); c.setDirty(true); }} style={{ width: "100%" }}><option value="">{t("Select package")}</option>{c.packs.map((pack) => <option key={pack.id} value={pack.id} disabled={/admin|commerce/i.test(pack.label) && !(c.project?.website.runtimeDevelopment && c.project.website.runtimePackIds?.includes(pack.id))}>{t(pack.label)} — {pack.credits} {t("credits")}</option>)}</select></label>
    {c.packs.some(pack => /admin|commerce/i.test(pack.label) && !(c.project?.website.runtimeDevelopment && c.project.website.runtimePackIds?.includes(pack.id))) && <small className="website-plan-hint">Admin paketi kilitli. {adminReason} Kredi bakiyesi bu kilidin nedeni değildir.</small>}
    {c.dirty || (c.project && !c.reviewed) ? <button type="button" disabled={locked} onClick={() => c.perform("revise")}>{t("Update plan — no credit charge")}</button> : null}
    {c.project ? <><small>{t("Project:")}{c.project.productionId} · {t(c.project.status)}</small><p style={{ margin: 0 }}>{t("Estimate:")} {c.project.website.credits ?? t("Select package")} {t("credits")}</p><p style={{ margin: 0 }}>{t("Pages:")}{c.project.website.brief.pages.join(", ")}</p>{c.project.website.missing.length ? <small>{t("Missing:")}{c.project.website.missing.map((field) => t(field)).join(", ")}</small> : null}{c.project.website.unsupported.length ? <small>{t("Outside static scope:")}{c.project.website.unsupported.join(", ")}</small> : null}</> : null}
    {c.project?.website.runtimeDevelopment && <details><summary>Admin ve veritabanı planı — geliştirme</summary><p>Önce brief’i kaydedin, sonra uygulama planını hazırlayın. Kaynak oluşturma ve test, krediyle teslim onayından ayrı adımlardır.</p><label>Ek uygulama isteği (isteğe bağlı)<textarea style={{ width: "100%", background: "#191d26", color: "#f3f4f6", colorScheme: "dark" }} disabled={locked} maxLength={6000} value={c.runtimeInstruction} onChange={event => c.setRuntimeInstruction(event.target.value)} /></label><button type="button" disabled={locked || c.dirty || !c.userId} onClick={() => c.runtimeAction("propose")}>AI uygulama planı hazırla / revize et</button><button type="button" disabled={locked || c.dirty || !c.userId} onClick={() => c.runtimeAction("status")}>Kayıtlı uygulama durumunu yükle</button>{c.runtimePlan && <><ul>{c.runtimePlan.pages.map((page, index) => <li key={index}>{page.title}: {page.purpose}</li>)}</ul><ul>{c.runtimePlan.capabilities.map((item, index) => <li key={index}>{item.name} — {item.status === "planned" ? "Planlandı; test bekliyor" : "Uygulama geliştirmesi gerekiyor"}</li>)}</ul>{c.runtimePlan.revision?.blockers.length ? <p role="alert">Veri migration gereksinimleri: {c.runtimePlan.revision.blockers.join(", ")}. Bu plan mevcut veriye otomatik uygulanmaz.</p> : null}{c.runtimePlan.stale && <p role="alert">Brief değişti; planı yeniden hazırlayın.</p>}<button type="button" disabled={locked || c.dirty || c.runtimePlan.stale || !!c.runtimePlan.revision?.blockers.length} onClick={() => c.runtimeAction("compile")}>Planı onayla, tüm kaynakları oluştur ve otomatik test et</button></>}{c.runtimeArtifact && <p role="status">Kaynak sürümü: {c.runtimeArtifact.artifactVersion.slice(0, 12)}. {c.runtimeArtifact.stale ? "Eski sürüm; yeniden oluşturun." : c.runtimeJob?.status === "passed" ? "Test geçti." : c.runtimeJob?.status === "failed" ? "Test başarısız." : "Kabul bekliyor."} Kabul işi: {c.runtimeJob?.status || "başlatılmadı"}. Değişen kaynak: {c.runtimeArtifact.sourceChanges ? c.runtimeArtifact.sourceChanges.added.length + c.runtimeArtifact.sourceChanges.modified.length + c.runtimeArtifact.sourceChanges.removed.length : "—"}. Bekleyenler: {c.runtimeArtifact.blockers.join(", ")}</p>}{c.runtimeAutomation?.status === "configuration_pending" && <p role="alert">Kabul çalıştırıcısı bağlı değil; test ve ZIP teslimi kilitli.</p>}{c.runtimeArtifact && <button type="button" disabled={locked || c.runtimeArtifact.stale} onClick={() => c.runtimeAction("test")}>Bu kaynak sürümünün kabul testini yeniden başlat</button>}{c.runtimeHistory.map(item => <button key={item.artifactVersion} type="button" disabled={locked || !item.canRestore} onClick={() => c.runtimeAction("restore", item.artifactVersion)}>Kaynak sürümüne dön: {item.artifactVersion.slice(0, 12)} — yeniden test gerekir</button>)}</details>}
    <button type="button" disabled={locked || !c.reviewed || c.approved} onClick={() => c.perform("website_approve")}>{c.approved ? t("Server-confirmed plan approval") : t("Approve plan and credit estimate")}</button>
    {c.project ? <button type="button" disabled={c.busy} onClick={() => c.perform("website_open", c.project!.productionId)}>{t("Refresh project")}</button> : null}
    {c.project?.status === "generating" ? <button type="button" disabled={c.busy} onClick={() => c.perform("website_retry")}>{t("Recover interrupted generation after 3 minutes")}</button> : null}
    <button type="button" disabled={locked} onClick={c.newProject}>{t("New website project")}</button>
    <details><summary>{t("Open an existing website")}</summary><button type="button" disabled={!c.userId || c.busy} onClick={c.loadProjects}>{t("Load my websites")}</button>{c.projects.map((item) => <button key={item.id} type="button" disabled={c.busy} onClick={() => c.perform("website_open", item.id)}><strong>{item.title || "İsimsiz web sitesi"}</strong><small>{item.status || "Durum bilinmiyor"} · {item.updated_at && Number.isFinite(Date.parse(item.updated_at)) ? new Date(item.updated_at).toLocaleString() : "Tarih yok"} · {item.id.slice(0, 8)}</small></button>)}<p>{t("Legacy projects remain available in")}<a href="/ai-website-builder">{t("Website Builder")}</a>.</p></details>
  </section>;
}
