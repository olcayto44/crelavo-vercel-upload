"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ReconcileState = "idle" | "checking" | "success" | "info" | "error";

export function WhopPaymentReconcileStatus() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id") || searchParams.get("receipt_id") || "";
  const checkoutStatus = searchParams.get("checkout_status") || searchParams.get("status") || "";
  const [state, setState] = useState<ReconcileState>(paymentId ? "checking" : "idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!paymentId || !["success", "succeeded", "paid", ""].includes(checkoutStatus.toLowerCase())) return;

    let cancelled = false;
    setState("checking");
    setMessage("Verifying your payment and updating Crelavo credits...");

    fetch("/api/whop/reconcile-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId })
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || payload.reason || "Payment verification failed.");
        return payload;
      })
      .then((payload) => {
        if (cancelled) return;
        if (payload.activated) {
          setState("success");
          setMessage(`Payment verified. ${payload.credits ?? ""} credits were added to your Crelavo account.`.trim());
          return;
        }
        if (payload.reason === "already_processed") {
          setState("success");
          setMessage("Payment verified. Credits for this payment were already applied to your account.");
          return;
        }
        if (payload.reason === "preview_setup_payment_no_full_credits") {
          setState("info");
          setMessage("Payment verified. This is a non-refundable 24-hour preview/setup payment. Downloads stay closed during preview; if you do not cancel within 24 hours, Whop automatically charges the selected plan, and full subscription credits are added after the main subscription payment is confirmed.");
          return;
        }
        setState("info");
        setMessage("Payment verified. If credits or service access do not appear shortly, contact support with your payment ID.");
      })
      .catch((error) => {
        if (cancelled) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "Payment verification failed. Contact support with your payment ID.");
      });

    return () => { cancelled = true; };
  }, [paymentId, checkoutStatus]);

  if (!paymentId || state === "idle") return null;

  const color = state === "error" ? "#fca5a5" : state === "success" ? "#86efac" : "var(--muted)";

  return (
    <div className="card" style={{ marginTop: 16, borderColor: state === "error" ? "rgba(248,113,113,.45)" : "rgba(148,163,184,.25)" }}>
      <p style={{ color, margin: 0 }}>{message || "Checking payment status..."}</p>
      <p style={{ color: "var(--muted)", margin: "8px 0 0", fontSize: 13 }}>Payment ID: {paymentId}</p>
    </div>
  );
}
