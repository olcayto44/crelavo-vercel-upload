"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken, rememberAdminApiToken } from "@/lib/admin-client-auth";

type AvatarPreviewAdmin = {
  provider?: string;
  route?: string;
  status?: string;
  sessionId?: string;
  previewUrl?: string;
  requestedAt?: string;
  message?: string;
};

type LiveSalesAgentAdminRow = {
  agent_id: string;
  user_id: string;
  status?: string | null;
  plan_id?: string | null;
  platform?: string | null;
  industry?: string | null;
  avatar_source?: string | null;
  avatar_role?: string | null;
  language?: string | null;
  voice?: string | null;
  tone?: string | null;
  product_info?: string | null;
  shipping_info?: string | null;
  order_info?: string | null;
  availability?: string | null;
  custom_schedule?: string | null;
  metadata?: (Record<string, unknown> & { avatarPreview?: AvatarPreviewAdmin }) | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const statusOptions = ["all", "draft", "active", "paused", "review_required", "disabled"];
const editableStatusOptions = ["draft", "active", "paused", "review_required", "disabled"];

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("tr-TR") : "-";
}

function shortText(value?: string | null, fallback = "-") {
  const clean = String(value ?? "").trim();
  if (!clean) return fallback;
  return clean.length > 120 ? `${clean.slice(0, 120)}...` : clean;
}

function metadataNotes(row: LiveSalesAgentAdminRow) {
  return String(row.metadata?.adminNotes ?? "");
}

function avatarPreviewFor(row: LiveSalesAgentAdminRow) {
  return row.metadata?.avatarPreview ?? null;
}

