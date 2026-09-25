"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { PRO_PATH } from "@/lib/crelavo/authConfig";
import { SIGNUP_DESTINATION } from "@/lib/crelavo/redirects";

export default function JoinPage() {
  const { user, loading, openAuth } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) openAuth("register", { next: SIGNUP_DESTINATION }); }, [loading, user, openAuth]);
  useEffect(() => { if (user) router.replace(SIGNUP_DESTINATION); }, [user, router]);
  return <main className="crelavo-join-page"><span>Free member</span><h1>Create a Crelavo account</h1><p>No card for a free member account. After you are in, you can start the 24h Pro preview (card required on checkout, no charge until the preview ends).</p>{!user ? <button type="button" onClick={() => openAuth("register", { next: SIGNUP_DESTINATION })}>Create free account</button> : <a href={PRO_PATH}>Optional next: Start Pro preview</a>}</main>;
}
