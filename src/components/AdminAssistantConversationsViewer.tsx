"use client";

import { useEffect, useState } from "react";
import { adminApiHeaders, getStoredAdminApiToken, rememberAdminApiToken } from "@/lib/admin-client-auth";

type ConversationRow = {
  id: string;
  user_id: string;
  user_email?: string | null;
  title: string;
  channel: string;
  admin_status?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  mode?: string | null;
  language?: string | null;
  created_at?: string | null;
};

const adminStatusOptions = ["new", "reviewed", "needs_follow_up", "converted_to_request", "closed"];

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

export function AdminAssistantConversationsViewer() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selected, setSelected] = useState<ConversationRow | null>(null);
  const [adminStatus, setAdminStatus] = useState("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [savingOps, setSavingOps] = useState(false);
  const [mode, setMode] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAdminToken(getStoredAdminApiToken());
  }, []);

  async function loadConversations() {
    const cleanEmail = adminEmail.trim();
    if (!cleanEmail) {
      setMessage("Enter admin email to load assistant conversations.");
      return;
    }
    setMode("loading");
    setMessage("");
    try {
      rememberAdminApiToken(adminToken);
      const response = await fetch(`/api/admin/assistant-conversations?admin_email=${encodeURIComponent(cleanEmail)}`, {
        headers: adminApiHeaders(cleanEmail, adminToken)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load assistant conversations");
      const nextRows = Array.isArray(data.conversations) ? data.conversations : [];
      setConversations(nextRows);
      setMessages([]);
      setSelected(null);
      setMode("ready");
      setMessage(nextRows.length ? "Assistant conversations loaded." : "No assistant conversations yet.");
    } catch (error) {
      setMode("error");
      setMessage(error instanceof Error ? error.message : "Could not load assistant conversations");
    }
  }

  async function loadMessages(row: ConversationRow) {
    const cleanEmail = adminEmail.trim();
    setSelected(row);
    setAdminStatus(row.admin_status || "new");
    setAdminNotes(row.admin_notes || "");
    setMode("loading_messages");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/assistant-conversations?admin_email=${encodeURIComponent(cleanEmail)}&conversation_id=${encodeURIComponent(row.id)}`, {
        headers: adminApiHeaders(cleanEmail, adminToken)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load assistant messages");
      const conversation = (data.conversation ?? row) as ConversationRow;
      setSelected(conversation);
      setAdminStatus(conversation.admin_status || "new");
      setAdminNotes(conversation.admin_notes || "");
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setMode("ready");
    } catch (error) {
      setMode("error");
      setMessage(error instanceof Error ? error.message : "Could not load assistant messages");
    }
  }

  async function saveConversationOps() {
    if (!selected) return;
    const cleanEmail = adminEmail.trim();
    setSavingOps(true);
    setMessage("");
    try {
      rememberAdminApiToken(adminToken);
      const response = await fetch("/api/admin/assistant-conversations", {
        method: "PATCH",
        headers: adminApiHeaders(cleanEmail, adminToken, { "Content-Type": "application/json" }),
        body: JSON.stringify({ id: selected.id, admin_status: adminStatus, admin_notes: adminNotes, admin_email: cleanEmail, admin_token: adminToken })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update assistant conversation");
      const updated = data.conversation as ConversationRow;
      setSelected(updated);
      setConversations((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage("Assistant conversation operations updated.");
    } catch (error) {
      setMode("error");
      setMessage(error instanceof Error ? error.message : "Could not update assistant conversation");
    } finally {
      setSavingOps(false);
    }
  }

  return (
    <div>
      <div className="brief-two-col">
        <label>Admin email<input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="admin@example.com" /></label>
        <label>Admin API token<input value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Optional if configured" /></label>
      </div>
      <button className="btn" type="button" onClick={loadConversations} disabled={mode === "loading"}>{mode === "loading" ? "Loading..." : "Load assistant conversations"}</button>
      {message ? <p className={`workspace-action-note ${mode === "error" ? "error" : ""}`}>{message}</p> : null}

      <div className="brief-two-col" style={{ marginTop: 16, alignItems: "start" }}>
        <div className="card admin-wide-card">
          <span className="badge">Conversation list</span>
          <h3>Recent assistant conversations</h3>
          {conversations.length ? conversations.map((row) => (
            <button key={row.id} type="button" className="workspace-action-note" style={{ display: "block", width: "100%", textAlign: "left", marginTop: 10, cursor: "pointer" }} onClick={() => loadMessages(row)}>
              <strong>{row.title}</strong>
              <p>{row.user_email || row.user_id}</p>
              <small>{row.channel} · {row.admin_status || "new"} · Updated {formatDate(row.updated_at)}</small>
            </button>
          )) : <p style={{ color: "var(--muted)" }}>No conversations loaded.</p>}
        </div>

        <div className="card admin-wide-card">
          <span className="badge">Conversation detail</span>
          <h3>{selected ? selected.title : "Select a conversation"}</h3>
          {selected ? <p style={{ color: "var(--muted)" }}>{selected.user_email || selected.user_id} · {formatDate(selected.updated_at)}</p> : null}
          {selected ? (
            <div className="workspace-action-note" style={{ marginBottom: 12 }}>
              <div className="brief-two-col">
                <label>Admin status
                  <select value={adminStatus} onChange={(event) => setAdminStatus(event.target.value)}>
                    {adminStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label>Admin notes
                  <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Follow-up notes, request status, operation context..." rows={3} />
                </label>
              </div>
              <button className="btn" type="button" onClick={saveConversationOps} disabled={savingOps}>{savingOps ? "Saving..." : "Save operations note"}</button>
            </div>
          ) : null}
          <div className="assistant-chat-log" data-no-translate="true" style={{ maxHeight: 520 }}>
            {messages.length ? messages.map((item) => (
              <div key={item.id} className={`assistant-message ${item.role === "assistant" ? "assistant" : "user"}`}>
                <strong>{item.role}</strong>
                <p>{item.content}</p>
                <small>{item.mode || "quick"} · {item.language || "-"} · {formatDate(item.created_at)}</small>
              </div>
            )) : <p style={{ color: "var(--muted)" }}>Select a conversation to see messages.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