export function AdminLiveSalesAgentsPanel() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [agents, setAgents] = useState<LiveSalesAgentAdminRow[]>([]);
  const [selected, setSelected] = useState<LiveSalesAgentAdminRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("draft");
  const [adminNotes, setAdminNotes] = useState("");
  const [mode, setMode] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAdminToken(getStoredAdminApiToken());
  }, []);

  const stats = useMemo(() => {
    const total = agents.length;
    const active = agents.filter((agent) => agent.status === "active").length;
    const needsReview = agents.filter((agent) => agent.status === "review_required").length;
    const draft = agents.filter((agent) => !agent.status || agent.status === "draft").length;
    return { total, active, needsReview, draft };
  }, [agents]);

  async function loadAgents() {
    const cleanEmail = adminEmail.trim();
    if (!cleanEmail) {
      setMessage("Admin e-posta adresini gir.");
      return;
    }
    setMode("loading");
    setMessage("");
    try {
      rememberAdminApiToken(adminToken);
      const params = new URLSearchParams({ admin_email: cleanEmail, status: statusFilter, search });
      const response = await fetch(`/api/admin/live-sales-agents?${params.toString()}`, {
        headers: adminApiHeaders(cleanEmail, adminToken)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Live sales agents could not be loaded");
      const rows = Array.isArray(data.agents) ? data.agents : [];
      setAgents(rows);
      if (selected && !rows.some((row: LiveSalesAgentAdminRow) => row.agent_id === selected.agent_id)) setSelected(null);
      setMode("ready");
      setMessage(rows.length ? "Live Sales Agent kayıtları yüklendi." : "Henüz Live Sales Agent kaydı yok.");
    } catch (error) {
      setMode("error");
      setMessage(error instanceof Error ? error.message : "Live Sales Agents yüklenemedi.");
    }
  }

  function selectAgent(row: LiveSalesAgentAdminRow) {
    setSelected(row);
    setSelectedStatus(row.status || "draft");
    setAdminNotes(metadataNotes(row));
  }

  async function saveAgentOps() {
    if (!selected) return;
    const cleanEmail = adminEmail.trim();
    setMode("saving");
    setMessage("");
    try {
      rememberAdminApiToken(adminToken);
      const response = await fetch("/api/admin/live-sales-agents", {
        method: "PATCH",
        headers: adminApiHeaders(cleanEmail, adminToken, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          agent_id: selected.agent_id,
          status: selectedStatus,
          admin_notes: adminNotes,
          metadata: selected.metadata ?? {},
          admin_email: cleanEmail,
          admin_token: adminToken
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Live Sales Agent güncellenemedi");
      const updated = data.agent as LiveSalesAgentAdminRow;
      setSelected(updated);
      setAgents((current) => current.map((agent) => agent.agent_id === updated.agent_id ? updated : agent));
      setMode("ready");
      setMessage("Live Sales Agent yönetim durumu güncellendi.");
    } catch (error) {
      setMode("error");
      setMessage(error instanceof Error ? error.message : "Live Sales Agent güncellenemedi.");
    }
  }

  return (
    <div className="admin-main-stack">
      <section className="card admin-wide-card">
        <span className="badge">Live Sales Agents</span>
        <h3>Agent kayıtlarını yönet</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Kaydedilen canlı satış avatarlarını, platformlarını, ürün bilgisini ve operasyon durumunu buradan takip et.</p>
        <div className="brief-two-col">
          <label>Admin email<input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="admin@example.com" /></label>
          <label>Admin API token<input value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Opsiyonel" /></label>
        </div>
        <div className="brief-two-col" style={{ marginTop: 12 }}>
          <label>Arama<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="agent id, sektör, platform, ürün..." /></label>
          <label>Durum filtresi
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <button className="btn" type="button" onClick={loadAgents} disabled={mode === "loading"}>{mode === "loading" ? "Yükleniyor..." : "Agent kayıtlarını yükle"}</button>
        {message ? <p className={`workspace-action-note ${mode === "error" ? "error" : ""}`}>{message}</p> : null}
      </section>

      <section className="grid three">
        <div className="card"><span className="badge">Toplam</span><h3>{stats.total}</h3><p>Kaydedilen agent</p></div>
        <div className="card"><span className="badge">Aktif</span><h3>{stats.active}</h3><p>Yayına hazır / aktif</p></div>
        <div className="card"><span className="badge">İnceleme</span><h3>{stats.needsReview}</h3><p>Admin kontrolü isteyenler</p></div>
      </section>

      <div className="brief-two-col" style={{ alignItems: "start" }}>
        <section className="card admin-wide-card">
          <span className="badge">Liste</span>
          <h3>Son agent kayıtları</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Agent</th><th>Platform</th><th>Sektör</th><th>Durum</th><th>Güncelleme</th></tr></thead>
              <tbody>
                {agents.length ? agents.map((agent) => (
                  <tr key={agent.agent_id} onClick={() => selectAgent(agent)} style={{ cursor: "pointer" }}>
                    <td><strong>{agent.agent_id}</strong><br /><small>{agent.user_id}</small></td>
                    <td>{agent.platform || "-"}</td>
                    <td>{agent.industry || "-"}</td>
                    <td>{agent.status || "draft"}</td>
                    <td>{formatDate(agent.updated_at)}</td>
                  </tr>
                )) : <tr><td colSpan={5}>Kayıt yüklenmedi.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card admin-wide-card">
          <span className="badge">Detay</span>
          <h3>{selected ? selected.agent_id : "Bir agent seç"}</h3>
          {selected ? (
            <div className="admin-main-stack">
              <div className="workspace-action-note">
                <strong>{selected.platform || "Platform yok"} · {selected.industry || "Sektör yok"}</strong>
                <p>{selected.avatar_role || "Rol yok"} · {selected.language || "Dil yok"} · {selected.voice || "Ses yok"} · {selected.tone || "Ton yok"}</p>
                <small>Oluşturma: {formatDate(selected.created_at)} · Güncelleme: {formatDate(selected.updated_at)}</small>
              </div>

              <div className="workspace-action-note">
                <strong>Avatar preview / provider</strong>
                <p>{avatarPreviewFor(selected)?.provider || "Henüz provider yok"} · {avatarPreviewFor(selected)?.status || "preview başlatılmadı"}</p>
                {avatarPreviewFor(selected)?.route ? <small>Route: {avatarPreviewFor(selected)?.route}</small> : null}
                {avatarPreviewFor(selected)?.sessionId ? <small style={{ display: "block" }}>Session: {avatarPreviewFor(selected)?.sessionId}</small> : null}
                {avatarPreviewFor(selected)?.message ? <p>{avatarPreviewFor(selected)?.message}</p> : null}
                {avatarPreviewFor(selected)?.previewUrl ? <a className="btn secondary" href={avatarPreviewFor(selected)?.previewUrl} target="_blank" rel="noreferrer">Open avatar preview</a> : null}
              </div>

              <div className="brief-two-col">
                <label>Operasyon durumu
                  <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                    {editableStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>Admin notu
                  <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={3} placeholder="Avatar review, provider bağlantısı, müşteriye dönüş notu..." />
                </label>
              </div>
              <button className="btn" type="button" onClick={saveAgentOps} disabled={mode === "saving"}>{mode === "saving" ? "Kaydediliyor..." : "Durumu kaydet"}</button>

              <div className="workspace-action-note">
                <strong>Ürün / teklif</strong>
                <p>{shortText(selected.product_info)}</p>
                <strong>Kargo / teslimat</strong>
                <p>{shortText(selected.shipping_info)}</p>
                <strong>Sipariş desteği</strong>
                <p>{shortText(selected.order_info)}</p>
              </div>

              <div className="workspace-action-note" data-no-translate="true">
                <strong>Embed code</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>{`<script\n  src="https://www.crelavo.com/embed/live-sales-avatar.js"\n  data-agent-id="${selected.agent_id}"\n  data-platform="${String(selected.platform || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}"\n  data-position="bottom-right"\n  data-theme="dark">\n</script>`}</pre>
              </div>
            </div>
          ) : <p style={{ color: "var(--muted)" }}>Listeden bir kayıt seçince detay burada açılır.</p>}
        </section>
      </div>
    </div>
  );
}
