"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchSession, probeGoogleAuth, signOut as apiSignOut, type SessionUser } from "@/lib/crelavo/authSession";
import { trackCrelavoUserCreated } from "@/lib/crelavo/trackSignup";
import { safeReturnPath, SIGNUP_DESTINATION } from "@/lib/crelavo/redirects";

export type AuthIntent = "login" | "register";
type AuthContextValue = { user: SessionUser | null; loading: boolean; googleReady: boolean; modalOpen: boolean; intent: AuthIntent; nextPath: string | null; openAuth: (intent?: AuthIntent, opts?: { next?: string }) => void; closeAuth: () => void; refresh: () => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const searchParams = useMemo(() => new URLSearchParams(query), [query]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleReady, setGoogleReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [intent, setIntent] = useState<AuthIntent>("login");
  const [nextPath, setNextPath] = useState<string | null>(null);

  const refresh = useCallback(async () => { setUser(await fetchSession()); setLoading(false); }, []);
  useEffect(() => { setQuery(window.location.search); }, []);
  useEffect(() => { void refresh(); void probeGoogleAuth().then(setGoogleReady); }, [refresh]);
  useEffect(() => {
    const signup = searchParams.get("signup");
    if (signup !== "1" || !user) return;
    trackCrelavoUserCreated(searchParams.get("method") === "google" ? "google" : "email");
    const next = new URLSearchParams(searchParams.toString());
    next.delete("signup"); next.delete("method"); next.delete("auth");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [user, searchParams, pathname, router]);
  useEffect(() => {
    if (loading) return;
    const auth = searchParams.get("auth");
    if (user) { setModalOpen(false); if (auth) { router.replace(pathname); setQuery(""); } return; }
    if (auth === "login" || auth === "register") { setIntent(auth); setModalOpen(true); }
  }, [loading, user, searchParams, pathname, router]);

  const openAuth = useCallback((nextIntent: AuthIntent = "login", opts?: { next?: string }) => {
    setIntent(nextIntent);
    const current = `${pathname}${window.location.search}`;
    setNextPath(nextIntent === "register" ? SIGNUP_DESTINATION : safeReturnPath(opts?.next ?? current));
    setModalOpen(true);
  }, [pathname]);
  const closeAuth = useCallback(() => setModalOpen(false), []);
  const signOut = useCallback(async () => { await apiSignOut(); setUser(null); }, []);
  const value = useMemo(() => ({ user, loading, googleReady, modalOpen, intent, nextPath, openAuth, closeAuth, refresh, signOut }), [user, loading, googleReady, modalOpen, intent, nextPath, openAuth, closeAuth, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error("useAuth must be used inside AuthProvider"); return ctx; }
