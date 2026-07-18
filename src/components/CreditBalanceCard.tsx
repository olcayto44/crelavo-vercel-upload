"use client";

import { useEffect, useState } from "react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";

type CreditState = {
  balance: number;
  reserved: number;
  available: number;
};

export function CreditBalanceCard() {
  const [credits, setCredits] = useState<CreditState>({ balance: 0, reserved: 0, available: 0 });
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    async function loadCredits() {
      const auth = await requireVerifiedBrowserUser();

      if (!auth.ok) {
        setMode("login");
        return;
      }

      fetch(`/api/credits?user_id=${auth.user.id}`, { cache: "no-store", headers: authHeaders(auth.accessToken) })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.available === "number") {
            setCredits({
              balance: data.balance ?? 0,
              reserved: data.reserved ?? 0,
              available: data.available ?? 0
            });
            setMode("live");
            return;
          }
          setMode("error");
        })
        .catch(() => setMode("error"));
    }

    function onCreditsUpdated(event: Event) {
      const detail = (event as CustomEvent<{ available?: number; balance?: number; reserved?: number }>).detail;
      if (typeof detail?.available === "number") {
        setCredits({ balance: detail.balance ?? detail.available, reserved: detail.reserved ?? 0, available: detail.available });
        setMode("live");
        return;
      }
      void loadCredits();
    }

    loadCredits();
    window.addEventListener("clipora:credits-updated", onCreditsUpdated);
    return () => window.removeEventListener("clipora:credits-updated", onCreditsUpdated);
  }, []);

  return (
    <div className="card">
      <span>Credits</span>
      <strong>{mode === "loading" ? "..." : credits.available}</strong>
      <p>Available balance</p>
      {mode === "live" ? <small>Total: {credits.balance} · Reserved: {credits.reserved}</small> : null}
      {mode === "login" ? <small>You need to sign in.</small> : null}
      {mode === "error" ? <small>Credit data could not be loaded.</small> : null}
    </div>
  );
}
