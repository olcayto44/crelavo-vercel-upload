"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_KEY = "clipora_live_session_id";
const ATTRIBUTION_KEY = "clipora_attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "fbclid", "gclid", "gbraid", "wbraid"] as const;

type AttributionPayload = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  ref: string;
  fbclid: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  landingUrl: string;
  firstTouchAt: string;
  firstTouchPath: string;
};

function getSessionId() {
  if (typeof window === "undefined") return "";
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

function readStoredAttribution(): AttributionPayload | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) as AttributionPayload : null;
  } catch {
    return null;
  }
}

function captureAttribution(searchParams: URLSearchParams | null, path: string): AttributionPayload {
  const stored = readStoredAttribution();
  const hasCampaignParams = UTM_KEYS.some((key) => searchParams?.get(key));
  if (stored && !hasCampaignParams) return stored;

  const next: AttributionPayload = {
    utmSource: searchParams?.get("utm_source") || stored?.utmSource || "",
    utmMedium: searchParams?.get("utm_medium") || stored?.utmMedium || "",
    utmCampaign: searchParams?.get("utm_campaign") || stored?.utmCampaign || "",
    utmTerm: searchParams?.get("utm_term") || stored?.utmTerm || "",
    utmContent: searchParams?.get("utm_content") || stored?.utmContent || "",
    ref: searchParams?.get("ref") || stored?.ref || "",
    fbclid: searchParams?.get("fbclid") || stored?.fbclid || "",
    gclid: searchParams?.get("gclid") || stored?.gclid || "",
    gbraid: searchParams?.get("gbraid") || stored?.gbraid || "",
    wbraid: searchParams?.get("wbraid") || stored?.wbraid || "",
    landingUrl: stored?.landingUrl || (typeof window !== "undefined" ? window.location.href : path),
    firstTouchAt: stored?.firstTouchAt || new Date().toISOString(),
    firstTouchPath: stored?.firstTouchPath || path
  };

  if (hasCampaignParams || !stored) {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
  }

  return next;
}

export function LiveVisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const sessionId = getSessionId();

    async function sendHeartbeat() {
      if (cancelled || document.visibilityState === "hidden") return;
      const query = searchParams?.toString();
      const path = `${pathname || "/"}${query ? `?${query}` : ""}`;
      const attribution = captureAttribution(searchParams, path);
      await fetch("/api/analytics/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          path,
          url: window.location.href,
          title: document.title,
          referrer: document.referrer,
          ...attribution
        }),
        keepalive: true
      }).catch(() => undefined);
    }

    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 20_000);
    const onVisibilityChange = () => sendHeartbeat();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, searchParams]);

  return null;
}
