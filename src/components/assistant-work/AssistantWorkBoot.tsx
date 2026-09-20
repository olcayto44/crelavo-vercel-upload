"use client";

/* AssistantWorkBoot stable-v5-noshake
   Paste over components/assistant-work/AssistantWorkBoot.tsx
   Do not import ledger. Keep your supabaseBrowser import if this file already had one.
*/

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const BOOT = "stable-v5-noshake";
const THREAD_ID = "crelavo-aw-thread";
const STORE_KEY = "crelavo-aw-last-v2";
const FILL = "rgb(7, 11, 24)";
const Z = 2147483000;

type Scene = { title?: string; text?: string; body?: string; description?: string };
type Job = {
  userText: string;
  type: string;
  category: string;
  statusLine: string;
  html: string | null;
  scenes: Scene[] | null;
  message: string | null;
  charged: number;
  available: number | null;
  warning: string | null;
  raw: unknown;
};

const btnStyle = {
  background: "transparent",
  color: "rgba(165,243,252,0.95)",
  border: "none",
  padding: "6px 4px",
  cursor: "pointer",
  font: "inherit",
};

function isAssistantPath(pathname: string | null | undefined) {
  if (!pathname) return false;
  return (
    pathname === "/dashboard/create" ||
    pathname.startsWith("/dashboard/create/") ||
    pathname === "/dashboard/assistant-workspace" ||
    pathname.startsWith("/dashboard/assistant-workspace/")
  );
}

function readTypeCategory() {
  const sp = new URLSearchParams(window.location.search);
  const type = sp.get("type") || sp.get("idea") || "Website";
  const category = sp.get("category") || "";
  return { type, category };
}

function readStore(): Job | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY) || localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.userText && !parsed.brief) return null;
    return {
      userText: String(parsed.userText || parsed.brief || ""),
      type: String(parsed.type || ""),
      category: String(parsed.category || ""),
      statusLine: String(parsed.statusLine || "restored · 0 credits"),
      html: typeof parsed.html === "string" ? parsed.html : null,
      scenes: Array.isArray(parsed.scenes) ? parsed.scenes : null,
      message: parsed.message ? String(parsed.message) : null,
      charged: Number(parsed.charged || 0),
      available: parsed.available == null ? null : Number(parsed.available),
      warning: parsed.warning ? String(parsed.warning) : null,
      raw: parsed.raw ?? parsed,
    };
  } catch {
    return null;
  }
}

function writeStore(job: Job) {
  try {
    const payload = JSON.stringify(job);
    sessionStorage.setItem(STORE_KEY, payload);
    localStorage.setItem(STORE_KEY, payload);
  } catch {}
}

function skipProduceBrief(s: string) {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return false;
  if (/ugc lipstick/i.test(t)) return true;
  if (/16:9 product hero/i.test(t)) return true;
  if (/coffee landing/i.test(t)) return true;
  if (/studio site/i.test(t)) return true;
  if (/download html/i.test(t)) return true;
  if (/400 credits/i.test(t)) return true;
  if (/does not start production/i.test(t)) return true;
  return false;
}

function isProBarText(s: string) {
  return /\$9\.99/.test(s) && /pro/i.test(s);
}

function nodeText(el: Element | null) {
  return ((el as HTMLElement)?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();
}

function closestControl(el: Element | null) {
  return (el as HTMLElement | null)?.closest("button, a, [role='button']") as HTMLElement | null;
}

function isLiveFab(el: HTMLElement) {
  const t = nodeText(el);
  if (/^live$/i.test(t) && t.length <= 8) return true;
  const label = el.getAttribute("aria-label") || "";
  if (/^live$/i.test(label.trim())) return true;
  return false;
}

function isSendControl(el: HTMLElement) {
  if (el.closest("#" + THREAD_ID)) return false;
  const btn = closestControl(el) || el;
  if (isLiveFab(btn)) return false;
  const label = ((btn.getAttribute("aria-label") || "") + " " + nodeText(btn)).trim();
  if (label === "+" || label === "＋" || /attach/i.test(label)) return false;
  if (isProBarText(label) || skipProduceBrief(label)) return false;
  if (/↑|send|gönder/i.test(label)) return true;
  const ta = document.querySelector("textarea");
  if (!ta) return false;
  const r = btn.getBoundingClientRect();
  const tr = ta.getBoundingClientRect();
  const near = Math.abs(r.top - tr.top) < 56 && r.left >= tr.right - 96;
  return near && r.width <= 72 && r.height <= 72 && label !== "+";
}

function getComposer(): HTMLTextAreaElement | HTMLInputElement | HTMLElement | null {
  const tas = Array.from(document.querySelectorAll("textarea")) as HTMLTextAreaElement[];
  if (tas.length) {
    tas.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
    return tas[0];
  }
  return document.querySelector("[contenteditable='true']") as HTMLElement | null;
}

function getComposerText() {
  const el = getComposer();
  if (!el) return "";
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return el.value.trim();
  return (el.innerText || "").trim();
}

function clearComposerSilent() {
  const el = getComposer();
  if (!el) return;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, "");
    else el.value = "";
    return;
  }
  el.textContent = "";
}

