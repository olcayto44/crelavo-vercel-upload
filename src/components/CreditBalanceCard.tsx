"use client";

import { useEffect, useState } from "react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";

type CreditState = {
  balance: number;
  reserved: number;
  available: number;
  current_subscription_credits: number;
  rolled_over_credits: number;
  topup_credits: number;
  bonus_credits: number;
  rollover_cap: number;
  subscription_status: string;
  billing_cycle_ends_at: string | null;
};

export function CreditBalanceCard() {
  const [credits, setCredits] = useState<CreditState>({ balance: 0, reserved: 0, available: 0, current_subscription_credits: 0, rolled_over_credits: 0, topup_credits: 0, bonus_credits: 0, rollover_cap: 0, subscription_status: "inactive", billing_cycle_ends_at: null });
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
              available: data.available ?? 0,
              current_subscription_credits: data.current_subscription_credits ?? 0,
              rolled_over_credits: data.rolled_over_credits ?? 0,
              topup_credits: data.topup_credits ?? 0,
              bonus_credits: data.bonus_credits ?? 0,
              rollover_cap: data.rollover_cap ?? 0,
              subscription_status: data.subscription_status ?? "inactive",
              billing_cycle_ends_at: data.billing_cycle_ends_at ?? null
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
        const available = detail.available;
        setCredits((current) => ({ ...current, balance: detail.balance ?? available, reserved: detail.reserved ?? 0, available }));
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
      {mode === "live" ? (
        <div style={{ display: "grid", gap: 4, marginTop: 10 }}>
          <small>Monthly: {credits.current_subscription_credits.toLocaleString()} · Rollover: {credits.rolled_over_credits.toLocaleString()}</small>
          <small>Top-up: {credits.topup_credits.toLocaleString()} · Bonus: {credits.bonus_credits.toLocaleString()}</small>
          {credits.rollover_cap > 0 ? <small>Rollover cap: {credits.rollover_cap.toLocaleString()} · Status: {credits.subscription_status}</small> : null}
          {credits.billing_cycle_ends_at ? <small>Next cycle: {new Date(credits.billing_cycle_ends_at).toLocaleDateString()}</small> : null}
        </div>
      ) : null}
      {mode === "live" && credits.available <= 0 ? (
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <small>Start with a credit review before opening a paid production.</small>
          <a className="btn secondary" href="/dashboard/credits">Review credit plans</a>
        </div>
      ) : null}
      {mode === "login" ? (
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <small>You need to sign in.</small>
          <a className="btn secondary" href="/auth/login">Sign in to load credits</a>
        </div>
      ) : null}
      {mode === "error" ? (
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <small>Credit data could not be loaded.</small>
          <a className="btn secondary" href="/dashboard/credits">Open credits page</a>
        </div>
      ) : null}
    </div>
  );
}
