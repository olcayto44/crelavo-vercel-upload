"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authHeaders, requireVerifiedBrowserUser } from "@/lib/auth-guards";

type CreditState = {
  available: number;
  reserved: number;
};

export function HeaderCreditPill() {
  const [credits, setCredits] = useState<CreditState | null>(null);

  useEffect(() => {
    async function loadCredits() {
      const auth = await requireVerifiedBrowserUser();
      if (!auth.ok) return;

      const response = await fetch(`/api/credits?user_id=${auth.user.id}`, { cache: "no-store", headers: authHeaders(auth.accessToken) });
      const data = await response.json().catch(() => ({}));
      if (typeof data.available === "number") {
        setCredits({ available: data.available, reserved: data.reserved ?? 0 });
      }
    }

    function onCreditsUpdated(event: Event) {
      const detail = (event as CustomEvent<{ available?: number; reserved?: number }>).detail;
      if (typeof detail?.available === "number") {
        setCredits({ available: detail.available, reserved: detail.reserved ?? 0 });
        return;
      }
      void loadCredits();
    }

    loadCredits();
    window.addEventListener("clipora:credits-updated", onCreditsUpdated);
    return () => window.removeEventListener("clipora:credits-updated", onCreditsUpdated);
  }, []);

  if (!credits) return null;

  return (
    <Link className="credit-pill" href="/dashboard/credits" title="View credits">
      <span>{credits.available.toLocaleString()} credits</span>
      {credits.reserved > 0 ? <small>{credits.reserved.toLocaleString()} reserved</small> : null}
    </Link>
  );
}
