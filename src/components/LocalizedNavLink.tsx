"use client";

import { useEffect, useState } from "react";
import { HardReloadLink } from "@/components/HardReloadLink";
import { defaultLanguage, getStoredLanguage, translateNavLabel } from "@/lib/i18n";

export function LocalizedNavLink({ href, label, className }: { href: string; label: string; className?: string }) {
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

  return <HardReloadLink className={className} href={href}>{translateNavLabel(label, language)}</HardReloadLink>;
}
