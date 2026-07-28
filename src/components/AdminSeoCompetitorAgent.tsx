"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApiBody, adminApiHeaders, getStoredAdminApiToken, rememberAdminApiToken } from "@/lib/admin-client-auth";
import type { SeoCompetitorAnalysisReport } from "@/lib/seo-competitor-agent";

type AgentMode = "idle" | "running" | "ready" | "error";

const defaultCompetitors = "heygen.com\nrunwayml.com\ncreatify.ai";
const defaultKeywords = "ai video generator\nai product video generator\nshopify video ad maker\nheygen alternative\nrunway alternative";

export function AdminSeoCompetitorAgent() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [ownDomain, setOwnDomain] = useState("crelavo.com");
  const [competitors, setCompetitors] = useState(defaultCompetitors);
  const [keywords, setKeywords] = useState(defaultKeywords);
  const [locationName, setLocationName] = useState("United States");
  const [languageCode, setLanguageCode] = useState("en");
  const [mode, setMode] = useState<AgentMode>("idle");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<SeoCompetitorAnalysisReport | null>(null);

  useEffect(() => {
    setAdminToken(getStoredAdminApiToken());
  }, []);

  const canRun = useMemo(() => Boolean(adminEmail.trim() && ownDomain.trim() && competitors.trim() && keywords.trim()), [adminEmail, ownDomain, competitors, keywords]);

  async function runAnalysis() {
    setMode("running");
    setMessage("");
    setReport(null);
    try {
      rememberAdminApiToken(adminToken);
      const response = await fetch("/api/admin/seo-competitor-agent", {
        method: "POST",
        headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
        body: JSON.stringify(adminApiBody({
          own_domain: ownDomain,
          competitors,
          keywords,
          location_name: locationName,
          language_code: languageCode
        }, adminEmail, adminToken))
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "SEO competitor analysis failed.");
      setReport(data.report as SeoCompetitorAnalysisReport);
      setMode("ready");
      setMessage("Rakip analiz raporu hazır. Sonuçları sayfa planına çevirirken guardrail’leri koru.");
    } catch (error) {
      setMode("error");
      setMessage(error instanceof Error ? error.message : "SEO competitor analysis failed.");
    }
  }

  return (
    <section className="card admin-wide-card" style={{ marginTop: 20 }}>
      <span className="badge">DataForSEO · Rakip analiz ajanı</span>
      <h2>Rakip keyword boşluklarını güvenli SEO aksiyonlarına çevir</h2>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>Bu araç yalnızca SERP/keyword sinyali toplar; ücretli medya üretimi, reklam başlatma veya sahte claim üretmez. Rakipleri kötülemeden landing page, comparison page ve içerik fırsatı çıkarır.</p>

      <div className="brief-two-col">
        <label>Admin email<input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="admin@example.com" /></label>
        <label>Admin API token<input value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Optional if configured" /></label>
        <label>Own domain<input value={ownDomain} onChange={(event) => setOwnDomain(event.target.value)} placeholder="crelavo.com" /></label>
        <label>Market<input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="United States" /></label>
        <label>Language code<input value={languageCode} onChange={(event) => setLanguageCode(event.target.value)} placeholder="en" /></label>
      </div>

      <div className="brief-two-col" style={{ marginTop: 12 }}>
        <label>Competitor domains<textarea value={competitors} onChange={(event) => setCompetitors(event.target.value)} placeholder="one domain per line" /></label>
        <label>Keywords<textarea value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="one keyword per line" /></label>
      </div>

      <button className="btn" type="button" onClick={runAnalysis} disabled={!canRun || mode === "running"}>{mode === "running" ? "Analyzing..." : "Run safe competitor SEO analysis"}</button>
      {message ? <p className={`workspace-action-note ${mode === "error" ? "error" : ""}`}>{message}</p> : null}

      {report ? (
        <div style={{ marginTop: 16 }}>
          <div className="admin-info-grid">
            <div><span>Checked keywords</span><strong>{report.summary.checkedKeywords}</strong><small>{report.locationName} · {report.languageCode}</small></div>
            <div><span>Crelavo top 10</span><strong>{report.summary.ownTop10Count}</strong><small>{report.ownDomain}</small></div>
            <div><span>Competitor top 10 wins</span><strong>{report.summary.competitorTop10Wins}</strong><small>{report.competitors.join(", ")}</small></div>
            <div><span>Priority</span><strong>{report.summary.priority}</strong><small>Use Search Console before final publishing.</small></div>
          </div>

          <h3>Keyword fırsatları</h3>
          <div className="provider-job-list">
            {report.opportunities.map((item) => (
              <div className="provider-job-chip active" key={item.keyword}>
                <strong>{item.keyword} · {item.difficulty} · volume {item.searchVolume ?? "n/a"}</strong>
                <span>Crelavo rank: {item.ownRank ?? "not top 10"}</span>
                <small>{item.contentGap}</small>
                <small>{item.action}</small>
              </div>
            ))}
          </div>

          <h3>SEO aksiyon planı</h3>
          <div className="provider-job-list">
            {report.actionPlan?.map((item) => (
              <div className="provider-job-chip active" key={`${item.keyword}-${item.pageType}`}>
                <strong>{item.priority} · {item.estimatedImpact} impact · {item.automationStatus}</strong>
                <span>{item.pageSlug} · {item.cluster} · {item.pageType}</span>
                <small>{item.brief}</small>
                <small>H1: {item.contentBrief.h1}</small>
                <small>Title: {item.contentBrief.titleTag}</small>
                <small>Meta: {item.contentBrief.metaDescription}</small>
                <small>Sections: {item.contentBrief.sections.join(" → ")}</small>
                <small>FAQ: {item.contentBrief.faqs.join(" | ")}</small>
                <small>Internal links: {item.internalLinks.join(", ")}</small>
              </div>
            ))}
          </div>

          <h3>Otomatik üretim kuyruğu</h3>
          <div className="provider-job-list">
            {report.automationQueue?.map((item) => (
              <div className="provider-job-chip active" key={`${item.keyword}-${item.pageSlug}`}>
                <strong>{item.status}</strong>
                <span>{item.pageSlug}</span>
                <small>{item.keyword}: {item.nextStep}</small>
              </div>
            ))}
          </div>

          <h3>Internal link kuyruğu</h3>
          <div className="provider-job-list">
            {report.internalLinkQueue?.slice(0, 16).map((item) => (
              <div className="provider-job-chip active" key={`${item.from}-${item.to}-${item.anchor}`}>
                <strong>{item.from} → {item.to}</strong>
                <span>{item.anchor}</span>
                <small>{item.reason}</small>
              </div>
            ))}
          </div>

          <h3>Önerilen sayfalar</h3>
          <div className="admin-category-grid">
            {report.recommendedPages.map((page) => (
              <div className="card admin-category-card" key={page.title}>
                <span className="badge">SEO action</span>
                <h3>{page.title}</h3>
                <small>{page.slug}</small>
                <p>{page.reason}</p>
                <small>{page.guardrail}</small>
              </div>
            ))}
          </div>

          <h3>Guardrails</h3>
          <ul>{report.guardrails.map((item) => <li key={item}>{item}</li>)}</ul>

          <details>
            <summary>Raw report JSON</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, maxHeight: 360, overflow: "auto" }}>{JSON.stringify(report, null, 2)}</pre>
          </details>
        </div>
      ) : null}
    </section>
  );
}
