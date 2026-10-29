"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { SIGNUP_DESTINATION } from "@/lib/crelavo/redirects";

export default function JoinPage() {
  const { user, loading, openAuth } = useAuth();
  const router = useRouter();
  useEffect(() => { if (loading || user) return; const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/dashboard/create"; openAuth("register", { next: returnTo }); }, [loading, user, openAuth]);
  useEffect(() => { if (user) router.replace(SIGNUP_DESTINATION); }, [user, router]);
  return <main className="crelavo-join-page"><span>CRELAVO</span><h1>Create your free account.</h1><p>No card is required to browse categories and open the assistant workspace.</p>{user ? <a href="/dashboard/create">Open assistant</a> : <p>Registration window is opening…</p>}</main>;
}