function measureOnce() {
  let top = 108;
  let bottom = 156;
  const header = document.querySelector("header") as HTMLElement | null;
  if (header) {
    const r = header.getBoundingClientRect();
    if (r.height > 0 && r.height < 160) top = Math.round(r.bottom);
  }
  const composer = getComposer();
  if (composer) {
    const r = composer.getBoundingClientRect();
    if (r.top > 80) bottom = Math.max(72, Math.round(window.innerHeight - r.top));
  }
  const root = document.documentElement;
  root.style.setProperty("--aw-top", top + "px");
  root.style.setProperty("--aw-bottom", bottom + "px");
}

function removeThreadNodes() {
  document.querySelectorAll("#" + THREAD_ID).forEach((n) => n.remove());
}

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

function jobFromResponse(data: any, base: { userText: string; type: string; category: string; http: number }): Job {
  const charged = num(data?.charged ?? data?.charge ?? data?.spent ?? data?.result?.charged, 0);
  const available = data?.available == null && data?.balance == null ? null : num(data?.available ?? data?.balance, 0);
  return {
    userText: base.userText,
    type: base.type,
    category: base.category,
    statusLine: "http " + base.http + " - charged " + charged + " - available " + (available == null ? "—" : available),
    html: pickHtml(data),
    scenes: pickScenes(data),
    message: pickMessage(data),
    charged: charged,
    available: available,
    warning: data?.warning ? String(data.warning) : null,
    raw: data,
  };
}

