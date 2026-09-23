"use client";
import { useAuth } from "./AuthProvider";
import { PRO_PATH } from "@/lib/crelavo/authConfig";
export function AuthStickyBar() {
  const { user, loading, modalOpen, openAuth } = useAuth();
  if (loading || modalOpen) return null;
  return <div className="crelavo-auth-sticky">{user ? <a href={PRO_PATH}>Start Pro · $9.99/mo</a> : <><button type="button" onClick={() => openAuth("register")}>Create free account</button><button type="button" onClick={() => openAuth("login")}>Sign in</button></>}</div>;
}
