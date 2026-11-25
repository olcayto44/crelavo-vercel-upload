import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/crelavo/categoryCatalog";

export default async function CreatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const raw = await searchParams;
 const params = new URLSearchParams();
 for (const [key, value] of Object.entries(raw)) if (typeof value === "string") params.set(key, value);
 // Existing deep links with a brief, example, mode or package retain the legacy
 // workflow until the Studio V2 engine can consume their full context.
 if ([...params.keys()].some(key => !["category", "type", "uiLang"].includes(key))) redirect("/dashboard/assistant-workspace?" + params.toString());
 const selected = params.get("category") || params.get("type");
 const category = CATEGORIES.find(item => item.id === selected || item.label === selected || item.type === selected);
 const next = new URLSearchParams();
 if (category) next.set("category", category.id);
 const language = params.get("uiLang");
 if (language && ["en","tr","de","es","fr","ar"].includes(language)) next.set("uiLang", language);
 redirect("/dashboard/studio-v2" + (next.size ? "?" + next.toString() : ""));
}
