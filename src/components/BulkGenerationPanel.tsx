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
    setMessage(response.ok ? "CSV kontrol edildi. Geçerli satırlar kuyruğa alınabilir." : data.error ?? "CSV kontrol edilemedi.");
  }

  async function createBatch() {
    const { data: userData } = await supabaseBrowser().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return setMessage("Toplu üretim için giriş yapmalısın.");
    const response = await fetch("/api/bulk/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId, csv, title: "Bulk product videos" }) });
    const data = await response.json();
    setSummary(data.summary ?? null);
    setMessage(response.ok ? "Bulk batch oluşturuldu. Ürünler kontrollü kuyrukta işlenecek." : data.error ?? "Bulk batch oluşturulamadı.");
  }

  return (
    <div className="card">
      <span className="badge">📦 Bulk Generation Engine</span>
      <h3>CSV / Excel ürün listesiyle toplu video üretimi</h3>
      <p>Her ürün linki ayrı job olarak kuyruğa alınır. Kırık linkler API maliyeti doğmadan validasyon aşamasında yakalanır.</p>
      <div className="field"><label>CSV içeriği</label><textarea value={csv} onChange={(event) => setCsv(event.target.value)} /></div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn secondary" type="button" onClick={validate}>Ön Kontrol / Validasyon</button>
        <button className="btn" type="button" onClick={createBatch}>Kuyruğa Al</button>
      </div>
      {summary ? <pre style={{ whiteSpace: "pre-wrap", color: "#bae6fd" }}>{JSON.stringify(summary, null, 2)}</pre> : null}
      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
