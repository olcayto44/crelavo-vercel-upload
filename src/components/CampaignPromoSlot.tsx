import { CampaignPromoClient } from "@/components/CampaignPromoClient";
import { getConfiguredAdSlots } from "@/lib/ad-config";

type CampaignPromoPayload = {
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: string;
  href?: string;
  endsAt?: string;
  durationDays?: number;
};

const DEFAULT_PROMO_DAYS = 14;

function rollingPromoEndDate(durationDays: number) {
  const days = Math.min(Math.max(Math.floor(durationDays) || DEFAULT_PROMO_DAYS, 1), 31);
  const now = new Date();
  const campaignStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(campaignStart + days * 24 * 60 * 60 * 1000).toISOString();
}

function parsePromoPayload(code: string): Required<Omit<CampaignPromoPayload, "durationDays">> | null {
  try {
    const value = JSON.parse(code) as CampaignPromoPayload;
    return {
      eyebrow: String(value.eyebrow || "Launch offer"),
      title: String(value.title || "Launch credit sale"),
      body: String(value.body || "Use this promo slot for package discounts, launch offers and limited credit campaigns."),
      cta: String(value.cta || "View packages"),
      href: String(value.href || "/pricing"),
      endsAt: String(value.endsAt || rollingPromoEndDate(Number(value.durationDays ?? DEFAULT_PROMO_DAYS)))
    };
  } catch {
    return null;
  }
}

export async function CampaignPromoSlot() {
  const slots = await getConfiguredAdSlots();
  const slot = slots.find((item) => item.id === "campaign-promo" && item.status === "active" && item.code.trim());
  if (!slot) return null;

  const payload = parsePromoPayload(slot.code);
  if (!payload) return null;

  return <CampaignPromoClient {...payload} />;
}
