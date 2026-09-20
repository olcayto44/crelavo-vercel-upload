"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type WorkResponse = { ok?: boolean; code?: string; message?: string };

function inAuthUi(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  return Boolean(el.closest('[role="dialog"], [data-auth], form[action*="login"], form[action*="sign"]'));
}

function isComposerField(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof HTMLElement) || inAuthUi(el)) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    const t = (el.type || "text").toLowerCase();
    return t === "text" || t === "search" || t === "";
  }
  return el.isContentEditable;
}

function composerNear(from?: EventTarget | null): HTMLElement | null {
  if (from && isComposerField(from)) return from;
  if (from instanceof Element) {
    const bar = from.closest("form, footer") || from.parentElement;
    const found = bar?.querySelector<HTMLElement>('textarea, input[type="text"], input:not([type]), [contenteditable="true"]');
    if (found && isComposerField(found)) return found;
  }
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('textarea, input[placeholder], input[type="text"], [contenteditable="true"]')).filter((n) => isComposerField(n));
  const described = nodes.find((n) => /describe what to make/i.test((n as HTMLInputElement).placeholder || n.getAttribute("aria-label") || ""));
  return described || nodes.at(-1) || null;
}

function readText(el: HTMLElement | null): string {
  if (!el) return "";
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return el.value.trim();
  return (el.textContent || "").trim();
}

function clearText(el: HTMLElement | null) {
  if (!el) return;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const desc = Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value");
    desc?.set?.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  el.textContent = "";
}

function isExampleClick(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const host = target.closest("button, a, [role='button'], article, figure, li");
  const t = (host?.textContent || "").toLowerCase();
  return /coffee landing|studio site/.test(t);
}

function isSendButton(target: EventTarget | null): boolean {
  if (!(target instanceof Element) || inAuthUi(target)) return false;
  const btn = target.closest<HTMLElement>("button, [role='button']");
  if (!btn || btn.closest("[data-aw-boot]")) return false;
  const text = `${btn.textContent || ""} ${btn.getAttribute("aria-label") || ""} ${btn.getAttribute("title") || ""}`;
  if (/pro\s*\$|sign in|create account|giriş|üye ol|outputs|coffee|studio|\blive\b/i.test(text)) return false;
  const compact = text.replace(/\s/g, "");
  if (compact === "+" || /attach|upload/i.test(text)) return false;
  if (/↑|⬆|send|gönder|submit|arrow.?up/i.test(text)) return true;
  const field = composerNear(btn);
  if (!field) return false;
  const bar = field.closest("form") || field.parentElement?.parentElement;
  if (!bar || !bar.contains(btn)) return false;
  const buttons = Array.from(bar.querySelectorAll<HTMLElement>("button, [role='button']")).filter((b) => {
    const tx = (b.textContent || "").trim();
    return tx !== "+" && !/pro/i.test(tx);
  });
  return buttons.at(-1) === btn;
}

export default function AssistantWorkBoot() {
  const busy = useRef(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const submit = async (text: string, el: HTMLElement | null) => {
      if (busy.current) return;
      busy.current = true;
      setBanner("Starting production…");
      try {
        const params = new URLSearchParams(window.location.search);
        const { data: sessionData } = await supabaseBrowser().auth.getSession();
        const token = sessionData.session?.access_token;
        const headers: Record<string, string> = { "content-type": "application/json" };
        if (token) headers.authorization = `Bearer ${token}`;
        const type = params.get("type") || "Website";
        const res = await fetch("/api/assistant-work", {
          method: "POST",
          headers,
          credentials: "same-origin",
          body: JSON.stringify({
            action: "produce",
            brief: text,
            message: text,
            type,
            typeName: type,
            category: params.get("category") || "website",
          }),
        });
        let data: WorkResponse = {};
        try {
          data = (await res.json()) as WorkResponse;
        } catch {
          data = { ok: false, message: `HTTP ${res.status}` };
        }
        if (!res.ok || data.ok === false) {
          setBanner(data.message || (data.code === "sign_in" ? "Sign in to start production." : data.code) || `HTTP ${res.status}`);
          return;
        }
        clearText(el);
        setBanner("Production started.");
      } catch (err) {
        setBanner(err instanceof Error ? err.message : "Send failed");
      } finally {
        busy.current = false;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.isComposing || e.keyCode === 229) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!isComposerField(e.target)) return;
      const el = composerNear(e.target);
      const text = readText(el);
      if (!text) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      void submit(text, el);
    };

    const onClick = (e: MouseEvent) => {
      if (isExampleClick(e.target) || !isSendButton(e.target)) return;
      const el = composerNear(e.target);
      const text = readText(el);
      if (!text) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      void submit(text, el);
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div data-aw-boot style={{ position: "fixed", left: 16, bottom: 120, zIndex: 30, maxWidth: 280, pointerEvents: "none", color: "#94a3b8", fontSize: 11, lineHeight: 1.45 }}>
      <div>Sign in to start production.</div>
      <div>Copy · Free · Layout · Free · Color · Free</div>
      <div>Voice · Environment · Product · Scene · Face · Wardrobe</div>
      <div>Download files</div>
      {banner ? <div style={{ color: "#7dd3fc", marginTop: 8, pointerEvents: "auto" }}>{banner}</div> : null}
    </div>
  );
}
