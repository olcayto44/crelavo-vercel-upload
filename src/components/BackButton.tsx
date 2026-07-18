"use client";

import { ArrowLeft } from "lucide-react";

export function BackButton({ fallbackHref = "/dashboard" }: { fallbackHref?: string }) {
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = fallbackHref;
  }

  return <button className="btn secondary" type="button" onClick={goBack}><ArrowLeft size={16} /> Go back</button>;
}
