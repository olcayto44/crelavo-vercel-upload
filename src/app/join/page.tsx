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
  return <main className="crelavo-join-page"><span>JOIN CRELAVO</span><h1>Start Pro.</h1><p>24-hour preview. Then $9.99/month unless cancelled.</p>{!user ? <><a className="btn" href="https://whop.com/checkout/plan_ujLQgM3kEg0dg">Start Pro · $9.99/mo</a><button type="button" onClick={() => openAuth("register", { next: SIGNUP_DESTINATION })}>Create free account</button></> : <a href="/dashboard">Open dashboard</a>}</main>;
}
