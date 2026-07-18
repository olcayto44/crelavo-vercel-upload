"use client";

import { useEffect, useState } from "react";
import { defaultLanguage, getStoredLanguage, translate, type TranslationKey } from "@/lib/i18n";

export function LocalizedText({ id, fallback }: { id: TranslationKey; fallback: string }) {
  const [language, setLanguage] = useState(defaultLanguage);

  useEffect(() => {
    setLanguage(getStoredLanguage());
    function handleLanguageChange(event: Event) {
      const nextLanguage = (event as CustomEvent<string>).detail;
      setLanguage(nextLanguage || getStoredLanguage());
    }
    window.addEventListener("clipora-language-change", handleLanguageChange);
    return () => window.removeEventListener("clipora-language-change", handleLanguageChange);
  }, []);

  return <>{translate(id, language, fallback)}</>;
}
