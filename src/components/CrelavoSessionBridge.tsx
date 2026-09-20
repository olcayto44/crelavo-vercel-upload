"use client";

import { useEffect } from "react";

const FLAG = "crelavo-sb-bridged-v3";
const CHUNK = 3180;

function isJwt(s: string) {
  return /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(s);
}

function parseMaybe(raw: string): unknown {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("{") || t.startsWith("[")) {
    try { return JSON.parse(t); } catch { return t; }
  }
  return t;
}

function walkToken(v: unknown, depth = 0): string | null {
  if (v == null || depth > 8) return null;
  if (typeof v === "string") {
    if (isJwt(v)) return v;
    if (v.startsWith("{") || v.startsWith("[")) {
      try { return walkToken(JSON.parse(v), depth + 1); } catch { return null; }
    }
    return null;
  }
  if (Array.isArray(v)) {
    for (const item of v) { const found = walkToken(item, depth + 1); if (found) return found; }
    return null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["access_token", "accessToken"]) {
      if (typeof o[k] === "string" && isJwt(o[k] as string)) return o[k] as string;
    }
    for (const k of ["currentSession", "session", "data"]) {
      const found = walkToken(o[k], depth + 1);
      if (found) return found;
    }
    for (const val of Object.values(o)) { const found = walkToken(val, depth + 1); if (found) return found; }
  }
  return null;
}

function walkSessionJson(v: unknown, depth = 0): string | null {
  if (v == null || depth > 8) return null;
  if (typeof v === "string") {
    if (v.startsWith("{") || v.startsWith("[")) {
      try { return walkSessionJson(JSON.parse(v), depth + 1); } catch { return null; }
    }
    return null;
  }
  if (Array.isArray(v)) {
    for (const item of v) { const found = walkSessionJson(item, depth + 1); if (found) return found; }
    return null;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.access_token === "string" && isJwt(o.access_token)) return JSON.stringify(o);
    for (const k of ["currentSession", "session", "data"]) {
      const found = walkSessionJson(o[k], depth + 1);
      if (found) return found;
    }
    for (const val of Object.values(o)) { const found = walkSessionJson(val, depth + 1); if (found) return found; }
  }
  return null;
}

function storagePairs(): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  for (const store of [window.localStorage, window.sessionStorage]) {
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (!key) continue;
      const value = store.getItem(key);
      if (value) out.push({ key, value });
    }
  }
  return out;
}

function groupedAuth(): Map<string, string> {
  const map = new Map<string, { chunks: Record<number, string>; whole?: string }>();
  for (const { key, value } of storagePairs()) {
    const m = key.match(/^(sb-[A-Za-z0-9_-]+-auth-token)(?:\.(\d+))?$/i);
    if (!m) continue;
    const base = m[1];
    const cur = map.get(base) || { chunks: {} };
    if (m[2] == null) cur.whole = value;
    else cur.chunks[Number(m[2])] = value;
    map.set(base, cur);
  }
  const result = new Map<string, string>();
  for (const [base, cur] of map) {
    const idxs = Object.keys(cur.chunks).map(Number).sort((a, b) => a - b);
    if (idxs.length) result.set(base, idxs.map((i) => cur.chunks[i]).join(""));
    else if (cur.whole) result.set(base, cur.whole);
  }
  return result;
}

function setCookie(name: string, value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=604800; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function writeChunked(name: string, value: string) {
  for (let i = 0; i < 20; i += 1) clearCookie(`${name}.${i}`);
  clearCookie(name);
  if (value.length <= CHUNK) { setCookie(name, value); return; }
  let i = 0;
  for (let off = 0; off < value.length; off += CHUNK) {
    setCookie(`${name}.${i}`, value.slice(off, off + CHUNK));
    i += 1;
  }
}

function readAccessToken(): string | null {
  try {
    for (const { value } of storagePairs()) {
      const found = walkToken(parseMaybe(value));
      if (found) return found;
    }
    for (const part of document.cookie.split(";")) {
      const found = walkToken(parseMaybe(decodeURIComponent(part.split("=").slice(1).join("=").trim())));
      if (found) return found;
    }
  } catch { return null; }
  return null;
}

export default function CrelavoSessionBridge() {
  useEffect(() => {
    const w = window as Window & { __crelavoFetchPatchedV3?: boolean };
    if (!w.__crelavoFetchPatchedV3) {
      w.__crelavoFetchPatchedV3 = true;
      const orig = window.fetch.bind(window);
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        const token = readAccessToken();
        if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
        return orig(input as RequestInfo, { ...init, headers, credentials: init?.credentials || "include" });
      };
    }

    let wrote = false;
    let access: string | null = null;
    for (const [base, raw] of groupedAuth()) {
      const sessionJson = walkSessionJson(parseMaybe(raw));
      const token = walkToken(parseMaybe(raw));
      if (token) access = token;
      writeChunked(base, sessionJson || raw);
      wrote = true;
    }
    if (!access) access = readAccessToken();
    if (access) {
      setCookie("sb-access-token", access);
      setCookie("access_token", access);
    }

    try {
      window.dispatchEvent(new CustomEvent("crelavo-session", { detail: { hasToken: Boolean(access) } }));
    } catch { /* ignore */ }

    if (wrote && !sessionStorage.getItem(FLAG)) {
      sessionStorage.setItem(FLAG, "1");
      location.reload();
    }
  }, []);

  return null;
}
