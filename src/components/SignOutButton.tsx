"use client";

import { supabaseBrowser } from "@/lib/supabase";

export function SignOutButton() {
  async function signOut() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    await supabaseBrowser().auth.signOut();
    window.location.href = "/";
  }

  return <button className="btn secondary" type="button" onClick={signOut}>Sign out</button>;
}
