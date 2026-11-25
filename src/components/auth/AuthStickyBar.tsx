"use client";
import { useEffect, useState } from "react";
import {usePathname} from "next/navigation";
import {categoryForPublicPath} from "@/lib/category-public-routes";
import { supabaseBrowser } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export function AuthStickyBar() {
  const { user, loading, modalOpen, openAuth } = useAuth();
  const pathname=usePathname();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSupabaseSession, setHasSupabaseSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    try {
    const supabase = supabaseBrowser();
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSupabaseSession(Boolean(data.session?.user));
      setSessionChecked(true);
    }).catch(() => { if (mounted) { setHasSupabaseSession(false); setSessionChecked(true); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSupabaseSession(Boolean(session?.user));
      setSessionChecked(true);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    } catch { setSessionChecked(true); setHasSupabaseSession(false); }
  }, []);

  if(pathname==="/categories"||categoryForPublicPath(pathname)||(pathname==="/dashboard/studio"||pathname.startsWith("/dashboard/studio/")||pathname==="/dashboard/studio-v2")||pathname.startsWith("/admin")||pathname==="/design-preview/admin")return null;
  if (loading || !sessionChecked || modalOpen || user || hasSupabaseSession) return null;
  return <div className="crelavo-auth-sticky"><a href="https://whop.com/checkout/ch_MTZtuBJl2OuZtL8/">Start Pro · $9.99/mo</a><button type="button" onClick={() => openAuth("login")}>Sign in</button></div>;
}
