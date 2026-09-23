"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
export function AuthHeaderControls() {
  const { user, loading, openAuth, signOut } = useAuth(); const [open, setOpen] = useState(false);
  if (loading) return null;
  if (!user) return <div className="crelavo-auth-controls"><button type="button" className="crelavo-auth-signin" onClick={() => openAuth("login")}>Sign in</button><button type="button" className="crelavo-auth-join" onClick={() => openAuth("register")}>Create account</button></div>;
  const label = (user.name || user.email || "A").slice(0, 1).toUpperCase();
  return <div className="crelavo-account-control"><button type="button" className="crelavo-avatar" onClick={() => setOpen((value) => !value)} aria-label="Account">{user.image ? <img src={user.image} alt="" /> : label}</button>{open ? <div className="crelavo-account-menu"><span>{user.email}</span><a href="/dashboard">Dashboard</a><a href="/pricing">Pricing</a><button type="button" onClick={() => void signOut()}>Sign out</button></div> : null}</div>;
}
