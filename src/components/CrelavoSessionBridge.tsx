"use client";
import { useEffect } from "react";
export default function CrelavoSessionBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & {
      fetch: typeof fetch;
      __crelavoOriginalFetch?: typeof fetch;
      __crelavoFetchPatchedV3?: boolean;
      __crelavoFetchPatchedV2?: boolean;
      __crelavoFetchPatched?: boolean;
    };
    try {
      if (typeof w.__crelavoOriginalFetch === "function") {
        w.fetch = w.__crelavoOriginalFetch;
      }
    } catch {
      /* native fetch already in place */
    }
    try {
      delete w.__crelavoOriginalFetch;
      delete w.__crelavoFetchPatchedV3;
      delete w.__crelavoFetchPatchedV2;
      delete w.__crelavoFetchPatched;
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem("crelavo-sb-bridged-v2");
      sessionStorage.removeItem("crelavo-sb-bridged-v3");
      localStorage.removeItem("crelavo-sb-bridged-v2");
      localStorage.removeItem("crelavo-sb-bridged-v3");
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
