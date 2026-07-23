"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ATTRIBUTION_KEY = "clipora_attribution";
const SEEN_KEY = "crelavo_exit_lead_seen_at";
const SUBMITTED_KEY = "crelavo_exit_lead_submitted";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const blockedPrefixes = ["/admin", "/api", "/dashboard", "/auth", "/checkout"];

type AttributionPayload = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  ref?: string;
  fbclid?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  landingUrl?: string;
  firstTouchAt?: string;
  firstTouchPath?: string;
};

function canShowOnPath(pathname: string | null) {
  const path = pathname || "/";
  return !blockedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function readAttribution(): AttributionPayload {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) as AttributionPayload : {};
  } catch {
    return {};
  }
}

function recentlySeen() {
  const raw = window.localStorage.getItem(SEEN_KEY);
  const seenAt = raw ? Number(raw) : 0;
  return Number.isFinite(seenAt) && Date.now() - seenAt < SEVEN_DAYS_MS;
}

export function ExitIntentLeadCapture() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const allowedPath = useMemo(() => canShowOnPath(pathname), [pathname]);

  useEffect(() => {
    if (!allowedPath || visible) return;
    if (window.localStorage.getItem(SUBMITTED_KEY) === "true" || recentlySeen()) return;

    let armed = false;
    let lastScrollY = window.scrollY;
    let lastScrollAt = Date.now();
    let touchStartY = 0;

    const triggerLeadCapture = () => {
      if (!armed || visible) return;
      window.localStorage.setItem(SEEN_KEY, String(Date.now()));
      setVisible(true);
    };

    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 15_000);

    const fallbackTimer = window.setTimeout(() => {
      triggerLeadCapture();
    }, 45_000);

    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY > 0) return;
      triggerLeadCapture();
    };

    const onScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const movedUpQuickly = lastScrollY - currentY > 90 && now - lastScrollAt < 700;
      const meaningfulDepth = lastScrollY > 220;
      lastScrollY = currentY;
      lastScrollAt = now;
      if (movedUpQuickly && meaningfulDepth) triggerLeadCapture();
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? touchStartY;
      const pulledDownNearTop = currentY - touchStartY > 90 && window.scrollY < 160;
      if (pulledDownNearTop) triggerLeadCapture();
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.clearTimeout(armTimer);
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [allowedPath, visible]);

  if (!allowedPath || !visible) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/leads/exit-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        consent,
        website,
        source: "exit_intent",
        offer: "ecommerce_video_ad_strategy_guide_trial_credits",
        pageUrl: window.location.href,
        referrer: document.referrer,
        attribution: readAttribution()
      })
    }).catch(() => null);

    const data = await response?.json().catch(() => ({}));
    if (!response?.ok) {
      setStatus("error");
      setMessage(typeof data?.error === "string" ? data.error : "Could not save your email yet. Please try again.");
      return;
    }

    window.localStorage.setItem(SUBMITTED_KEY, "true");
    setStatus("success");
    setMessage(typeof data?.message === "string" ? data.message : "Your request was received.");
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Crelavo ecommerce video guide" style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", padding: 16, background: "rgba(5, 8, 18, 0.72)", backdropFilter: "blur(10px)" }}>
      <div className="card" style={{ width: "min(560px, 100%)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 24px 80px rgba(0,0,0,0.35)", position: "relative" }}>
        <button type="button" onClick={() => setVisible(false)} aria-label="Close" style={{ position: "absolute", right: 14, top: 14, border: 0, borderRadius: 999, width: 34, height: 34, cursor: "pointer", background: "rgba(255,255,255,0.12)", color: "var(--text)" }}>×</button>
        <span className="badge">Free ecommerce ad guide</span>
        <h2 style={{ marginTop: 12 }}>Not ready for the agency bundle yet?</h2>
        <p style={{ color: "var(--muted)", fontSize: 16 }}>Get the ecommerce video ad strategy guide plus a trial credit offer by email. Use it to improve hooks, proof, CTA and product demo angles before buying a preview.</p>

        {status === "success" ? (
          <div className="workspace-action-note" style={{ marginTop: 18 }}>
            <p><strong>{message}</strong></p>
            <p>Next: run the free ad score checker or start the $10 Business preview when you are ready.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.16)", padding: "14px 16px", background: "rgba(255,255,255,0.06)", color: "var(--text)" }}
            />
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} name="website" style={{ display: "none" }} />
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--muted)", fontSize: 13 }}>
              <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} style={{ marginTop: 3 }} />
              <span>I agree to receive Crelavo strategy emails and preview offers. I can unsubscribe anytime.</span>
            </label>
            {message ? <p style={{ color: status === "error" ? "#ff8a8a" : "var(--muted)", margin: 0 }}>{message}</p> : null}
            <button type="submit" className="primary-button" disabled={status === "loading"}>{status === "loading" ? "Sending..." : "Send me the guide"}</button>
          </form>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Link className="secondary-button" href="/free-tools/ad-performance-score-checker" onClick={() => setVisible(false)}>Run free ad score</Link>
          <Link className="secondary-button" href="/dashboard/payment?package=business&billing=monthly&campaign=business-12000" onClick={() => setVisible(false)}>Start $10 Business preview</Link>
        </div>
      </div>
    </div>
  );
}
