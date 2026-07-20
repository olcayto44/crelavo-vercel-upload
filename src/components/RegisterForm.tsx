"use client";

import { useState } from "react";
import { normalizePartnerCode } from "@/lib/partner-program";
import { supabaseBrowser } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
const REF_CODE_KEY = "clipora_partner_ref";
const VISITOR_ID_KEY = "clipora_referral_visitor_id";

type State = "idle" | "loading" | "success" | "error";

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

export function RegisterForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function continueWithProvider(provider: "google" | "github" | "azure") {
    setState("loading");
    setMessage("");

    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl || window.location.origin}/dashboard/assistant-workspace?welcome=google_trial_credit` }
    });

    if (error) {
      setState("error");
      setMessage(error.message);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setState("error");
      setMessage("Supabase configuration is missing. Add the URL and anon key to .env.local.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("full_name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const passwordConfirm = String(form.get("password_confirm") ?? "");
    const verification = String(form.get("verification") ?? "").trim().toUpperCase();
    const referral = getStoredReferral();

    if (verification !== "CRELAVO") {
      setState("error");
      setMessage("Security check failed. Type CRELAVO exactly.");
      return;
    }

    if (password !== passwordConfirm) {
      setState("error");
      setMessage("Password and confirmation password must match.");
      return;
    }

    const { data, error } = await supabaseBrowser().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          registration_method: "email",
          partner_referral_code: referral.partnerCode || undefined,
          referral_visitor_id: referral.visitorId || undefined
        },
        emailRedirectTo: `${siteUrl || window.location.origin}/auth/login?confirmed=1`
      }
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    if (data.user?.id) {
      await fetch("/api/auth/welcome-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user.id,
          email,
          full_name: fullName,
          provider: "email",
          partner_referral_code: referral.partnerCode,
          referral_visitor_id: referral.visitorId
        })
      }).catch(() => null);
    }

    setState("success");
    setMessage("Registration received. Open the confirmation link in your email to activate the account. Check spam and promotions folders. If it does not arrive, use the resend confirmation email page.");
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="card" style={{ marginBottom: 14, background: "rgba(34,211,238,.08)" }}>
        <span className="badge">Limited trial credits</span>
        <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>Create an account with Google or email and receive 1,000 one-time Assistant trial credits for planning/chat only. Production rendering still requires paid production credits.</p>
      </div>
      <div className="auth-provider-grid">
        <button className="btn auth-google-btn" type="button" onClick={() => continueWithProvider("google")} disabled={state === "loading"}>Continue with Google + trial credits</button>
        <button className="btn secondary auth-google-btn" type="button" onClick={() => continueWithProvider("github")} disabled={state === "loading"}>Continue with GitHub</button>
        <button className="btn secondary auth-google-btn" type="button" onClick={() => continueWithProvider("azure")} disabled={state === "loading"}>Continue with Microsoft</button>
      </div>
      <div className="auth-divider"><span>or create an account with email</span></div>
      <div className="field"><label>Full name</label><input name="full_name" required placeholder="Your full name" /></div>
      <div className="field"><label>Email</label><input name="email" type="email" required placeholder="example@email.com" /></div>
      <div className="field"><label>Password</label><input name="password" type="password" required minLength={6} placeholder="At least 6 characters" /></div>
      <div className="field"><label>Confirm password</label><input name="password_confirm" type="password" required minLength={6} placeholder="Repeat your password" /></div>
      <div className="field"><label>Security check: type CRELAVO</label><input name="verification" required placeholder="CRELAVO" /><small>To confirm you are a real person, type the word CRELAVO exactly as shown.</small></div>
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Creating account..." : "Create account"}</button>
      {message ? <p style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}
