"use client";

import { useAuth } from "./AuthProvider";

export function FooterStartLinks() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <><a href="/pricing">Pricing</a><a href="/dashboard/create">Assistant</a><a href="/dashboard">Dashboard</a></>;
  }
  return <><a href="/pricing">Pricing</a><a href="/join">Sign up</a><a href="/assistant">Assistant</a><a href="/dashboard">Dashboard</a></>;
}
