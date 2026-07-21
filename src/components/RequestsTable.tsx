"use client";

import { useEffect, useState } from "react";
import { sampleRequests } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase";

type RequestRow = {
  id?: string;
  title: string;
  video_type?: string;
  type?: string;
  status: string;
  estimated_credits?: number;
  credits?: number;
  final_video_url?: string | null;
  preview_image_url?: string | null;
  preview_status?: string | null;
  preview_approved?: boolean | null;
  generation_status?: string | null;
  generation_provider?: string | null;
  generation_job_id?: string | null;
  generation_error?: string | null;
  caption?: string | null;
  hashtags?: string | null;
};

function statusClass(status: string) {
  if (status === "ready" || status === "Ready") return "ready";
  if (status === "in_production" || status === "In production") return "production";
  return "pending";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    in_production: "In production",
    ready: "Ready",
    failed: "Failed",
    cancelled: "Cancelled"
  };
  return map[status] ?? status;
}

export function RequestsTable() {
  const [rows, setRows] = useState<RequestRow[]>(sampleRequests);
  const [mode, setMode] = useState("demo");
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequests() {
      const { data: userData } = await supabaseBrowser().auth.getUser();

      if (!userData.user) {
        setRows([]);
        setMode("login");
        return;
      }

      fetch(`/api/requests?user_id=${userData.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.requests)) {
            setRows(data.requests);
            setMode("live");
            return;
          }
          setRows([]);
          setMode("error");
        })
        .catch(() => setMode("error"));
    }

    loadRequests();
  }, []);

  async function refreshGenerationStatus(item: RequestRow) {
    if (!item.id) return;

    setRefreshingId(item.id);
    setMessage("");

    const response = await fetch(`/api/generation/${item.id}/status`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Generation status could not be refreshed.");
      setRefreshingId(null);
      return;
    }

    setRows((currentRows) => currentRows.map((row) => row.id === item.id ? data.request : row));
    setMessage(data.request?.status === "ready" ? "Generation completed. Final video is ready." : "Generation status refreshed.");
    setRefreshingId(null);
  }

  async function cancelRequest(item: RequestRow) {
    if (!item.id || !confirm("If you cancel this automatic production, 50% of the reserved credits will be charged. Continue?")) return;

    setCancellingId(item.id);
    setMessage("");

    const { data: userData } = await supabaseBrowser().auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setMessage("Sign in is required to cancel a request.");
      setCancellingId(null);
      return;
    }

    const response = await fetch(`/api/requests/${item.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Request could not be cancelled.");
      setCancellingId(null);
      return;
    }

    setRows((currentRows) => currentRows.map((row) => row.id === item.id ? data.request : row));
    setMessage(`Request cancelled. ${data.cancellation_fee} credits were charged and ${data.refund_amount} reserved credits were released.`);
    setCancellingId(null);
  }

  return (
    <>
      <p style={{ color: "var(--muted)" }}>
        {mode === "live" ? "Showing your automatic video productions." : mode === "login" ? "Sign in to view your requests." : mode === "error" ? "Requests could not be loaded." : "Loading requests."}
      </p>
      {message ? <p className="form-message">{message}</p> : null}
      {rows.length === 0 ? (
        <div className="card workspace-empty-note" style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <span className="badge">No recent video requests</span>
          <h3>{mode === "login" ? "Sign in or start a production brief" : "Create the first tracked production"}</h3>
          <p style={{ color: "var(--muted)", margin: 0 }}>Use this area after automatic video jobs begin. If you are preparing a website, app, visual pack, brand kit, or campaign, start from the full production brief so delivery notes stay connected.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn" href="/dashboard/create">Start production</a>
            <a className="btn secondary" href="/dashboard/productions">Open production center</a>
            <a className="btn secondary" href="/dashboard/credits">Check credits</a>
          </div>
        </div>
      ) : null}
      {rows.length > 0 ? <table className="table">
        <thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Preview</th><th>Credits</th><th>Delivery</th><th>Action</th></tr></thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id ?? item.title}>
              <td>{item.title}</td>
              <td>{item.video_type ?? item.type}</td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <span className={`status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                  {item.generation_status ? <small style={{ color: "var(--muted)" }}>Generation: {item.generation_status}</small> : null}
                  {item.generation_provider ? <small style={{ color: "var(--muted)" }}>Provider: {item.generation_provider}</small> : null}
                  {item.generation_job_id ? <small style={{ color: "var(--muted)" }}>Job: {item.generation_job_id}</small> : null}
                  {item.generation_error ? <small style={{ color: "#fca5a5" }}>{item.generation_error}</small> : null}
                </div>
              </td>
              <td>
                {item.preview_image_url ? (
                  <div className="request-preview-cell">
                    <img src={item.preview_image_url} alt={`${item.title} production request preview image`} />
                    <small>{item.preview_approved ? "Preview approved" : item.preview_status ?? "Preview pending"}</small>
                  </div>
                ) : <span style={{ color: "var(--muted)" }}>No preview</span>}
              </td>
              <td>{item.estimated_credits ?? item.credits}</td>
              <td>
                {item.status === "ready" ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {item.final_video_url ? <a className="btn secondary" href={item.final_video_url} target="_blank" rel="noreferrer">Open video</a> : <span>Video link pending</span>}
                    {item.caption ? <small><strong>Caption:</strong> {item.caption}</small> : null}
                    {item.hashtags ? <small><strong>Hashtag:</strong> {item.hashtags}</small> : null}
                  </div>
                ) : (
                  <span style={{ color: "var(--muted)" }}>No delivery yet</span>
                )}
              </td>
              <td>
                {item.id && !["ready", "failed", "cancelled"].includes(item.status) ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {item.generation_job_id ? (
                      <button className="btn secondary" type="button" onClick={() => refreshGenerationStatus(item)} disabled={refreshingId === item.id}>
                        {refreshingId === item.id ? "Refreshing..." : "Refresh status"}
                      </button>
                    ) : null}
                    <button className="btn secondary" type="button" onClick={() => cancelRequest(item)} disabled={cancellingId === item.id}>
                      {cancellingId === item.id ? "Cancelling..." : "Cancel - keep 50% fee"}
                    </button>
                  </div>
                ) : (
                  <span style={{ color: "var(--muted)" }}>Closed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table> : null}
    </>
  );
}
