"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { googleStartUrl, requestMagicLink } from "@/lib/crelavo/authSession";

export function AuthModal() {
  const { user, modalOpen, intent, nextPath, googleReady, closeAuth, openAuth } = useAuth();
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!modalOpen) { setEmail(""); setBusy(false); setSent(false); setError(null); return; } const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, [modalOpen]);
  useEffect(() => { if (!modalOpen) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeAuth(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [modalOpen, closeAuth]);
  if (user || !modalOpen) return null;
  const isRegister = intent === "register";
  async function onEmail(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(null); try { await requestMagicLink(email, intent, nextPath || undefined); setSent(true); } catch (err) { setError(err instanceof Error ? err.message : "Could not send link"); } finally { setBusy(false); } }
  return <div className="crelavo-auth-backdrop" role="dialog" aria-modal="true" aria-label={isRegister ? "Create a free Crelavo account" : "Sign in to Crelavo"}>
    <button type="button" className="crelavo-auth-scrim" aria-label="Close" onClick={closeAuth} />
    <section className="crelavo-auth-card">
      <button type="button" className="crelavo-auth-close" onClick={closeAuth} aria-label="Close">×</button>
      {sent ? <div><h2>Check your email</h2><p>We sent a sign-in link to <strong>{email}</strong>. No password or card is required.</p></div> : <>
        <span className="crelavo-auth-eyebrow">Crelavo</span>
        <h2>{isRegister ? "Create a free account" : "Welcome back"}</h2>
        <p>{isRegister ? "Free Crelavo member. No card. Pro 24h preview is optional after this." : "Sign in with Google or an email link."}</p>
        {googleReady ? <a className="crelavo-auth-google" href={googleStartUrl(nextPath || undefined)}><span>G</span> Continue with Google</a> : null}
        <div className="crelavo-auth-divider"><span>{googleReady ? "or continue with email" : "email"}</span></div>
        <form onSubmit={onEmail}>
          <label htmlFor="crelavo-auth-email">Email</label>
          <input id="crelavo-auth-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="example@email.com" />
          {error ? <p className="crelavo-auth-error">{error}</p> : null}
          <button type="submit" className="crelavo-auth-submit" disabled={busy}>{busy ? "Sending…" : isRegister ? "Create account with email" : "Continue with email"}</button>
        </form>
        <small>No password required. This email link also signs in existing members.</small>
        <button type="button" className="crelavo-auth-switch" onClick={() => openAuth(isRegister ? "login" : "register", { next: nextPath || undefined })}>{isRegister ? "Already a member? Sign in" : "Need an account? Create one free"}</button>
      </>}
    </section>
  </div>;
}
