"use client";

import { useEffect, useState } from "react";
import { defaultLanguage, getStoredLanguage, setStoredLanguage, supportedLanguages } from "@/lib/i18n";

export function LanguageSelector() {
  const [language, setLanguage] = useState(defaultLanguage);

  useEffect(() => {
    setLanguage(setStoredLanguage(getStoredLanguage()));
  }, []);

  function changeLanguage(nextLanguage: string) {
    setLanguage(setStoredLanguage(nextLanguage));
  }

  return (
    <label className="language-selector" aria-label="Language selector">
      <span className="language-selector-label">Language</span>
      <select aria-label="Choose language" value={language} onChange={(event) => changeLanguage(event.target.value)}>
        {supportedLanguages.map((item) => <option value={item.code} key={item.code}>{item.shortLabel}</option>)}
      </select>
    </label>
  );
}
