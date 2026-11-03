"use client";
import { useCallback, useEffect, useState } from "react";
import { defaultLanguage, getStoredLanguage, setStoredLanguage } from "@/lib/i18n";
import { translateWorkspaceText } from "@/lib/assistant-work/workspace-i18n";
export function useWorkspaceLanguage() {
  const [language, setLanguage] = useState<string>(defaultLanguage);
  useEffect(() => {
    const sync = () => setLanguage(getStoredLanguage()); sync();
    window.addEventListener("clipora-language-change", sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener("clipora-language-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  const t = useCallback((value: string, variables?: Record<string, string | number>) => translateWorkspaceText(value, language, variables), [language]);
  return { language, t, setLanguage: (value: string) => setStoredLanguage(value) };
}
