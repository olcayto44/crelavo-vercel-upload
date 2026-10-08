"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { requestMagicLink } from "@/lib/crelavo/authSession";
import { supabaseBrowser } from "@/lib/supabase";
import { postAuthPath } from "@/lib/crelavo/redirects";

export function AuthModal() {
  const { user, modalOpen, intent, nextPath, closeAuth, openAuth } = useAuth();
  const pathname = usePathname();
  const [isPaidEntry, setIsPaidEntry] = useState(false);
  const isJoinRegister = pathname === "/join" && intent === "register";
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { setIsPaidEntry(new URLSearchParams(window.location.search).get("paid") === "1"); }, [modalOpen]);
  useEffect(() => { if (!modalOpen) { setEmail(""); setBusy(false); setSent(false); setError(null); return; } const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, [modalOpen]);
  useEffect(() => { if (!modalOpen) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeAuth(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [modalOpen, closeAuth]);
  if (user || !modalOpen) return null;
  const isRegister = intent === "register";
  async function onGoogle() {
    setBusy(true);
    setError(null);
    const authIntent = isPaidEntry ? "register" : intent;
    const target = postAuthPath({ isNew: authIntent === "register", returnTo: nextPath });
    const redirectTo = `${window.location.origin}${target}${target.includes("?") ? "&" : "?"}${authIntent === "register" ? "signup=1&method=google" : ""}`;
    const { error: googleError } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (googleError) { setError(googleError.message); setBusy(false); }
  }
  async function onEmail(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(null); try { await requestMagicLink(email, isPaidEntry ? "register" : intent, nextPath || undefined, isPaidEntry ? { allowPaidSignup: true } : undefined); setSent(true); } catch (err) { setError(err instanceof Error ? err.message : "Could not send link"); } finally { setBusy(false); } }
  return <div className="crelavo-auth-backdrop" role="dialog" aria-modal="true" aria-label={isPaidEntry ? "Ödemen alındı, stüdyoya gir" : isJoinRegister ? "Start Crelavo Pro" : isRegister ? "Create a free Crelavo account" : "Sign in to Crelavo"}>
    <button type="button" className="crelavo-auth-scrim" aria-label="Close" onClick={closeAuth} />
    <section className="crelavo-auth-card">
      <button type="button" className="crelavo-auth-close" onClick={closeAuth} aria-label="Close">×</button>
      {sent ? <div><h2>{isPaidEntry ? "E-postanı kontrol et" : "Check your email"}</h2><p>{isPaidEntry ? <>Giriş bağlantısını <strong>{email}</strong> adresine gönderdik.</> : <>We sent a sign-in link to <strong>{email}</strong>. No password or card is required.</>}</p></div> : <>
        <span className="crelavo-auth-eyebrow">Crelavo</span>
        <h2>{isPaidEntry ? "Ödemen alındı, stüdyoya gir." : isJoinRegister ? "Start Crelavo Pro" : isRegister ? "Create your free account" : "Welcome back"}</h2>
        <p>{isPaidEntry ? "Google veya ödeme sırasında kullandığın aynı e-posta ile giriş yap." : isJoinRegister ? "24-hour preview. Card required. No charge until the preview ends." : isRegister ? "Browse the studio and open your dashboard. No card required." : "Sign in with Google or an email link."}</p>
        {isJoinRegister ? <a className="crelavo-auth-buy" href="https://whop.com/checkout/ch_MTZtuBJl2OuZtL8/">Start Pro · $9.99/mo</a> : null}<div className="crelavo-auth-divider"><span>{isPaidEntry ? "VEYA GOOGLE İLE" : isJoinRegister ? "OR BROWSE FREE" : "Or browse free"}</span></div><button type="button" className="crelavo-auth-google" onClick={() => void onGoogle()} disabled={busy}><span>G</span> {isPaidEntry ? "Google ile giriş yap" : "Continue with Google"}</button>
        <div className="crelavo-auth-divider"><span>{isPaidEntry ? "VEYA AYNI E-POSTA İLE" : "OR CONTINUE WITH EMAIL"}</span></div>
        <form onSubmit={onEmail}>
          <label htmlFor="crelavo-auth-email">{isPaidEntry ? "Ödeme sırasında kullanılan e-posta" : "Email"}</label>
          <input id="crelavo-auth-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="example@email.com" />
          {error ? <p className="crelavo-auth-error">{error}</p> : null}
          <button type="submit" className="crelavo-auth-email" disabled={busy}>{busy ? (isPaidEntry ? "Gönderiliyor…" : "Sending…") : isPaidEntry ? "Giriş bağlantısı gönder" : isRegister ? "Create free account with email" : "Continue with email"}</button>
        </form>
        <small>{isPaidEntry ? "Şifre gerekmez. Bu bağlantı, ödeme sırasında kullandığın e-posta ile mevcut hesabına giriş yapar." : "No password required. This email link also signs in existing members."}</small>
        {isPaidEntry ? null : <button type="button" className="crelavo-auth-switch" onClick={() => openAuth(isRegister ? "login" : "register", { next: nextPath || undefined })}>{isRegister ? "Already a member? Sign in" : "Need an account? Create one free"}</button>}
      </>}
    </section>
  </div>;
}
