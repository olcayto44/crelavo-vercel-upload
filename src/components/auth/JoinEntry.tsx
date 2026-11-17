"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { postAuthPath, SIGNUP_DESTINATION } from "@/lib/crelavo/redirects";
export function JoinEntry({ previewTesting }: { previewTesting: boolean }) {
  const { user, loading, openAuth } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!previewTesting) { router.replace(user ? SIGNUP_DESTINATION : "https://whop.com/checkout/ch_MTZtuBJl2OuZtL8/"); return; }
    const query = new URLSearchParams(window.location.search);
    const requested = query.get("returnTo") || query.get("next");
    const destination = new URL(postAuthPath({ isNew: false, returnTo: requested }), window.location.origin);
    for (const key of ["category", "type", "idea"]) { const value = query.get(key); if (value) destination.searchParams.set(key, value); }
    const next = destination.pathname + destination.search;
    if (user) router.replace(next); else openAuth("login", { next });
  }, [user, loading, previewTesting, router, openAuth]);
  if (previewTesting) return <main className="crelavo-join-page"><span>PREVIEW TEST ORTAMI</span><h1>Mevcut hesabınızla giriş yapın</h1><p>Bu geliştirme girişinde ödeme sayfasına otomatik yönlendirme yapılmaz. Üretim ve teslim onayları ayrı olarak kontrol edilir.</p><button className="btn" type="button" onClick={() => openAuth("login", { next: SIGNUP_DESTINATION })}>Giriş yap</button></main>;
  return <main className="crelavo-join-page"><span>CRELAVO PRO</span><h1>Continue through checkout.</h1><p>Card required for the one-time 24-hour preview. After the preview, Whop charges $9.99/month unless cancelled.</p><a className="btn" href="https://whop.com/checkout/ch_MTZtuBJl2OuZtL8/">Continue to Pro checkout</a>{user ? <a href="/dashboard">Open dashboard</a> : null}</main>;
}
