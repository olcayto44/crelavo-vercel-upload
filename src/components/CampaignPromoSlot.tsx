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
  storageKey?: string;
  countdownLabel?: string;
};

const DEFAULT_PROMO_DAYS = 7;

function parsePromoPayload(code: string): (CampaignPromoPayload & { eyebrow: string; title: string; body: string; cta: string; href: string }) | null {
  try {
    const value = JSON.parse(code) as CampaignPromoPayload;
    const durationDays = Number(value.durationDays ?? DEFAULT_PROMO_DAYS);
    return {
      eyebrow: String(value.eyebrow || "Limited-time launch offer"),
      title: String(value.title || "12,000 credits are live"),
      body: String(value.body || "Start your 24-hour preview for just $10. The Business plan now gives 12,000 credits instead of the usual 9,000."),
      cta: String(value.cta || "Start preview for $10"),
      href: String(value.href || "/dashboard/payment?package=business&billing=monthly&campaign=business-12000"),
      endsAt: value.endsAt ? String(value.endsAt) : undefined,
      durationDays: Number.isFinite(durationDays) ? durationDays : DEFAULT_PROMO_DAYS,
      storageKey: String(value.storageKey || "crelavo-business-12000-countdown"),
      countdownLabel: String(value.countdownLabel || "Offer ends in")
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
