"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

const siteUrl = "https://www.crelavo.com";

type Mode = "login" | "register";

type HeaderAuthModalProps = {
  open: boolean;
  initialMode: Mode;
  onClose: () => void;
  onSwitch: (mode: Mode) => void;
};

export function HeaderAuthModal({ open, initialMode, onClose, onSwitch }: HeaderAuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => { setMode(initialMode); }, [initialMode]);

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

  async function continueWithGoogle() {
    setState("loading"); setMessage("");
    const redirectTo = `${siteUrl || window.location.origin}/dashboard/assistant-workspace`;
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) { setState("error"); setMessage(error.message); }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("loading"); setMessage("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (!email) { setState("error"); setMessage("Enter your email address."); return; }
    const redirectTo = `${siteUrl || window.location.origin}/dashboard/assistant-workspace`;
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirectTo } });
    if (error) { setState("error"); setMessage(error.message); return; }
    setState("success");
    setMessage(mode === "register" ? "Check your email. The secure link will create your account or sign you in automatically." : "Check your email. The secure sign-in link will log you in or create your account automatically.");
  }

  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-label="Sign in to Crelavo" onClick={onClose}>
      <section className="card auth-modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="auth-modal-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <div className="auth-modal-tabs" role="tablist">
          <button className={`auth-modal-tab${mode === "login" ? " active" : ""}`} type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); onSwitch("login"); }}>Sign in</button>
          <button className={`auth-modal-tab${mode === "register" ? " active" : ""}`} type="button" role="tab" aria-selected={mode === "register"} onClick={() => { setMode("register"); onSwitch("register"); }}>Create account</button>
        </div>
        <form onSubmit={onSubmit} className="auth-modal-form">
          <button className="btn auth-google-btn auth-modal-provider" style={{ display: "flex", width: "100%", visibility: "visible", opacity: 1 }} type="button" onClick={continueWithGoogle} disabled={state === "loading"}><span aria-hidden="true">G</span><span>Continue with Google</span></button>
          <div className="auth-divider"><span>{mode === "register" ? "or create with email" : "or continue with email"}</span></div>
          <div className="field"><label>Email</label><input name="email" type="email" required placeholder="example@email.com" /></div>
          <button className="btn auth-modal-submit" disabled={state === "loading"} type="submit">
            {state === "loading" ? "Sending link..." : mode === "register" ? "Create account with email" : "Continue with email"}
          </button>
          <p className="auth-modal-note">No password required. This email link also signs in existing members.</p>
          {message ? <p className={`auth-modal-message auth-modal-message-${state}`}>{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
