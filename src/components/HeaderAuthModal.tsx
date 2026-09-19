"use client";

import { useEffect, useState } from "react";
import { RegisterTurnstile, assertRegisterHuman } from "@/components/RegisterTurnstile";
import { supabaseBrowser } from "@/lib/supabase";

const siteUrl = "https://www.crelavo.com";
const turnstileSiteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

type Mode = "login" | "register";

type HeaderAuthModalProps = {
  open: boolean;
  initialMode: Mode;
  onClose: () => void;
  onSwitch: (mode: Mode) => void;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Could not verify you are human. Try again.";
}

export function HeaderAuthModal({ open, initialMode, onClose, onSwitch }: HeaderAuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    setTurnstileToken("");
    setTurnstileKey((value) => value + 1);
    setState("idle");
    setMessage("");
  }, [mode, open]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function resetTurnstile() {
    setTurnstileToken("");
    setTurnstileKey((value) => value + 1);
  }

  async function verifyRegister() {
    if (mode !== "register") return;
    await assertRegisterHuman(turnstileToken);
    resetTurnstile();
  }

  async function continueWithGoogle() {
    setState("loading"); setMessage("");
    try {
      await verifyRegister();
      const redirectTo = `${siteUrl || window.location.origin}`;
      const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      if (error) throw error;
    } catch (error) {
      if (mode === "register") resetTurnstile();
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (!email) { setState("error"); setMessage("Enter your email address."); return; }
    setState("loading");
    try {
      await verifyRegister();
      const redirectTo = `${siteUrl || window.location.origin}`;
      const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirectTo } });
      if (error) throw error;
      setState("success");
      setMessage(mode === "register" ? "Check your email. The secure link will create your account or sign you in automatically." : "Check your email. The secure sign-in link will log you in or create your account automatically.");
    } catch (error) {
      if (mode === "register") resetTurnstile();
      setState("error");
      setMessage(errorMessage(error));
    }
  }

  const registerBlocked = mode === "register" && (!turnstileSiteKeyConfigured || !turnstileToken);

  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-label="Sign in to Crelavo" onClick={onClose}>
      <section className="card auth-modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="auth-modal-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <div className="auth-modal-tabs" role="tablist">
          <button className={`auth-modal-tab${mode === "login" ? " active" : ""}`} type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); onSwitch("login"); }}>Sign in</button>
          <button className={`auth-modal-tab${mode === "register" ? " active" : ""}`} type="button" role="tab" aria-selected={mode === "register"} onClick={() => { setMode("register"); onSwitch("register"); }}>Create account</button>
        </div>
        <form onSubmit={onSubmit} className="auth-modal-form">
          <button className="btn auth-google-btn auth-modal-provider" style={{ display: "flex", width: "100%", visibility: "visible", opacity: 1 }} type="button" onClick={continueWithGoogle} disabled={state === "loading" || registerBlocked}><span aria-hidden="true">G</span><span>Continue with Google</span></button>
          <div className="auth-divider"><span>{mode === "register" ? "or create with email" : "or continue with email"}</span></div>
          <div className="field"><label>Email</label><input name="email" type="email" required placeholder="example@email.com" /></div>
          <RegisterTurnstile key={`${mode}-${turnstileKey}`} enabled={mode === "register"} onToken={setTurnstileToken} />
          {mode === "register" && !turnstileSiteKeyConfigured ? <p className="auth-modal-message auth-modal-message-error">Account creation is temporarily unavailable.</p> : null}
          <button className="btn auth-modal-submit" disabled={state === "loading" || registerBlocked} type="submit">
            {state === "loading" ? "Sending link..." : mode === "register" ? "Create account with email" : "Continue with email"}
          </button>
          <p className="auth-modal-note">No password required. This email link also signs in existing members.</p>
          {message ? <p className={`auth-modal-message auth-modal-message-${state}`}>{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
