import { defaultFaqItems, type FaqItem } from "@/lib/site-content";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "faq_items";

type ConfigPayload = {
  faqs?: FaqItem[];
};

function isFaqItem(value: unknown): value is FaqItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["id", "question", "answer", "category"].every((key) => typeof item[key] === "string") && typeof item.order === "number" && typeof item.active === "boolean";
}

export function normalizeFaqItems(input: unknown): FaqItem[] {
  if (!Array.isArray(input)) return defaultFaqItems;
  const normalized = input.filter(isFaqItem).map((item, index) => ({
    id: item.id.trim() || `faq-${index + 1}`,
    question: item.question.trim(),
    answer: item.answer.trim(),
    category: item.category.trim() || "General",
    order: Number.isFinite(item.order) ? item.order : index + 1,
    active: Boolean(item.active)
  })).filter((item) => item.id && item.question && item.answer);

  return normalized.length ? normalized.sort((a, b) => a.order - b.order) : defaultFaqItems;
}

export async function getConfiguredFaqItems() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;
    const payload = data?.value as ConfigPayload | null;
    return normalizeFaqItems(payload?.faqs).filter((item) => item.active);
  } catch {
    return defaultFaqItems.filter((item) => item.active);
  }
}
