"use client";
import { useEffect, useRef, useState } from "react";
import { websitePreviewDocument } from "@/lib/website-preview";
type Page = { title: string; path: string };
export function WebsiteWorkspacePreview({ projectId, page, pages, revision, request, onPage }: { projectId: string; page: Page; pages: Page[]; revision: number; request: (url: string, init: RequestInit) => Promise<Response>; onPage: (path: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [result, setResult] = useState({ key: "", html: "", error: "" });
  const [target, setTarget] = useState({ path: "", anchor: "" });
  const anchor = target.path === page.path ? target.anchor : "";
  const key = projectId + ":" + page.path + ":" + revision + ":" + anchor;
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await request("/api/productions/" + encodeURIComponent(projectId) + "/delivery?file=preview&page=" + encodeURIComponent(page.path), { method: "GET" });
        if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "Preview could not be loaded."); }
        const html = websitePreviewDocument(await response.text(), anchor);
        if (!cancelled) setResult({ key, html, error: "" });
      } catch (error) { if (!cancelled) setResult({ key, html: "", error: error instanceof Error ? error.message : "Preview failed." }); }
    })();
    return () => { cancelled = true; };
  }, [projectId, page.path, revision, anchor, key, request]);
  useEffect(() => {
    const navigate = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== "crelavo-website-page" || !pages.some((item) => item.path === event.data.page)) return;
      setTarget({ path: event.data.page, anchor: typeof event.data.anchor === "string" ? event.data.anchor : "" });
      onPage(event.data.page);
    };
    window.addEventListener("message", navigate);
    return () => window.removeEventListener("message", navigate);
  }, [pages, onPage]);
  if (result.key !== key) return <div role="status" style={{ padding: 24 }}>Loading {page.title} preview...</div>;
  if (result.error) return <div role="alert" style={{ padding: 24 }}>{result.error}</div>;
  return <iframe ref={frame} title={"Website preview: " + page.title} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={result.html} style={{ display: "block", width: "100%", height: 520, border: 0, background: "#fff" }} />;
}
