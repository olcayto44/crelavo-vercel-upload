"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken } from "@/lib/admin-client-auth";
import { supabaseBrowser } from "@/lib/supabase";
import { defaultDeliveryCreditRatesConfig, type DeliveryCreditRate, type DeliveryCreditRatesConfig } from "@/lib/delivery-credit-rates";

function updateByKey(items: DeliveryCreditRate[], key: string, updates: Partial<DeliveryCreditRate>) {
  return items.map((item) => item.key === key ? { ...item, ...updates } : item);
}

export function AdminDeliveryCreditRatesManager() {
  const [config, setConfig] = useState<DeliveryCreditRatesConfig>(defaultDeliveryCreditRatesConfig);
  const [adminEmail, setAdminEmail] = useState("");
  const [mode, setMode] = useState<"loading" | "ready" | "error" | "login">("loading");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseBrowser().auth.getUser();
      const email = userData.user?.email ?? "";
      const token = getStoredAdminApiToken();
      setAdminEmail(email);
      if (!email) {
        setMode("login");
        return;
      }
      const response = await fetch("/api/admin/delivery-credit-rates", { headers: adminApiHeaders(email, token) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Delivery credit rates could not be loaded.");
        setMode("error");
        return;
      }
      setConfig(data.config ?? defaultDeliveryCreditRatesConfig);
      setMode("ready");
    }
    load().catch(() => {
      setMessage("Delivery credit rates could not be loaded.");
      setMode("error");
    });
  }, []);

  const activeTotal = useMemo(() => config.rates.filter((rate) => rate.active).reduce((sum, rate) => sum + rate.credits, 0), [config]);

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/delivery-credit-rates", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, getStoredAdminApiToken(), { "Content-Type": "application/json" }),
      body: JSON.stringify({ config })
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error ?? "Delivery credit rates could not be saved.");
      return;
    }
    setConfig(data.config ?? config);
    setMessage("Delivery credit rates saved.");
  }

  if (mode === "loading") return <p style={{ color: "var(--muted)" }}>Loading delivery credit rates...</p>;
  if (mode === "login") return <p style={{ color: "var(--muted)" }}>Admin login required.</p>;
  if (mode === "error") return <p className="form-message">{message}</p>;

  return (
    <div className="admin-config-stack">
      <div className="admin-config-card">
        <span className="badge">Delivery pricing control</span>
        <h3>File delivery extra credit rates</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Change these rates when provider, storage, source package, 4K export or delivery costs change. Customers see only the final estimated reserve; these line items stay internal.</p>
        <div className="provider-monitor-grid">
          <div><span>Active rates</span><strong>{config.rates.filter((rate) => rate.active).length}</strong></div>
          <div><span>Max additive stack</span><strong>{activeTotal.toLocaleString()} credits</strong></div>
          <div><span>Pricing mode</span><strong>Admin managed</strong></div>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </div>

      <div className="admin-config-card">
        <div className="manual-delivery-grid">
          {config.rates.map((rate) => (
            <div className="admin-config-card" key={rate.key} style={{ margin: 0 }}>
              <label className={`option-toggle ${rate.active ? "active" : ""}`}>
                <input type="checkbox" checked={rate.active} onChange={(event) => setConfig((current) => ({ ...current, rates: updateByKey(current.rates, rate.key, { active: event.target.checked }) }))} />
                <span><strong>{rate.label}</strong><small>{rate.key}</small></span>
              </label>
              <div className="field" style={{ marginTop: 10 }}>
                <label>Credits</label>
                <input type="number" min="0" value={rate.credits} onChange={(event) => setConfig((current) => ({ ...current, rates: updateByKey(current.rates, rate.key, { credits: Number(event.target.value) || 0 }) }))} />
              </div>
            </div>
          ))}
        </div>
        <div className="admin-faq-actions" style={{ marginTop: 12 }}>
          <button className="btn" type="button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save delivery credit rates"}</button>
          <button className="btn secondary" type="button" onClick={() => setConfig(defaultDeliveryCreditRatesConfig)}>Reset defaults</button>
        </div>
      </div>
    </div>
  );
}
