"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { postAuthPath, SIGNUP_DESTINATION } from "@/lib/crelavo/redirects";

export default function JoinPage() {
  const { user, loading, openAuth } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) openAuth("register", { next: SIGNUP_DESTINATION }); }, [loading, user, openAuth]);
  useEffect(() => { if (user) router.replace(SIGNUP_DESTINATION); }, [user, router]);
  return <main className="crelavo-join-page"><span>Starter Pack</span><h1>800 credits. $10 one-time.</h1><p>No subscription. Free account if you only want to browse.</p>{!user ? <><a className="btn" href="https://whop.com/checkout/plan_kmGVCrQu90NBV">Buy Starter Pack · $10</a><button type="button" onClick={() => openAuth("register", { next: SIGNUP_DESTINATION })}>Or browse free</button></> : <a href="/dashboard">Open dashboard</a>}</main>;
}
