"use client";

import { useState } from "react";

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

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, billing })
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
