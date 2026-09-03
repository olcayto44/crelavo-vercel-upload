"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

const REF_CODE_KEY = "clipora_partner_ref";
const ATTRIBUTION_KEY = "clipora_attribution";

function readAttribution() {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

type PaymentCheckoutButtonProps = {
  productId: string;
  billing: "monthly" | "yearly" | "one_time";
  children: string;
};

export function PaymentCheckoutButton({ productId, billing, children }: PaymentCheckoutButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [consentRecovery, setConsentRecovery] = useState(false);

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      const email = data.user?.email?.trim().toLowerCase();
      if (email) setCheckoutEmail(email);
    }).catch(() => undefined);
  }, []);

  async function startCheckout() {
    setState("loading");
    setMessage("");

    const currentParams = new URLSearchParams(window.location.search);
    const attribution = readAttribution();
    const partnerCode = currentParams.get("ref") || window.localStorage.getItem(REF_CODE_KEY) || attribution?.ref || "";
    const campaign = currentParams.get("campaign") || attribution?.utmCampaign || "";

    const { data: sessionData } = await supabaseBrowser().auth.getSession();
    const accessToken = sessionData.session?.access_token ?? "";
    if (!accessToken) {
      window.location.href = `/auth/register?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        productId,
        billing,
        partnerCode,
        campaign,
        attribution,
        checkoutEmail,
        consentRecovery,
        pageUrl: window.location.href,
        referrer: document.referrer
      })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.url) {
      setState("error");
      setMessage(data.error ?? "Payment checkout could not start.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="checkout-button-stack">
      <label className="workspace-action-note" style={{ display: "grid", gap: 8 }}>
        <span>Email for receipt and follow-up</span>
        <input value={checkoutEmail} onChange={(event) => setCheckoutEmail(event.target.value)} placeholder="you@example.com" type="email" />
      </label>
      <label className="workspace-action-note" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <input checked={consentRecovery} onChange={(event) => setConsentRecovery(event.target.checked)} type="checkbox" style={{ marginTop: 3 }} />
        <span>Send me a reminder if I leave checkout unfinished or my 24-hour preview is close to ending.</span>
      </label>
      <button className="btn" type="button" onClick={startCheckout} disabled={state === "loading"}>
        {state === "loading" ? "Opening secure checkout..." : children}
      </button>
      {message ? <p className="workspace-action-note error">{message}</p> : null}
    </div>
  );
}
