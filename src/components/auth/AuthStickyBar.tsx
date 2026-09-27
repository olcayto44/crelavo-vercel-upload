"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export function AuthStickyBar() {
  const { user, loading, modalOpen, openAuth } = useAuth();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSupabaseSession, setHasSupabaseSession] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSupabaseSession(Boolean(data.session?.user));
      setSessionChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSupabaseSession(Boolean(session?.user));
      setSessionChecked(true);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading || !sessionChecked || modalOpen || user || hasSupabaseSession) return null;
  return <div className="crelavo-auth-sticky"><a href="https://whop.com/checkout/plan_kmGVCrQu90NBV">Buy Starter Pack · $10</a><button type="button" onClick={() => openAuth("login")}>Sign in</button></div>;
}
