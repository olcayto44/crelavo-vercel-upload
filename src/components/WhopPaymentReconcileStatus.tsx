"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type ReconcileState = "idle" | "checking" | "success" | "info" | "error";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GOOGLE_ADS_CONVERSION_ID = "AW-18425668664";
const GOOGLE_ADS_CONVERSION_LABEL = "P87ZCLrf5-4cELjIhdJE";

export function WhopPaymentReconcileStatus() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id") || searchParams.get("receipt_id") || "";
  const checkoutStatus = searchParams.get("checkout_status") || searchParams.get("status") || "";
  const [state, setState] = useState<ReconcileState>(paymentId ? "checking" : "idle");
  const [message, setMessage] = useState("");
  const conversionSentRef = useRef("");

  function sendPurchaseConversion() {
    if (!paymentId || conversionSentRef.current === paymentId) return;
    conversionSentRef.current = paymentId;
    window.gtag?.("event", "conversion", {
      send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
      transaction_id: paymentId
    });
  }

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
           sendPurchaseConversion();
           setState("success");
          setMessage(`Payment verified. ${payload.credits ?? ""} credits were added to your Crelavo account.`.trim());
          return;
        }
        if (payload.reason === "already_processed") {
           sendPurchaseConversion();
           setState("success");
          setMessage("Payment verified. Credits for this payment were already applied to your account.");
          return;
        }
        if (payload.reason === "free_trial_started_no_full_credits") {
          setState("info");
          setMessage("Your free 24-hour Whop trial is active. Downloads stay controlled during trial; if you do not cancel within 24 hours, Whop automatically starts the monthly subscription, and full Business credits are added after the paid subscription payment is confirmed.");
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
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_CONVERSION_ID}`} strategy="afterInteractive" />
      <Script id="google-ads-conversion" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_CONVERSION_ID}');`}
      </Script>
      <div className="card" style={{ marginTop: 16, borderColor: state === "error" ? "rgba(248,113,113,.45)" : "rgba(148,163,184,.25)" }}>
      <p style={{ color, margin: 0 }}>{message || "Checking payment status..."}</p>
      <p style={{ color: "var(--muted)", margin: "8px 0 0", fontSize: 13 }}>Payment ID: {paymentId}</p>
      </div>
    </>
  );
}
