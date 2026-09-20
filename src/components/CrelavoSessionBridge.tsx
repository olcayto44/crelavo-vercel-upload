"use client";

import { useEffect } from "react";

const BRIDGE_FLAG = "crelavo-sb-bridged-v2";
const COOKIE_MAX = 3180;
const TOKEN_KEY_RE =
  /^(sb-.*-auth-token.*|sb-access-token|sb-refresh-token|supabase\..*token.*|access_token)$/i;

declare global {
  interface Window {
    __crelavoAuthFetch?: boolean;
  }
}

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isJwt(value: string) {
  return /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseMaybeJson(raw: string): unknown {
  const text = raw.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(text));
    } catch {
      return text;
    }
  }
}

function pickAccessToken(node: unknown, depth = 0): string | null {
  if (depth > 8 || node == null) return null;
  if (typeof node === "string") {
    const s = node.trim();
    if (isJwt(s)) return s;
    if (s.startsWith("{") || s.startsWith("[")) return pickAccessToken(parseMaybeJson(s), depth + 1);
    return null;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = pickAccessToken(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const rec = asRecord(node);
  if (!rec) return null;
  for (const key of ["access_token", "accessToken", "token"]) {
    const found = pickAccessToken(rec[key], depth + 1);
    if (found) return found;
  }
  for (const key of ["currentSession", "session", "data", "user", "auth"]) {
    const found = pickAccessToken(rec[key], depth + 1);
    if (found) return found;
  }
  for (const value of Object.values(rec)) {
    const found = pickAccessToken(value, depth + 1);
    if (found) return found;
  }
  return null;
}

function readStorageToken(): { token: string | null; rawEntries: Array<[string, string]> } {
  const rawEntries: Array<[string, string]> = [];
  if (!isBrowser()) return { token: null, rawEntries };
  const stores: Storage[] = [];
  try {
    stores.push(window.localStorage);
  } catch {
    /* ignore */
  }
  try {
    stores.push(window.sessionStorage);
  } catch {
    /* ignore */
  }
  let token: string | null = null;
  for (const store of stores) {
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (!key) continue;
      let value = "";
      try {
        value = store.getItem(key) || "";
      } catch {
        continue;
      }
      if (!value) continue;
      if (TOKEN_KEY_RE.test(key) || /auth-token|access_token|supabase/i.test(key)) {
        rawEntries.push([key, value]);
      }
      if (!token) token = pickAccessToken(parseMaybeJson(value)) || (isJwt(value) ? value.trim() : null);
    }
  }
  return { token, rawEntries };
}

function cookieSecureSuffix() {
  return isBrowser() && window.location.protocol === "https:" ? "; Secure" : "";
}

function writeCookie(name: string, value: string) {
  const encoded = encodeURIComponent(value);
  const base = `; path=/; max-age=2592000; SameSite=Lax${cookieSecureSuffix()}`;
  document.cookie = `${name}=${encoded}${base}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${cookieSecureSuffix()}`;
}

function writeChunkedCookie(name: string, value: string) {
  for (let i = 0; i < 8; i += 1) clearCookie(i === 0 ? name : `${name}.${i}`);
  const encoded = encodeURIComponent(value);
  if (encoded.length <= COOKIE_MAX) {
    document.cookie = `${name}=${encoded}; path=/; max-age=2592000; SameSite=Lax${cookieSecureSuffix()}`;
    return;
  }
  let index = 0;
  for (let offset = 0; offset < encoded.length; offset += COOKIE_MAX) {
    const chunk = encoded.slice(offset, offset + COOKIE_MAX);
    document.cookie = `${name}.${index}=${chunk}; path=/; max-age=2592000; SameSite=Lax${cookieSecureSuffix()}`;
    index += 1;
  }
}

function copyTokensToCookies(token: string | null, rawEntries: Array<[string, string]>) {
  let copied = false;
  if (token) {
    writeCookie("sb-access-token", token);
    writeCookie("access_token", token);
    copied = true;
  }
  for (const [key, value] of rawEntries) {
    const safeName = key.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
    writeChunkedCookie(safeName, value);
    copied = true;
  }
  return copied;
}

function isSameOrigin(url: string) {
  if (url.startsWith("/")) return true;
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function patchFetch() {
  if (!isBrowser() || window.__crelavoAuthFetch) return;
  window.__crelavoAuthFetch = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input instanceof Request
              ? input.url
              : "";
      if (url && isSameOrigin(url)) {
        const { token } = readStorageToken();
        if (token) {
          if (input instanceof Request) {
            const headers = new Headers(input.headers);
            if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
            input = new Request(input, { headers });
            init = { ...(init || {}), credentials: init?.credentials || "include" };
          } else {
            const headers = new Headers(init?.headers || undefined);
            if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
            init = { ...(init || {}), headers, credentials: init?.credentials || "include" };
          }
        }
      }
    } catch {
      /* never break fetch */
    }
    return orig(input, init);
  };
}

function bridgeOnce() {
  const { token, rawEntries } = readStorageToken();
  if (!token && rawEntries.length === 0) return false;
  copyTokensToCookies(token, rawEntries);
  patchFetch();
  try {
    window.dispatchEvent(new Event("crelavo-session"));
  } catch {
    /* ignore */
  }
  return Boolean(token);
}

export default function CrelavoSessionBridge() {
  useEffect(() => {
    const hadToken = bridgeOnce();
    const onStorage = () => {
      bridgeOnce();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("crelavo-session", onStorage);
    const timer = window.setInterval(() => bridgeOnce(), 15000);
    if (hadToken) {
      try {
        if (!sessionStorage.getItem(BRIDGE_FLAG)) {
          sessionStorage.setItem(BRIDGE_FLAG, "1");
          window.setTimeout(() => {
            window.location.reload();
          }, 30);
        }
      } catch {
        /* ignore */
      }
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("crelavo-session", onStorage);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
