"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { normalizePartnerCode } from "@/lib/partner-program";

const REF_CODE_KEY = "clipora_partner_ref";
const VISITOR_ID_KEY = "clipora_referral_visitor_id";
const CLICK_TRACKED_PREFIX = "clipora_ref_click_tracked_";

function getVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(VISITOR_ID_KEY, next);
  return next;
}

export function PartnerReferralTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const partnerCode = normalizePartnerCode(searchParams?.get("ref"));
    if (!partnerCode) return;

    const visitorId = getVisitorId();
    const query = searchParams?.toString();
    const sourcePath = `${pathname || "/"}${query ? `?${query}` : ""}`;
    const trackedKey = `${CLICK_TRACKED_PREFIX}${partnerCode}_${sourcePath}`;

    window.localStorage.setItem(REF_CODE_KEY, partnerCode);
    document.cookie = `${REF_CODE_KEY}=${encodeURIComponent(partnerCode)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;

    if (window.sessionStorage.getItem(trackedKey)) return;
    window.sessionStorage.setItem(trackedKey, "1");

    fetch("/api/partners/referral-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerCode,
        eventType: "click",
        sourcePath,
        landingUrl: window.location.href,
        referrerUrl: document.referrer,
        visitorId,
        pageTitle: document.title
      }),
      keepalive: true
    }).catch(() => undefined);
  }, [pathname, searchParams]);

  return null;
}
