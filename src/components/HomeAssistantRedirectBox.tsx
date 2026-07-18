"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Bot } from "lucide-react";
import { assistantWorkspaceHref } from "@/lib/assistant-links";
import { defaultLanguage, getStoredLanguage, translate } from "@/lib/i18n";

function detailedIntro(idea: string, language: string) {
  const clean = idea.trim();
  if (!clean) return translate("homeAssistantEmpty", language, "Write what you want to produce; I will analyze the idea and move you to the full-screen AI Assistant Workspace.");
  return translate("homeAssistantRedirectingButton", language, "Redirecting...");
}

export function HomeAssistantRedirectBox() {
  const [language, setLanguage] = useState(defaultLanguage);
  const [idea, setIdea] = useState("");
  const [reply, setReply] = useState(translate("homeAssistantInitial", defaultLanguage, "Write what you want to produce; I will make a short pre-analysis and redirect you to the full-screen AI Assistant Workspace."));
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const activeLanguage = getStoredLanguage();
    setLanguage(activeLanguage);
    setReply(translate("homeAssistantInitial", activeLanguage, "Write what you want to produce; I will make a short pre-analysis and redirect you to the full-screen AI Assistant Workspace."));
    function handleLanguageChange(event: Event) {
      const nextLanguage = (event as CustomEvent<string>).detail || getStoredLanguage();
      setLanguage(nextLanguage);
      if (!redirecting) {
        setReply(translate("homeAssistantInitial", nextLanguage, "Write what you want to produce; I will make a short pre-analysis and redirect you to the full-screen AI Assistant Workspace."));
      }
    }
    window.addEventListener("clipora-language-change", handleLanguageChange);
    return () => window.removeEventListener("clipora-language-change", handleLanguageChange);
  }, [redirecting]);

  function startAssistant() {
    const clean = idea.trim();
    setReply(detailedIntro(clean, language));
    setRedirecting(true);
    const targetHref = assistantWorkspaceHref(clean || undefined);
    window.setTimeout(() => { window.location.href = targetHref; }, 250);
  }

  return (
    <div className="home-assistant-redirect-card">
      <div className="home-assistant-response">
        <span className="badge"><Bot size={14} /> {translate("aiAssistantBadge", language, "AI Assistant")}</span>
        <p>{reply}</p>
      </div>
      <div className="home-assistant-input-row">
        <input value={idea} onChange={(event) => setIdea(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); startAssistant(); } }} placeholder={translate("homeAssistantPlaceholder", language, "What do you want to produce? Example: TikTok ad from a product link")} />
        <button className="btn" type="button" onClick={startAssistant} disabled={redirecting}>{redirecting ? translate("homeAssistantRedirectingButton", language, "Redirecting...") : <>{translate("homeAssistantButton", language, "Send to Assistant")} <ArrowRight size={16} /></>}</button>
      </div>
    </div>
  );
}
