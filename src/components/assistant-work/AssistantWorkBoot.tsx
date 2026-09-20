"use client";

/* AssistantWorkBoot rebuild-v1-noportal
   Paste over components/assistant-work/AssistantWorkBoot.tsx
   Overlay off. No intercept. No portal. Clears selam store.
*/

import { useEffect } from "react";

const STORE_KEY = "crelavo-aw-last-v2";
const THREAD_ID = "crelavo-aw-thread";

export default function AssistantWorkBoot() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
      localStorage.removeItem(STORE_KEY);
    } catch {}
    document.querySelectorAll("#" + THREAD_ID).forEach((n) => n.remove());
    const disarm = (e: BeforeUnloadEvent) => {
      e.stopImmediatePropagation();
      try {
        (e as any).returnValue = undefined;
      } catch {}
    };
    window.addEventListener("beforeunload", disarm, true);
    return () => {
      window.removeEventListener("beforeunload", disarm, true);
      document.querySelectorAll("#" + THREAD_ID).forEach((n) => n.remove());
    };
  }, []);
  return null;
}
