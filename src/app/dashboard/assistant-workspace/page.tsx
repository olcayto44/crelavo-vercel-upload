import { Suspense } from "react";
import { redirect } from "next/navigation";
import AssistantPage from "@/components/assistant-work/AssistantPage";

export default async function AssistantWorkspacePage({ searchParams }: {
  searchParams: Promise<{ category?: string | string[]; type?: string | string[]; uiLang?: string | string[] }>;
}) {
  const query = await searchParams;
  const category = Array.isArray(query.category) ? query.category[0] : query.category;
  const type = Array.isArray(query.type) ? query.type[0] : query.type;
  if (category === "website" || /website/i.test(type || "")) {
    const lang = Array.isArray(query.uiLang) ? query.uiLang[0] : query.uiLang;
    redirect("/dashboard/studio-v2?category=website" + (lang && /^[a-z]{2}$/.test(lang) ? "&uiLang=" + lang : ""));
  }
  return <Suspense fallback={null}><AssistantPage /></Suspense>;
}
