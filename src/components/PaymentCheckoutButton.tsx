"use client";

import { useState } from "react";

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

  async function startCheckout() {
    setState("loading");
    setMessage("");

    const currentParams = new URLSearchParams(window.location.search);
    const attribution = readAttribution();
    const partnerCode = currentParams.get("ref") || window.localStorage.getItem(REF_CODE_KEY) || attribution?.ref || "";
    const campaign = currentParams.get("campaign") || attribution?.utmCampaign || "";

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, billing, partnerCode, campaign, attribution })
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
      <button className="btn" type="button" onClick={startCheckout} disabled={state === "loading"}>
        {state === "loading" ? "Starting secure checkout..." : children}
      </button>
      {message ? <p className="workspace-action-note error">{message}</p> : null}
    </div>
  );
}
