"use client";

/* components/assistant-work/AssistantPage.tsx
   Real assistant chat. No overlay. No old collector.
*/

import { CSSProperties, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const FILL = "rgb(7, 11, 24)";
const STORE_KEY = "crelavo-aw-last-v2";
const THREAD_ID = "crelavo-aw-thread";

type Scene = { title?: string; text?: string; body?: string; description?: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  html?: string | null;
  scenes?: Scene[] | null;
  status?: string;
  warning?: string | null;
};

const btnStyle: CSSProperties = {
  background: "transparent",
  color: "rgba(165,243,252,0.95)",
  border: "none",
  padding: "6px 4px",
  cursor: "pointer",
  font: "inherit",
};

const roundBtn: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.2)",
  background: "rgb(11, 18, 32)",
  color: "inherit",
  cursor: "pointer",
};

function num(v: unknown, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function pickHtml(data: any): string | null {
  if (!data || typeof data !== "object") return null;
  const keys = [data.html, data.preview, data.output, data.result?.html, data.result?.preview, data.files?.html];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (typeof k === "string" && k.indexOf("<") !== -1) return k;
  }
  return null;
}

function pickScenes(data: any): Scene[] | null {
  const s = data?.scenes || data?.result?.scenes || data?.storyboard || data?.result?.storyboard;
  if (Array.isArray(s) && s.length) return s;
  return null;
}

function pickMessage(data: any): string | null {
  const m = data?.message || data?.result?.message || data?.text || data?.result?.text || data?.assistant;
  if (typeof m === "string" && m.trim()) return m;
  return null;
}

function pickZipUrl(data: any): string | null {
  const u = data?.zip_url || data?.zipUrl || data?.download_url || data?.file_url || data?.result?.zip_url;
  return typeof u === "string" && u ? u : null;
}

