"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase";

const STORE = "crelavo-aw-last-v2";
const OVERLAY_ID = "crelavo-aw-overlay";
const THREAD_ID = "crelavo-aw-thread";
const FILL = "rgb(7, 11, 24)";
const Z = "2147483000";
const SKIP_RE = /ugc lipstick|16:9 product hero|coffee landing|studio site|does not start production|download html|400 credits|pro \$9\.99/i;

type WorkJob = {
  brief?: string;
  type?: string;
  category?: string;
  json?: any;
  html?: string;
  localNote?: string;
  accent?: string;
  layout?: "stack" | "grid";
};

function qparams() {
  const p = new URLSearchParams(location.search);
  return { type: p.get("type") || p.get("idea") || "AI Video", category: p.get("category") || "video" };
}
function readStore(): WorkJob | null {
  try {
    const raw = sessionStorage.getItem(STORE) || localStorage.getItem(STORE) || "";
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : null;
  } catch { return null; }
}
function writeStore(job: WorkJob) {
  try {
    const s = JSON.stringify(job);
    sessionStorage.setItem(STORE, s);
    localStorage.setItem(STORE, s);
  } catch { /* ignore quota */ }
}
function textOf(el: EventTarget | null) {
  if (!el || !(el as HTMLElement).closest) return "";
  const n = el as HTMLElement;
  return (n.innerText || n.getAttribute("aria-label") || n.getAttribute("title") || "").replace(/\s+/g, " ").trim();
}
function closestText(el: EventTarget | null) {
  let n = el as HTMLElement | null;
  const parts: string[] = [];
  while (n && n !== document.body) { parts.push(textOf(n)); n = n.parentElement; }
  return parts.join(" ");
}
function isLiveEl(el: Element) {
  const t = (el as HTMLElement).innerText?.replace(/\s+/g, " ").trim() || "";
  return t === "LIVE" || t === "Live";
}
function escapeHtml(s: string) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function escapeAttr(s: string) { return escapeHtml(s).replace(/"/g, "&quot;"); }
function btnStyle() { return "background:#0b1220;color:#e8eef8;border:0;border-radius:999px;padding:8px 12px;font-size:12px;cursor:pointer"; }
function downloadBlob(data: string, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default function AssistantWorkBoot() {
  useEffect(() => {
    let job: WorkJob | null = readStore();
    let overlay: HTMLDivElement | null = null;
    let hideTimer: number | null = null;
    const origFetch = window.fetch.bind(window);
    let posting = false;

    function ensureOverlay() {
      overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.id = OVERLAY_ID;
      overlay.setAttribute("data-aw-boot", "hide-v3-fullbleed");
      overlay.style.cssText = [
        "position:fixed", "left:0", "right:0", "top:108px", "bottom:156px", `background:${FILL}`,
        `z-index:${Z}`, "overflow:auto", "border:none", "border-radius:0", "box-shadow:none", "color:#e8eef8",
        "font-family:Inter,ui-sans-serif,system-ui,sans-serif", "display:none",
      ].join(";");
      const thread = document.createElement("div");
      thread.id = THREAD_ID;
      thread.style.cssText = "min-height:280px;padding:18px 22px 28px;";
      overlay.appendChild(thread);
      document.body.appendChild(overlay);
      return overlay;
    }
    function raiseLive() {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("button,a,div"))) {
        if (overlay?.contains(el) || !isLiveEl(el)) continue;
        const btn = (el.closest("button,a") as HTMLElement) || el;
        btn.style.zIndex = "2147483001";
        if (getComputedStyle(btn).position === "static") btn.style.position = "relative";
      }
    }
    function place() {
      const ov = ensureOverlay();
      let top = 108, bottom = 156;
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
        if (ov.contains(el)) continue;
        const t = (el.innerText || "").replace(/\s+/g, " ").trim();
        if (t === "Outputs" || t === "AI Video") {
          const r = el.getBoundingClientRect();
          if (r.bottom > 40 && r.bottom < 160) top = Math.max(top, Math.round(r.bottom));
        }
        if (/^Describe what to make/i.test(t) && t.length < 80) {
          const r = el.getBoundingClientRect();
          if (r.top > 200) bottom = Math.max(120, Math.round(innerHeight - r.top));
        }
      }
      const ta = document.querySelector("textarea");
      if (ta) {
        const r = ta.getBoundingClientRect();
        if (r.top > 200) bottom = Math.max(120, Math.round(innerHeight - r.top + 8));
      }
      Object.assign(ov.style, { top: `${top}px`, bottom: `${bottom}px`, left: "0", right: "0", border: "none", borderRadius: "0", boxShadow: "none", background: FILL });
      raiseLive();
    }
    function hideCollector() {
      const ov = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
      if (!ov || ov.style.display === "none") {
        document.querySelectorAll("[data-aw-hid]").forEach((n) => {
          const el = n as HTMLElement;
          el.style.visibility = ""; el.style.pointerEvents = ""; el.removeAttribute("data-aw-hid");
        });
        return;
      }
      const band = ov.getBoundingClientRect();
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("body *"))) {
        if (el === document.body || el === document.documentElement || el.id === OVERLAY_ID || ov.contains(el)) continue;
        if (el.id === "crelavo-aw-boot-copy" || ["SCRIPT", "STYLE", "LINK"].includes(el.tagName) || el.closest?.(`#${OVERLAY_ID}`)) continue;
        let keep = false, p: HTMLElement | null = el;
        while (p && p !== document.body) { if (isLiveEl(p)) keep = true; p = p.parentElement; }
        if (keep) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom <= band.top + 2 || r.top >= band.bottom - 2) continue;
        if (r.top >= band.top - 4 && r.bottom <= band.bottom + 4) {
          el.setAttribute("data-aw-hid", "1"); el.style.visibility = "hidden"; el.style.pointerEvents = "none";
        }
      }
      raiseLive();
    }
    function showOverlay() { const ov = ensureOverlay(); ov.style.display = "block"; place(); hideCollector(); }
    function jobIdOf(json: any) { return json?.jobId || json?.id || json?.workId || json?.work_id || ""; }
    function htmlOf(json: any) { return json?.html || json?.resultHtml || json?.previewHtml || ""; }
    function scenesOf(json: any) { return json?.scenes || json?.storyboard || json?.result?.scenes || null; }

    function renderJob(next: WorkJob, statusLine?: string) {
      job = next; writeStore(next);
      const ov = ensureOverlay();
      const thread = ov.querySelector(`#${THREAD_ID}`) as HTMLDivElement;
      if (!thread) return;
      const json = next.json || {}, html = next.html || htmlOf(json), scenes = scenesOf(json);
      const msg = json.message || json.result || json.text || json.assistant || (typeof json.output === "string" ? json.output : "");
      const charged = json.charged ?? json.charge ?? json.spent, available = json.available ?? json.balance, http = json.http || json.status;
      const accent = next.accent || "rgba(34,211,238,.9)", layout = next.layout || "grid";
      const userBubble = next.brief ? `<div style="display:flex;justify-content:flex-end;margin:0 0 14px"><div style="max-width:72%;background:#10243a;color:#f8fbff;border-radius:16px;padding:10px 14px;font-size:14px;line-height:1.45">${escapeHtml(next.brief)}</div></div>` : "";
      let body = "";
      if (html) body = `<iframe title="preview" style="width:100%;min-height:360px;border:0;background:#fff;margin-top:8px" srcdoc="${escapeAttr(html)}"></iframe>`;
      else if (Array.isArray(scenes)) {
        const cards = scenes.map((s: any, i: number) => `<div style="background:#0b1220;padding:12px 14px;margin:0 0 10px"><div style="font-size:11px;letter-spacing:.06em;color:${accent};margin:0 0 6px">${escapeHtml(s.title || s.name || `SCENE ${i + 1}`)}</div><div style="font-size:14px;line-height:1.45;color:#e8eef8">${escapeHtml(s.text || s.body || s.description || JSON.stringify(s))}</div></div>`).join("");
        body = `<div style="margin:8px 0 0;display:${layout === "grid" ? "grid" : "block"};grid-template-columns:1fr 1fr;gap:10px">${cards}</div>`;
      } else if (msg) body = `<div style="font-size:14px;line-height:1.55;color:#e8eef8;white-space:pre-wrap;margin-top:8px">${escapeHtml(String(msg))}</div>`;
      else body = `<div style="font-size:14px;line-height:1.55;color:#aeb8cc;margin-top:8px">Final media uses the engine adapter when connected.</div>`;
      const note = next.localNote ? `<div style="margin-top:10px;font-size:12px;color:#fbbf24">${escapeHtml(next.localNote)}</div>` : "";
      const meta = [http != null ? `http ${http}` : "", charged != null ? `charged ${charged}` : "", available != null ? `available ${available}` : "", statusLine || ""].filter(Boolean).join(" ? ");
      thread.innerHTML = `${userBubble}<div style="font-size:13px;line-height:1.55;color:#e8eef8">${msg && html ? escapeHtml(String(msg)) : ""}</div>${body}${note}<div style="margin-top:14px;font-size:12px;color:#aeb8cc">${escapeHtml(meta)}</div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px"><button data-aw-act="copy" type="button" style="${btnStyle()}">Copy ? Free</button><button data-aw-act="layout" type="button" style="${btnStyle()}">Layout ? Free</button><button data-aw-act="color" type="button" style="${btnStyle()}">Color ? Free</button><button data-aw-act="download" type="button" style="${btnStyle()}">Download files</button></div>`;
      showOverlay();
    }
    function composerField(): HTMLTextAreaElement | HTMLInputElement | null {
      return document.querySelector("textarea") as HTMLTextAreaElement | null || document.querySelector('input[placeholder*="Describe" i]') as HTMLInputElement | null;
    }
    function grabText() { return (composerField()?.value || "").trim(); }
    function clearText() {
      const f = composerField(); if (!f) return;
      const proto = f.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(f, "");
      f.value = ""; f.dispatchEvent(new Event("input", { bubbles: true })); f.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function shouldSkipTarget(t: EventTarget | null) {
      const blob = `${textOf(t)} ${closestText(t)}`.toLowerCase();
      return SKIP_RE.test(blob) || (/\blive\b/.test(blob) && blob.length < 24) || !!(overlay && t && overlay.contains(t as Node));
    }
    function isSendButton(t: EventTarget | null) {
      if (!t || !(t as HTMLElement).closest) return false;
      const el = t as HTMLElement; if (overlay?.contains(el)) return false;
      const btn = el.closest("button,a,[role=button]") as HTMLElement | null; if (!btn) return false;
      const label = textOf(btn); if (label === "?" || label === "?" || /send/i.test(label)) return true;
      const r = btn.getBoundingClientRect(), f = composerField(); if (!f) return false;
      const cr = f.getBoundingClientRect();
      return Math.abs(r.left - cr.right) < 80 && Math.abs(r.top - cr.top) < 48 && r.width < 64 && r.height < 64 && r.width > 28;
    }
    async function postWork(body: Record<string, unknown>) {
      const headers: Record<string, string> = { "content-type": "application/json" };
      const { data } = await supabaseBrowser().auth.getSession();
      if (data.session?.access_token) headers.authorization = `Bearer ${data.session.access_token}`;
      const res = await origFetch("/api/assistant-work", { method: "POST", credentials: "include", headers, body: JSON.stringify(body) });
      let json: any = {}; try { json = await res.clone().json(); } catch { json = {}; }
      json.http = res.status; return { res, json };
    }
    async function sendProduce(brief: string) {
      if (!brief || posting || SKIP_RE.test(brief)) return;
      posting = true;
      const { type, category } = qparams();
      const pending: WorkJob = { brief, type, category, json: { message: "Working?" }, accent: job?.accent, layout: job?.layout };
      renderJob(pending); clearText();
      try {
        const { json } = await postWork({ action: "produce", type, category, brief, message: brief });
        renderJob({ brief, type, category, json, html: htmlOf(json), accent: pending.accent, layout: pending.layout });
      } catch { renderJob({ ...pending, json: { message: "Request failed. Previous result kept if any.", http: 0 } }); }
      finally { posting = false; }
    }
    async function revise(kind: "copy" | "layout" | "color") {
      if (!job) return;
      const next: WorkJob = { ...job };
      if (kind === "copy") next.localNote = "Copy preview ? Free";
      if (kind === "layout") { next.layout = job.layout === "stack" ? "grid" : "stack"; next.localNote = "Layout preview ? Free"; }
      if (kind === "color") { next.accent = job.accent?.includes("251,191,36") ? "rgba(34,211,238,.9)" : "rgba(251,191,36,.95)"; next.localNote = "Color preview ? Free"; }
      renderJob(next);
      try {
        const { json } = await postWork({ action: "revise", jobId: jobIdOf(job.json), kind, part: kind, message: `${kind}: free ${kind} update`, free: true, charge: false });
        const charged = Number(json.charged ?? json.charge ?? json.spent ?? 0);
        if (charged > 0) { renderJob({ ...next, localNote: "Server tried to charge. Local free preview kept." }); return; }
        renderJob({ ...next, json: { ...job.json, ...json, charged: 0 }, html: htmlOf(json) || next.html, localNote: next.localNote });
      } catch { renderJob({ ...next, localNote: "Local free preview kept." }); }
    }
    async function deliver() {
      if (!job) return;
      const html = job.html || htmlOf(job.json), name = (job.type || "crelavo").replace(/\s+/g, "-").toLowerCase();
      if (html) downloadBlob(html, `${name}.html`, "text/html");
      else downloadBlob(JSON.stringify(job.json || job, null, 2), `${name}-storyboard.json`, "application/json");
      try {
        const { json } = await postWork({ action: "deliver", jobId: jobIdOf(job.json), free: true, charge: false });
        const charged = Number(json.charged ?? json.charge ?? json.spent ?? 0);
        if (charged === 0 && typeof json.zip === "string") downloadBlob(json.zip, `${name}.zip`, "application/zip");
        if (charged === 0 && json.zipUrl) window.location.href = json.zipUrl;
      } catch { /* local download already done */ }
    }
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (t && overlay?.contains(t)) {
        const kind = t.closest("[data-aw-act]")?.getAttribute("data-aw-act");
        if (kind === "copy" || kind === "layout" || kind === "color") void revise(kind);
        if (kind === "download") void deliver();
        return;
      }
      if (shouldSkipTarget(t)) {
        if (SKIP_RE.test(textOf(t) + closestText(t))) { e.preventDefault(); e.stopPropagation(); }
        return;
      }
      if (!isSendButton(t)) return;
      const brief = grabText(); if (!brief) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); void sendProduce(brief);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.shiftKey || shouldSkipTarget(e.target)) return;
      const brief = grabText(); if (!brief) return;
      const f = composerField();
      if (f && e.target !== f && !f.contains(e.target as Node)) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "TEXTAREA" && tag !== "INPUT") return;
      }
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); void sendProduce(brief);
    }

    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await origFetch(input, init);
      try {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
        if (method === "POST" && /\/api\/assistant-work/.test(url)) {
          const json = await res.clone().json().catch(() => null);
          if (json && job && !posting) {
            const charged = Number(json.charged ?? json.charge ?? json.spent ?? 0);
            renderJob({ ...job, json: { ...json, http: res.status }, html: htmlOf(json) || job.html, localNote: charged > 0 && json.free ? "Server tried to charge. Local free preview kept." : job.localNote });
          }
        }
      } catch { /* ignore */ }
      return res;
    };
    const mo = new MutationObserver(() => {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => { place(); if (job && overlay?.style.display !== "none") hideCollector(); }, 80);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    ensureOverlay(); place();
    if (job && (job.brief || job.json || job.html)) renderJob(job);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
      window.fetch = origFetch; mo.disconnect(); if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return <span id="crelavo-aw-boot-copy" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Sign in to start production. Copy ? Free Layout ? Free Color ? Free Download files Production overlay ready on Create ? last job restores automatically ? do not send a new brief aw-boot-hide-v3-fullbleed</span>;
}
