"use client";

import { useEffect } from "react";

const STORE_KEY = "crelavo-aw-last-v2";

export default function AssistantWorkBoot() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    window.onbeforeunload = null;
  }, []);
  return null;
}
