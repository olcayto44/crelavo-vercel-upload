"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export function BulkGenerationPanel() {
  const [csv, setCsv] = useState("product_url,title\nhttps://your-shopify-store.com/products/example,Example Product");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);

  async function validate() {
    const response = await fetch("/api/bulk/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv }) });
    const data = await response.json();
    setSummary(data.summary ?? null);
    setMessage(response.ok ? "CSV checked. Valid rows can be prepared for the queue." : data.error ?? "CSV could not be checked.");
  }

  async function createBatch() {
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return setMessage("Sign in to create a bulk production batch.");
    const response = await fetch("/api/bulk/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId, csv, title: "Bulk product videos" }) });
    const data = await response.json();
    setSummary(data.summary ?? null);
    setMessage(response.ok ? "Bulk batch created. Items will be processed in the controlled queue." : data.error ?? "Bulk batch could not be created.");
  }

  return (
    <div className="card bulk-planning-card">
      <span className="badge">📦 Bulk Generation Engine</span>
      <h3>Bulk video production from a CSV / Excel product list</h3>
      <p>Each product link is prepared as a separate job. Broken links are caught during validation before provider/API cost is created.</p>
      <div className="brand-kit-flow-grid">
        <span><small>1</small><strong>Validate CSV</strong><em>Check columns, rows and broken product links first.</em></span>
        <span><small>2</small><strong>Prepare queue</strong><em>Create a controlled batch without pretending provider execution is live.</em></span>
        <span><small>3</small><strong>Review output</strong><em>Use production workspace and delivery notes when provider jobs are connected.</em></span>
      </div>
      <div className="field"><label>CSV content</label><textarea value={csv} onChange={(event) => setCsv(event.target.value)} /></div>
      <div className="postlaunch-action-row">
        <button className="btn secondary" type="button" onClick={validate}>Pre-check / Validate</button>
        <button className="btn" type="button" onClick={createBatch}>Prepare queue</button>
      </div>
      {summary ? <pre style={{ whiteSpace: "pre-wrap", color: "#bae6fd" }}>{JSON.stringify(summary, null, 2)}</pre> : null}
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
