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
  return <main className="crelavo-join-page"><span>Join Crelavo</span><h1>Create your free account.</h1><p>Browse the studio and open your dashboard. No card required.</p>{!user ? <button type="button" onClick={() => openAuth("register", { next: SIGNUP_DESTINATION })}>Create free account</button> : <a href="/dashboard">Open dashboard</a>}</main>;
}
