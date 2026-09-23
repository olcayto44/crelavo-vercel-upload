"use client";

import { CONVERSION_EVENT } from "./authConfig";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackCrelavoUserCreated(method: "email" | "google") {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem("crelavo_user_created_sent")) return;
    sessionStorage.setItem("crelavo_user_created_sent", "1");
  } catch {
    // Ignore storage restrictions.
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: CONVERSION_EVENT, method });
  if (typeof window.gtag === "function") window.gtag("event", CONVERSION_EVENT, { method });
}
