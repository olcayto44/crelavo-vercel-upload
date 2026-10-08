"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { SIGNUP_DESTINATION } from "@/lib/crelavo/redirects";

export default function JoinPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("https://whop.com/checkout/ch_MTZtuBJl2OuZtL8/"); }, [loading, user, router]);
  useEffect(() => { if (user) router.replace(SIGNUP_DESTINATION); }, [user, router]);
  return <main className="crelavo-join-page"><span>CRELAVO PRO</span><h1>Continue through checkout.</h1><p>Card required for the one-time 24-hour preview. After the preview, Whop charges $9.99/month unless cancelled.</p><a className="btn" href="https://whop.com/checkout/ch_MTZtuBJl2OuZtL8/">Continue to Pro checkout</a>{user ? <a href="/dashboard">Open dashboard</a> : null}</main>;
}