function downloadBlob(filename: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function AssistantPage() {
  const sp = useSearchParams();
  const type = sp.get("type") || sp.get("idea") || "Website";
  const category = sp.get("category") || "";
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [available, setAvailable] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant") || null;

  useEffect(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
      localStorage.removeItem(STORE_KEY);
    } catch {}
    document.querySelectorAll("#" + THREAD_ID).forEach((n) => n.remove());
    const disarm = (e: BeforeUnloadEvent) => {
      e.stopImmediatePropagation();
      try {
        (e as any).returnValue = undefined;
      } catch {}
    };
    window.addEventListener("beforeunload", disarm, true);
    return () => window.removeEventListener("beforeunload", disarm, true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/assistant-work", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data?.code === "sign_in") {
          setSignedIn(false);
          return;
        }
        setSignedIn(true);
        if (data?.available != null || data?.balance != null) {
          setAvailable(num(data.available ?? data.balance, 0));
        }
      } catch {
        if (!cancelled) setSignedIn(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  async function produce() {
    const brief = input.trim();
    if (!brief || busy) return;
    if (signedIn === false) {
      setError("Sign in to start production.");
      return;
    }
    setError(null);
    setInput("");
    const userMsg: Msg = { id: "u-" + Date.now(), role: "user", text: brief };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    try {
      const res = await fetch("/api/assistant-work", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "produce", type, category, brief }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.code === "sign_in") {
        setSignedIn(false);
        setError("Sign in to start production.");
        setBusy(false);
        return;
      }
      const charged = num(data?.charged ?? data?.charge ?? data?.spent, 0);
      const avail = data?.available == null && data?.balance == null ? null : num(data?.available ?? data?.balance, 0);
      if (avail != null) setAvailable(avail);
      const html = pickHtml(data);
      const scenes = pickScenes(data);
      const text = pickMessage(data) || (scenes || html ? "" : "Final media uses the engine adapter when connected.");
      setMessages((m) => [
        ...m,
        {
          id: "a-" + Date.now(),
          role: "assistant",
          text,
          html,
          scenes,
          status: "http " + res.status + " · charged " + charged + (avail == null ? "" : " · available " + avail),
          warning: data?.warning ? String(data.warning) : null,
        },
      ]);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void produce();
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void produce();
    }
  }

  async function onRevise(kind: "copy" | "layout" | "color") {
    if (!lastAssistant) return;
    const id = lastAssistant.id;
    setMessages((m) =>
      m.map((msg) => (msg.id === id ? { ...msg, status: kind + " · Free · 0 credits", warning: null } : msg))
    );
    try {
      const res = await fetch("/api/assistant-work", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revise", kind, free: true, charge: false }),
      });
      const data = await res.json().catch(() => ({}));
      const charged = num(data?.charged ?? data?.charge ?? data?.spent, 0);
      if (charged > 0) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === id
              ? { ...msg, warning: "server charged " + charged + " · local preview kept" }
              : msg
          )
        );
      }
    } catch {}
  }

  async function onDownload() {
    if (!lastAssistant) return;
    if (lastAssistant.html) {
      downloadBlob("crelavo-output.html", new Blob([lastAssistant.html], { type: "text/html;charset=utf-8" }));
    } else {
      const payload = lastAssistant.scenes || { brief: lastAssistant.text || "" };
      downloadBlob("crelavo-storyboard.json", new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    }
    try {
      const res = await fetch("/api/assistant-work", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deliver" }),
      });
      const data = await res.json().catch(() => ({}));
      const charged = num(data?.charged ?? data?.charge ?? data?.spent, 0);
      if (charged !== 0) return;
      const zip = pickZipUrl(data);
      if (zip) {
        const a = document.createElement("a");
        a.href = zip;
        a.download = "crelavo-files.zip";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      if (typeof data?.zip_base64 === "string" && data.zip_base64) {
        const bin = atob(data.zip_base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        downloadBlob("crelavo-files.zip", new Blob([bytes], { type: "application/zip" }));
      }
    } catch {}
  }

  const star = available == null ? "—" : String(available);

  return (
    <div style={{ minHeight: "100vh", background: FILL, color: "rgba(226,232,240,0.96)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <a href="/dashboard" style={{ color: "inherit", textDecoration: "none", fontSize: 18 }}>
          ‹
        </a>
        <div style={{ color: "rgb(14,165,233)", fontWeight: 600 }}>{type}</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}>
          <a href="/dashboard/productions" style={{ color: "inherit", textDecoration: "none" }}>
            Outputs
          </a>
          <span>★ {star}</span>
        </div>
      </div>

      <div
        ref={listRef}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 56,
          bottom: 156,
          overflow: "auto",
          padding: "20px 20px 12px",
          background: FILL,
        }}
      >
        {messages.length === 0 && !busy ? (
          <div style={{ textAlign: "center", paddingTop: 72, opacity: 0.85 }}>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Describe what to make</div>
            <div style={{ opacity: 0.7 }}>Send a brief. Production starts on send, not on download.</div>
          </div>
        ) : null}
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 16 }}>
            {msg.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    maxWidth: "72%",
                    background: "rgba(34,211,238,0.12)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ) : (
              <div>
                {msg.text ? <div style={{ lineHeight: 1.5, marginBottom: 10 }}>{msg.text}</div> : null}
                {msg.scenes
                  ? msg.scenes.map((s, i) => (
                      <div key={i} style={{ marginBottom: 10, lineHeight: 1.45 }}>
                        <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 2 }}>
                          {String(s.title || "SCENE " + (i + 1))}
                        </div>
                        <div>{String(s.text || s.body || s.description || "")}</div>
                      </div>
                    ))
                  : null}
                {msg.html ? (
                  <iframe
                    title="preview"
                    srcDoc={msg.html}
                    style={{ width: "100%", minHeight: 280, border: 0, background: FILL, display: "block" }}
                  />
                ) : null}
                {msg.status ? <div style={{ opacity: 0.55, fontSize: 12, margin: "8px 0" }}>{msg.status}</div> : null}
                {msg.warning ? <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: 8 }}>{msg.warning}</div> : null}
              </div>
            )}
          </div>
        ))}
        {busy ? <div style={{ opacity: 0.7 }}>working…</div> : null}
        {error ? <div style={{ color: "#fbbf24", marginTop: 8 }}>{error}</div> : null}
        {lastAssistant ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, fontSize: 13 }}>
            <button type="button" onClick={() => void onRevise("copy")} style={btnStyle}>
              Copy · Free
            </button>
            <button type="button" onClick={() => void onRevise("layout")} style={btnStyle}>
              Layout · Free
            </button>
            <button type="button" onClick={() => void onRevise("color")} style={btnStyle}>
              Color · Free
            </button>
            <button type="button" onClick={() => void onDownload()} style={btnStyle}>
              Download files
            </button>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 52,
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "10px 16px",
          background: FILL,
        }}
      >
        <button type="button" aria-label="attach" style={roundBtn}>
          +
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Describe what to make..."
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            background: "rgb(11, 18, 32)",
            color: "inherit",
            border: "1px solid rgba(148,163,184,0.18)",
            borderRadius: 999,
            padding: "12px 16px",
            outline: "none",
            font: "inherit",
          }}
        />
        <button type="submit" aria-label="send" style={{ ...roundBtn, background: "rgb(14,165,233)", color: "#fff", border: 0 }}>
          ↑
        </button>
      </form>

      <button
        type="button"
        aria-label="LIVE"
        style={{
          position: "fixed",
          right: 18,
          bottom: 118,
          width: 52,
          height: 52,
          borderRadius: 999,
          border: "1px solid rgba(34,211,238,0.35)",
          background: "rgb(11, 18, 32)",
          color: "rgb(125,211,252)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.4,
        }}
      >
        LIVE
      </button>

      <a
        href="/pricing"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 10,
          transform: "translateX(-50%)",
          background: "rgb(14,165,233)",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 999,
          padding: "10px 48px",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Pro $9.99/mo
      </a>
    </div>
  );
}
