"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import type { AdPerformanceScoreResult } from "@/lib/providers/types";

type ScoreResponse = {
  analysis: AdPerformanceScoreResult;
  production: { id: string; title: string; status: string };
  delivery: { json: string; markdown: string; manifest: string };
};

const scoreFields = [
  ["Hook", "hook"],
  ["Message clarity", "messageClarity"],
  ["Target audience", "targetAudience"],
  ["Value proposition", "valueProposition"],
  ["CTA", "cta"],
  ["Platform fit", "platformFit"]
] as const;

export function AdPerformanceScoreChecker() {
  const [adText, setAdText] = useState("");
  const [productBrief, setProductBrief] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [platform, setPlatform] = useState("TikTok / Instagram Reels");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const [{ data: userData }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
      const user = userData.user;
      const accessToken = sessionData.session?.access_token ?? "";
      if (!user || !accessToken) throw new Error("You must sign in to run a real analysis.");

      let material: Record<string, unknown> | undefined;
      if (file) {
        const formData = new FormData();
        formData.append("user_id", user.id);
        formData.append("purpose", "ad_score_reference");
        formData.append("file", file);
        const uploadResponse = await fetch("/api/materials/upload", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: formData });
        const uploadData = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok) throw new Error(uploadData?.error || "Reference file upload failed.");
        material = { ...uploadData.material, client_name: file.name, client_type: file.type, client_size_bytes: file.size };
      }

      const response = await fetch("/api/ads/score", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ user_id: user.id, ad_text: adText, product_brief: productBrief, product_url: productUrl, platform, material })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || data?.error || "Ad analysis failed.");
      setResult(data as ScoreResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ad analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card admin-wide-card" style={{ marginTop: 18 }}>
      <span className="badge">Real AI analysis</span>
      <h2>Test your ad before spending production budget</h2>
      <p style={{ color: "var(--muted)" }}>Ad copy and a product/campaign brief are required. You can also add a product link or an MP4/MOV/WEBM/image reference.</p>
      <div className="field"><label htmlFor="ad-score-text">Ad copy or script</label><textarea id="ad-score-text" value={adText} onChange={(event) => setAdText(event.target.value)} rows={7} placeholder="Hook, body copy, offer and CTA..." /></div>
      <div className="field" style={{ marginTop: 12 }}><label htmlFor="ad-score-brief">Product / campaign brief</label><textarea id="ad-score-brief" value={productBrief} onChange={(event) => setProductBrief(event.target.value)} rows={5} placeholder="What the product does, who it is for, pricing/offer, proof, goal and constraints..." /></div>
      <div className="admin-info-grid" style={{ marginTop: 12 }}>
        <div className="field"><label htmlFor="ad-score-url">Product or campaign link (optional)</label><input id="ad-score-url" value={productUrl} onChange={(event) => setProductUrl(event.target.value)} placeholder="https://..." /></div>
        <div className="field"><label htmlFor="ad-score-platform">Target platform</label><select id="ad-score-platform" value={platform} onChange={(event) => setPlatform(event.target.value)}><option>TikTok / Instagram Reels</option><option>Meta Feed / Stories</option><option>YouTube Shorts</option><option>LinkedIn</option><option>Other</option></select></div>
      </div>
      <div className="field" style={{ marginTop: 12 }}><label htmlFor="ad-score-file">Video or image reference (optional, maximum 50 MB)</label><input id="ad-score-file" type="file" accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
      {error ? <p role="alert" style={{ color: "#f87171", marginTop: 12 }}>{error}</p> : null}
      <button className="btn" type="button" onClick={analyze} disabled={loading || !adText.trim() || !productBrief.trim()} style={{ marginTop: 14 }}>{loading ? "Running real analysis..." : "Analyze ad"}</button>
      {result ? <div className="card admin-wide-card" style={{ marginTop: 18 }}>
        <div className="sample-video-head"><div><span className="badge">Analysis complete</span><h2>{result.analysis.totalScore}/100</h2><p>{result.analysis.verdict}</p></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><a className="btn secondary" href={result.delivery.json} download>Download JSON</a><a className="btn secondary" href={result.delivery.markdown} download>Download Markdown</a></div></div>
        <div className="admin-category-grid" style={{ marginTop: 14 }}>{scoreFields.map(([label, key]) => { const section = result.analysis[key]; return <div className="card admin-category-card" key={key}><span className="badge">{label}</span><h3>{section.score}/100</h3><p>{section.analysis}</p></div>; })}</div>
        <div className="admin-info-grid" style={{ marginTop: 14 }}><div><span>Risks</span><ul>{result.analysis.risks.map((item) => <li key={item}>{item}</li>)}</ul></div><div><span>Improvement recommendations</span><ul>{result.analysis.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
        <div className="card" style={{ marginTop: 14 }}><span className="badge">Rewritten ad brief/script</span><p style={{ whiteSpace: "pre-wrap" }}>{result.analysis.rewrittenBrief}</p><p style={{ whiteSpace: "pre-wrap" }}>{result.analysis.rewrittenScript}</p></div>
        <p style={{ marginTop: 14 }}><Link className="btn secondary" href={`/dashboard/productions/${result.production.id}`}>Open Work record</Link> <a className="btn secondary" href={result.delivery.manifest}>Delivery manifest</a></p>
      </div> : null}
    </section>
  );
}
