"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const MARK = "aw-boot-route-v4-noleak";
const STORE = "crelavo-aw-last-v2";
const FILL = "rgb(7, 11, 24)";
const THREAD = "crelavo-aw-thread";

function isAssistantPath(pathname: string) {
  const p = (pathname || "").split("?")[0];
  return p === "/dashboard/create" || p.startsWith("/dashboard/create/") || p === "/dashboard/assistant-workspace" || p.startsWith("/dashboard/assistant-workspace/");
}
function loadLast(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORE) || localStorage.getItem(STORE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveLast(job: any) {
  try {
    const raw = JSON.stringify(job);
    sessionStorage.setItem(STORE, raw);
    localStorage.setItem(STORE, raw);
  } catch { /* ignore quota */ }
}
function getType() {
  const p = new URLSearchParams(window.location.search);
  return p.get("type") || p.get("idea") || "";
}
function getCategory() {
  const p = new URLSearchParams(window.location.search);
  return p.get("category") || "";
}
function getComposerField(): HTMLTextAreaElement | HTMLInputElement | HTMLElement | null {
  const ta = document.querySelector("textarea");
  if (ta instanceof HTMLTextAreaElement) return ta;
  const nodes = Array.from(document.querySelectorAll("input, [contenteditable='true']")) as HTMLElement[];
  return nodes.find((el) => /describe what to make/i.test(el.getAttribute("placeholder") || el.getAttribute("aria-label") || "")) || null;
}
function readComposer() {
  const el = getComposerField();
  if (!el) return "";
  if ("value" in el) return String((el as HTMLTextAreaElement).value || "").trim();
  return String(el.textContent || "").trim();
}
function clearComposer() {
  const el = getComposerField();
  if (!el) return;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const proto = Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, "value");
    proto?.set?.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  el.textContent = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
function restoreCollector() {
  document.querySelectorAll("[data-aw-hide]").forEach((node) => {
    const el = node as HTMLElement;
    el.style.visibility = el.dataset.awVis || "";
    el.style.pointerEvents = el.dataset.awPe || "";
    delete el.dataset.awHide;
    delete el.dataset.awVis;
    delete el.dataset.awPe;
  });
}
function hideCollector() {
  const hideRe = /what should we make|coffee landing|studio site|ugc lipstick|16:9 product hero|does not start production|pick options, then send a message/i;
  const keepRe = /describe what to make|pro \$9\.99|^live$/i;
  const all = Array.from(document.querySelectorAll("body *")) as HTMLElement[];
  for (const el of all) {
    if (el.id === THREAD || el.closest("#" + THREAD)) continue;
    if (el.closest("textarea, input, [contenteditable='true']")) continue;
    if (el.querySelector("textarea, input, [contenteditable='true']")) continue;
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t || t.length > 180 || !hideRe.test(t) || keepRe.test(t)) continue;
    if (!el.dataset.awHide) {
      el.dataset.awHide = "1";
      el.dataset.awVis = el.style.visibility || "";
      el.dataset.awPe = el.style.pointerEvents || "";
    }
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
  }
}
function measureBox() {
  let top = 108, bottom = 156;
  const outputs = Array.from(document.querySelectorAll("a,button,span,div")).find((el) => (el.textContent || "").trim() === "Outputs" && el.getBoundingClientRect().height < 48 && el.getBoundingClientRect().top < 140);
  if (outputs) {
    let bar: HTMLElement | null = outputs as HTMLElement;
    for (let i = 0; i < 6 && bar; i++) {
      const h = bar.getBoundingClientRect().height;
      if (h > 36 && h < 96) break;
      bar = bar.parentElement;
    }
    if (bar) top = Math.max(64, Math.round(bar.getBoundingClientRect().bottom));
  }
  const field = getComposerField();
  if (field) {
    const wrap = field.closest("form") || field.parentElement?.parentElement || field.parentElement;
    const r = (wrap || field).getBoundingClientRect();
    bottom = Math.max(96, Math.round(window.innerHeight - r.top));
  }
  return { top, bottom };
}
function labelOf(el: Element) {
  return `${el.getAttribute("aria-label") || ""} ${el.textContent || ""}`.replace(/\s+/g, " ").trim();
}
function skipTarget(el: Element) {
  const t = labelOf(el);
  if (/coffee landing|studio site|ugc lipstick|16:9 product hero|does not start production|download html|400 credits|pro \$9\.99/i.test(t)) return true;
  if (/^live$/i.test(t) || (/live/i.test(t) && t.length <= 8)) return true;
  return false;
}
function isLiveFab(el: Element) {
  const r = el.getBoundingClientRect();
  if (/^live$/i.test((el.textContent || "").trim())) return true;
  return r.right > window.innerWidth - 92 && r.bottom > window.innerHeight - 240 && r.width <= 80 && r.height <= 80;
}
function isSendControl(el: Element) {
  const btn = el.closest("button");
  if (!btn || skipTarget(btn) || isLiveFab(btn) || /pro\s*\$9\.99/i.test(labelOf(btn))) return false;
  const label = labelOf(btn);
  if (/send|submit/i.test(label) || (/[??]/.test(label) && label.length < 8)) return true;
  const r = btn.getBoundingClientRect();
  return r.bottom > window.innerHeight - 200 && r.width <= 56 && r.height <= 56 && r.left > 40 && r.right < window.innerWidth - 92;
}
function fromServer(json: any, userText: string) {
  const d = json?.data ?? json?.result ?? json ?? {};
  const scenes = d.scenes || d.storyboard?.scenes || (Array.isArray(d.storyboard) ? d.storyboard : null);
  const signIn = json?.code === "sign_in" || d.code === "sign_in" ? json?.message || d.message || "Sign in to start production." : "";
  return {
    userText,
    assistantText: signIn || d.message || d.assistantText || d.text || d.output || "",
    html: d.html || d.previewHtml || d.preview || "",
    scenes: Array.isArray(scenes) ? scenes : null,
    charged: d.charged ?? d.charge ?? json?.charged ?? 0,
    available: d.available ?? d.balance ?? json?.available ?? null,
    http: json?.http || d.http || json?.status || 200,
    warning: d.warning || signIn || "",
    raw: d,
    busy: false,
  };
}
async function api(body: any) {
  const res = await fetch("/api/assistant-work", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let json: any = null;
  try { json = await res.json(); } catch { json = { ok: false, message: "Bad response" }; }
  return { ok: res.ok, status: res.status, json };
}
function sceneText(scene: any, i: number) {
  if (typeof scene === "string") return { title: `SCENE ${i + 1}`, body: scene };
  return { title: scene.title || scene.heading || scene.name || `SCENE ${i + 1}`, body: scene.text || scene.body || scene.content || scene.description || "" };
}

export default function AssistantWorkBoot() {
  const pathname = usePathname() || "";
  const onAssistant = isAssistantPath(pathname);
  const [mounted, setMounted] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [box, setBox] = useState({ top: 108, bottom: 156 });
  const jobRef = useRef<any>(null);
  const busyRef = useRef(false);
  jobRef.current = job;

  useEffect(() => {
    setMounted(true);
    document.querySelectorAll("#" + THREAD).forEach((n) => { if (n.getAttribute("data-aw-react") !== "1") n.remove(); });
  }, []);
  useEffect(() => {
    if (!onAssistant) {
      restoreCollector();
      document.querySelectorAll("#" + THREAD).forEach((n) => n.remove());
      return;
    }
    const last = loadLast();
    if (last) setJob(last);
  }, [onAssistant]);
  useEffect(() => {
    if (!onAssistant || !job) { restoreCollector(); return; }
    hideCollector();
    const place = () => setBox(measureBox());
    place();
    window.addEventListener("resize", place);
    const tick = window.setInterval(place, 800);
    return () => { window.removeEventListener("resize", place); window.clearInterval(tick); };
  }, [onAssistant, job]);
  useEffect(() => {
    const sweep = () => {
      if (isAssistantPath(window.location.pathname)) return;
      restoreCollector();
      document.querySelectorAll("#" + THREAD).forEach((n) => n.remove());
    };
    const id = window.setInterval(sweep, 300);
    window.addEventListener("popstate", sweep);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("popstate", sweep);
      restoreCollector();
      document.querySelectorAll("#" + THREAD).forEach((n) => { if (!isAssistantPath(window.location.pathname)) n.remove(); });
    };
  }, []);
  useEffect(() => {
    if (!onAssistant) return;
    const produce = async (text: string) => {
      if (busyRef.current) return;
      const brief = text.trim();
      if (!brief) return;
      busyRef.current = true;
      const next = { userText: brief, assistantText: "", html: "", scenes: null, charged: 0, available: jobRef.current?.available ?? null, http: 0, warning: "", busy: true, raw: null };
      setJob(next); saveLast(next); clearComposer();
      try {
        const { status, json } = await api({ action: "produce", op: "produce", text: brief, brief, type: getType(), category: getCategory(), idea: getType() });
        const rendered = fromServer(json, brief); rendered.http = status; setJob(rendered); saveLast(rendered);
      } catch (err: any) {
        const fail = { ...next, busy: false, warning: String(err?.message || err || "Network error"), assistantText: "Could not reach production." };
        setJob(fail); saveLast(fail);
      } finally { busyRef.current = false; }
    };
    const onClick = (e: MouseEvent) => {
      if (!isAssistantPath(window.location.pathname)) return;
      const t = e.target;
      if (!(t instanceof Element) || t.closest("#" + THREAD) || skipTarget(t) || !isSendControl(t)) return;
      const text = readComposer(); if (!text) return;
      e.preventDefault(); e.stopPropagation(); (e as any).stopImmediatePropagation?.(); void produce(text);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isAssistantPath(window.location.pathname) || e.key !== "Enter" || e.shiftKey) return;
      const t = e.target;
      if (!(t instanceof Element) || t.closest("#" + THREAD)) return;
      const field = getComposerField();
      if (!field || (!field.contains(t) && t !== field)) return;
      const text = readComposer(); if (!text) return;
      e.preventDefault(); e.stopPropagation(); (e as any).stopImmediatePropagation?.(); void produce(text);
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
    return () => { window.removeEventListener("click", onClick, true); window.removeEventListener("keydown", onKey, true); };
  }, [onAssistant]);

  async function revise(kind: "copy" | "layout" | "color") {
    const current = jobRef.current;
    if (!current || busyRef.current) return;
    const local = { ...current, warning: `${kind[0].toUpperCase()}${kind.slice(1)} ? Free applied locally` };
    setJob(local); saveLast(local);
    try {
      const { json } = await api({ action: "revise", op: "revise", kind, free: true, charge: false });
      const charged = json?.charged ?? json?.data?.charged ?? 0;
      if (charged > 0) {
        const warned = { ...local, warning: "Server tried to charge. Local free preview kept." };
        setJob(warned); saveLast(warned); return;
      }
      if (json && (json.html || json.scenes || json.message || json.data)) {
        const next = fromServer(json, current.userText);
        next.charged = 0; next.warning = `${kind[0].toUpperCase()}${kind.slice(1)} ? Free`;
        setJob(next); saveLast(next);
      }
    } catch { /* keep local */ }
  }
  function downloadLocal(j: any) {
    const html = j?.html, name = html ? "crelavo-production.html" : "crelavo-storyboard.json";
    const blob = new Blob([html || JSON.stringify(j?.raw || j?.scenes || j, null, 2)], { type: html ? "text/html" : "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  async function deliver() {
    const j = jobRef.current; if (!j) return;
    downloadLocal(j);
    try {
      const { json } = await api({ action: "deliver", op: "deliver" });
      const charged = json?.charged ?? json?.data?.charged ?? 0;
      if (charged === 0) {
        const url = json?.zip || json?.data?.zip || json?.url || json?.data?.url;
        if (typeof url === "string" && url) window.open(url, "_self");
      }
    } catch { /* local file already saved */ }
  }

  const marker = <span data-aw-boot="route-v4-noleak" style={{ display: "none" }}>{MARK} Sign in to start production. Copy ? Free Layout ? Free Color ? Free Download files</span>;
  if (!mounted || !onAssistant || !job) return marker;
  const scenes = Array.isArray(job.scenes) ? job.scenes : [];
  const overlay = (
    <div id={THREAD} data-aw-react="1" data-aw-boot="route-v4-noleak" style={{ position: "fixed", left: 0, right: 0, top: box.top, bottom: box.bottom, zIndex: 2147483000, background: FILL, overflow: "auto", color: "#e8eefc", fontFamily: "Inter, system-ui, sans-serif", border: "none", borderRadius: 0, boxShadow: "none" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px 24px 32px" }}>
        {job.userText ? <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><div style={{ maxWidth: "72%", background: "rgba(34,211,238,.16)", color: "#e8fbff", borderRadius: 16, padding: "10px 14px", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{job.userText}</div></div> : null}
        <div style={{ marginBottom: 16, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{job.busy ? "Working?" : job.assistantText || (scenes.length ? "Final media uses the engine adapter when connected." : "")}</div>
        {job.html ? <iframe title="preview" srcDoc={job.html} sandbox="allow-same-origin" style={{ width: "100%", minHeight: 320, border: "none", background: "#fff", display: "block" }} /> : null}
        {scenes.map((scene: any, i: number) => { const s = sceneText(scene, i); return <div key={i} style={{ padding: "12px 0", marginBottom: 4 }}><div style={{ fontSize: 12, letterSpacing: 0.6, color: "#7dd3fc" }}>{s.title}</div><div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{s.body}</div></div>; })}
        <div style={{ marginTop: 18, fontSize: 12, color: "#94a3b8" }}>{job.busy ? "" : `http ${job.http || 200}${job.charged || job.charged === 0 ? ` - charged ${job.charged}` : ""}${job.available != null ? ` - available ${job.available}` : ""}`}{job.warning ? ` ? ${job.warning}` : ""}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          <button type="button" onClick={() => void revise("copy")} style={btnStyle}>Copy ? Free</button>
          <button type="button" onClick={() => void revise("layout")} style={btnStyle}>Layout ? Free</button>
          <button type="button" onClick={() => void revise("color")} style={btnStyle}>Color ? Free</button>
          <button type="button" onClick={() => void deliver()} style={btnStyle}>Download files</button>
        </div>
      </div>
    </div>
  );
  return <>{marker}{createPortal(overlay, document.body)}</>;
}

const btnStyle: React.CSSProperties = {
  background: "transparent",
  color: "#67e8f9",
  border: "1px solid rgba(34,211,238,.35)",
  borderRadius: 999,
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 13,
};
