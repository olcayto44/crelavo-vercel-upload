"use client";
import { useWorkspaceLanguage } from "./useWorkspaceLanguage";
import { useEffect, useRef, useState } from "react";
import { websitePreviewDocument } from "@/lib/website-preview";
type Page = { title: string; path: string };
export function WebsiteWorkspacePreview({ projectId, page, pages, revision, draft, runtimeViews = false, request, onPage }: { projectId: string; page: Page; pages: Page[]; revision: number; runtimeViews?: boolean; draft?: { hash: string; userId: string }; request: (url: string, init: RequestInit) => Promise<Response>; onPage: (path: string) => void }) {
  const { t } = useWorkspaceLanguage();
  const frame = useRef<HTMLIFrameElement>(null);
  const [result, setResult] = useState({ key: "", html: "", error: "" });
  const [target, setTarget] = useState({ path: "", anchor: "", owner: "" });
  const previewPath = target.owner === page.path && target.path ? target.path : page.path;
  const anchor = target.owner === page.path ? target.anchor : "";
  const [view, setView] = useState<"public" | "admin">("public");
  const activeView = runtimeViews ? view : "public";
  const key = projectId + ":" + activeView + ":" + previewPath + ":" + (draft?.hash || revision) + ":" + anchor;
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = draft ? await request("/api/websites/blueprint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "preview", user_id: draft.userId, productionId: projectId, blueprintHash: draft.hash, page: previewPath, view: activeView }) }) : await request("/api/productions/" + encodeURIComponent(projectId) + "/delivery?file=preview&view=" + activeView + "&page=" + encodeURIComponent(previewPath), { method: "GET" });
        if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "Preview could not be loaded."); }
        const html = websitePreviewDocument(await response.text(), anchor);
        if (!cancelled) setResult({ key, html, error: "" });
      } catch (error) { if (!cancelled) setResult({ key, html: "", error: error instanceof Error ? error.message : "Preview failed." }); }
    })();
    return () => { cancelled = true; };
  }, [projectId, previewPath, revision, anchor, key, activeView, draft?.hash, draft?.userId, request]);
  useEffect(() => {
    const navigate = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== "crelavo-website-page" || (typeof event.data.page !== "string" || (!pages.some((item) => item.path === event.data.page) && !/^items\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-zA-Z0-9_%.-]+$/.test(event.data.page)))) return;
      setTarget({ owner: page.path, path: event.data.page, anchor: typeof event.data.anchor === "string" ? event.data.anchor : "" });
      if (pages.some((item) => item.path === event.data.page)) onPage(event.data.page);
    };
    window.addEventListener("message", navigate);
    return () => window.removeEventListener("message", navigate);
  }, [pages, onPage, page.path]);
  return <section>
    {runtimeViews && <div role="group" aria-label="Önizleme görünümü" style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 12 }}>
      <button type="button" aria-pressed={view === "public"} onClick={() => setView("public")}>Ziyaretçi sitesi</button>
      <button type="button" aria-pressed={view === "admin"} onClick={() => setView("admin")}>Admin paneli</button>
      <small>{draft ? "Onay bekleyen taslak" : "Kabul edilen kaynak önizlemesi"}. Admin işlemleri geçici örnek veride çalışır; canlı veriyi değiştirmez.</small>
    </div>}
    {result.key !== key ? <div role="status" style={{ padding: 24 }}>{t("Loading {page} preview...", { page: activeView === "admin" ? "Admin" : page.title })}</div> : result.error ? <div role="alert" style={{ padding: 24 }}>{t(result.error)}</div> : <iframe ref={frame} title={activeView === "admin" ? "Admin paneli önizlemesi" : t("Website preview") + ": " + page.title} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={result.html} style={{ display: "block", width: "100%", height: 650, border: 0, background: "#fff" }} />}
  </section>;
}
