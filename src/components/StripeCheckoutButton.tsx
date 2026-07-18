"use client";

import { useState } from "react";

type StripeCheckoutButtonProps = {
  productId: string;
  billing: "monthly" | "yearly" | "one_time";
  children: string;
};

export function StripeCheckoutButton({ productId, billing, children }: StripeCheckoutButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function startCheckout() {
    setState("loading");
    setMessage("");

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, billing })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.url) {
      setState("error");
      setMessage(data.error ?? "Stripe checkout could not start.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="checkout-button-stack">
      <button className="btn" type="button" onClick={startCheckout} disabled={state === "loading"}>
        {state === "loading" ? "Starting Stripe checkout..." : children}
      </button>
      {message ? <p className="workspace-action-note error">{message}</p> : null}
    </div>
  );
}