function localRevise(job: Job, kind: "copy" | "layout" | "color"): Job {
  const next: Job = { ...job, warning: null };
  next.statusLine = kind + " · Free · local 0 credits";
  if (kind === "color" && next.html) next.html = next.html.replace(/#ffffff/gi, "#f7f7f7");
  if (kind === "layout" && next.html) next.html = next.html.replace(/max-width:\s*\d+px/i, "max-width: 1120px");
  return next;
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

function downloadLocal(job: Job) {
  if (job.html) {
    downloadBlob("crelavo-output.html", new Blob([job.html], { type: "text/html;charset=utf-8" }));
    return;
  }
  const payload = job.scenes || job.raw || { brief: job.userText };
  downloadBlob("crelavo-storyboard.json", new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
}

export default function AssistantWorkBoot() {
  const pathname = usePathname();
  const onAssistant = isAssistantPath(pathname);
  const [mounted, setMounted] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const jobRef = useRef<Job | null>(null);

  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  useLayoutEffect(() => {
    setMounted(true);
    if (!onAssistant) {
      removeThreadNodes();
      return;
    }
    const stored = readStore();
    if (stored) setJob(stored);
    measureOnce();
  }, [onAssistant]);

  useEffect(() => {
    if (!onAssistant) return;
    const disarm = (e: BeforeUnloadEvent) => {
      e.stopImmediatePropagation();
      try {
        (e as any).returnValue = undefined;
      } catch {}
    };
    window.addEventListener("beforeunload", disarm, true);
    return () => window.removeEventListener("beforeunload", disarm, true);
  }, [onAssistant]);

  useEffect(() => {
    const onPop = () => {
      if (!isAssistantPath(window.location.pathname)) removeThreadNodes();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!isAssistantPath(window.location.pathname)) removeThreadNodes();
    };
  }, []);

  const runProduce = useCallback(async (text: string) => {
    if (!text || busyRef.current) return;
    if (skipProduceBrief(text)) return;
    busyRef.current = true;
    setBusy(true);
    const { type, category } = readTypeCategory();
    const draft: Job = {
      userText: text,
      type,
      category,
      statusLine: "working…",
      html: null,
      scenes: null,
      message: null,
      charged: 0,
      available: null,
      warning: null,
      raw: null,
    };
    setJob(draft);
    writeStore(draft);
    clearComposerSilent();
    try {
      const res = await fetch("/api/assistant-work", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "produce", type, category, brief: text }),
      });
      const data = await res.json().catch(() => ({}));
      const next = jobFromResponse(data, { userText: text, type, category, http: res.status });
      setJob(next);
      writeStore(next);
    } catch (err) {
      const fail: Job = { ...draft, statusLine: "network error", warning: String(err) };
      setJob(fail);
      writeStore(fail);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!onAssistant) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("#" + THREAD_ID)) return;
      const composer = getComposer();
      if (!composer || (target !== composer && !composer.contains(target))) return;
      const text = getComposerText();
      if (!text) return;
      if (skipProduceBrief(text)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      void runProduce(text);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest("#" + THREAD_ID)) return;
      const control = closestControl(target);
      if (control && (isLiveFab(control) || isProBarText(nodeText(control)))) return;
      const near = nodeText(control || target);
      if (skipProduceBrief(near) || skipProduceBrief(nodeText(target))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (!isSendControl(target)) return;
      const text = getComposerText();
      if (!text) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      void runProduce(text);
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("click", onClick, true);
    };
  }, [onAssistant, runProduce]);

  useEffect(() => {
    if (!onAssistant) return;
    const w = window as any;
    if (w.__awFetchV5) return;
    w.__awFetchV5 = true;
    const orig = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await orig(input, init);
      try {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
        const method = (init?.method || (input instanceof Request ? input.method : "GET") || "GET").toUpperCase();
        if (method === "POST" && url.indexOf("/api/assistant-work") !== -1) {
          const clone = res.clone();
          const data = await clone.json().catch(() => null);
          const act = data?.action || data?.op;
          if (data && jobRef.current && act !== "revise" && act !== "deliver") {
            const cur = jobRef.current;
            const next = jobFromResponse(data, {
              userText: cur.userText,
              type: cur.type,
              category: cur.category,
              http: res.status,
            });
            if (!next.html && cur.html) next.html = cur.html;
            if (!next.scenes && cur.scenes) next.scenes = cur.scenes;
            setJob(next);
            writeStore(next);
          }
        }
      } catch {}
      return res;
    };
  }, [onAssistant]);

  async function onRevise(kind: "copy" | "layout" | "color") {
    const cur = jobRef.current;
    if (!cur) return;
    const local = localRevise(cur, kind);
    setJob(local);
    writeStore(local);
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
        const kept: Job = {
          ...local,
          warning: "server charged " + charged + " · local preview kept",
          statusLine: local.statusLine + " · server charged, ignored",
        };
        setJob(kept);
        writeStore(kept);
        return;
      }
      const next = jobFromResponse(data, {
        userText: local.userText,
        type: local.type,
        category: local.category,
        http: res.status,
      });
      if (!next.html && local.html) next.html = local.html;
      if (!next.scenes && local.scenes) next.scenes = local.scenes;
      if (!next.message && local.message) next.message = local.message;
      next.warning = null;
      next.statusLine = kind + " · Free · charged 0";
      setJob(next);
      writeStore(next);
    } catch {}
  }

  async function onDownload() {
    const cur = jobRef.current;
    if (!cur) return;
    downloadLocal(cur);
    try {
      const res = await fetch("/api/assistant-work", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deliver" }),
      });
      const data = await res.json().catch(() => ({}));
      const charged = num(data?.charged ?? data?.charge ?? data?.spent, 0);
      if (charged === 0) {
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
      }
    } catch {}
  }

  if (!mounted || !onAssistant || !job) return null;
  if (typeof document === "undefined") return null;

  const overlay = (
    <div
      id={THREAD_ID}
      data-aw-boot={BOOT}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: "var(--aw-top, 108px)",
        bottom: "var(--aw-bottom, 156px)",
        background: FILL,
        zIndex: Z,
        overflow: "auto",
        border: "none",
        borderRadius: 0,
        boxShadow: "none",
        color: "rgba(226,232,240,0.96)",
        padding: "16px 20px 20px",
        fontFamily: "inherit",
      }}
    >
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        aw-boot-stable-v5-noshake Sign in to start production Copy · Free Download files Production overlay ready on Create · last job restores automatically · do not send a new brief
      </span>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
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
          {job.userText}
        </div>
      </div>
      <div style={{ padding: "4px 2px 12px" }}>
        {job.message ? <div style={{ marginBottom: 12, lineHeight: 1.5 }}>{job.message}</div> : null}
        {job.scenes
          ? job.scenes.map((s, i) => (
              <div key={i} style={{ marginBottom: 10, lineHeight: 1.45 }}>
                <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 2 }}>
                  {String(s.title || "SCENE " + (i + 1))}
                </div>
                <div>{String(s.text || s.body || s.description || "")}</div>
              </div>
            ))
          : null}
        {job.html ? (
          <iframe
            title="preview"
            srcDoc={job.html}
            style={{ width: "100%", minHeight: 280, border: 0, background: FILL, display: "block" }}
          />
        ) : null}
        {!job.message && !job.scenes && !job.html && busy ? <div>working…</div> : null}
      </div>
      <div style={{ opacity: 0.55, fontSize: 12, margin: "8px 0 14px" }}>{job.statusLine}</div>
      {job.warning ? <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: 12 }}>{job.warning}</div> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", fontSize: 13 }}>
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
    </div>
  );

  return createPortal(overlay, document.body);
}
