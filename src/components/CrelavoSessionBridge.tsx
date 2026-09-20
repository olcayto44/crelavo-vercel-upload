"use client";

import { useEffect } from "react";

function isAuthKey(key: string) {
  return /sb-.*-auth-token|supabase|access_token|refresh_token|auth-token|crelavo.*auth|crelavo.*session|sb-access-token|sb-refresh-token/i.test(key);
}
function writeCookie(name: string, value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const max = 3180;
  const encoded = encodeURIComponent(value);
  if (encoded.length <= max) {
    document.cookie = `${name}=${encoded}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
    return;
  }
  document.cookie = `${name}=; Path=/; Max-Age=0`;
  let i = 0;
  for (let offset = 0; offset < encoded.length; offset += max) {
    document.cookie = `${name}.${i}=${encoded.slice(offset, offset + max)}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
    i += 1;
  }
}
function tokenFromUnknown(value: unknown, depth = 0): string | null {
  if (value == null || depth > 6) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("eyJ") && trimmed.length > 40) return trimmed;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try { return tokenFromUnknown(JSON.parse(trimmed), depth + 1); } catch { return null; }
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) { const found = tokenFromUnknown(item, depth + 1); if (found) return found; }
    return null;
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const direct = o.access_token || o.accessToken || o.token;
    if (typeof direct === "string" && direct.length > 20) return direct;
    return tokenFromUnknown(o.currentSession, depth + 1) || tokenFromUnknown(o.session, depth + 1) || tokenFromUnknown(o.data, depth + 1);
  }
  return null;
}
export default function CrelavoSessionBridge() {
  useEffect(() => {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !isAuthKey(key)) continue;
        const raw = localStorage.getItem(key);
        if (raw) writeCookie(key, raw);
      }
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !isAuthKey(key)) continue;
        const token = tokenFromUnknown(localStorage.getItem(key));
        if (token) { writeCookie("sb-access-token", token); break; }
      }
    } catch { /* ignore */ }
  }, []);
  return null;
}
