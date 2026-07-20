"use client";

import { useEffect } from "react";
import { normalizePartnerCode } from "@/lib/partner-program";
import { supabaseBrowser } from "@/lib/supabase";

const REF_CODE_KEY = "clipora_partner_ref";
const VISITOR_ID_KEY = "clipora_referral_visitor_id";

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=") ?? "";
}

function getStoredReferral() {
  if (typeof window === "undefined") return { partnerCode: "", visitorId: "" };
  const partnerCode = normalizePartnerCode(window.localStorage.getItem(REF_CODE_KEY) || decodeURIComponent(getCookieValue(REF_CODE_KEY)));
  const visitorId = window.localStorage.getItem(VISITOR_ID_KEY) || "";
  return { partnerCode, visitorId };
}

export function OAuthWelcomeCreditClient() {
  useEffect(() => {
    let active = true;

    async function claimOAuthWelcomeCredits() {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!active || !user?.id || !user.email) return;

      const provider = String(user.app_metadata?.provider ?? user.user_metadata?.provider ?? "").toLowerCase();
      if (!provider || provider === "email") return;

      const storageKey = `crelavo_oauth_welcome_credit_checked_${user.id}`;
      if (window.localStorage.getItem(storageKey) === "1") return;
      window.localStorage.setItem(storageKey, "1");

      const referral = getStoredReferral();
      await fetch("/api/auth/welcome-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          full_name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? ""),
          provider,
          partner_referral_code: referral.partnerCode,
          referral_visitor_id: referral.visitorId
        })
      }).catch(() => null);
    }

    claimOAuthWelcomeCredits();
    return () => { active = false; };
  }, []);

  return null;
}
