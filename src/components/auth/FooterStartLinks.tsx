"use client";

import { useAuth } from "./AuthProvider";

export function FooterStartLinks() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <><a href="/pricing">Pricing</a><a href="/dashboard/studio">Studio</a><a href="/dashboard">Dashboard</a></>;
  }
  return <><a href="/pricing">Pricing</a><a href="/studio">Studio</a><a href="/dashboard">Dashboard</a></>;
}
