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
      eyebrow: String(value.eyebrow || "Sınırlı süreli kampanya"),
      title: String(value.title || "12.000 kredi şimdi açık"),
      body: String(value.body || "24 saatlik önizlemeyi sadece $10’a başlat. Normalde 9.000 kredi olan Business paketi kampanyada 12.000 kredi."),
      cta: String(value.cta || "$10 ile önizlemeyi başlat"),
      href: String(value.href || "/dashboard/payment?package=business&billing=monthly&campaign=business-12000"),
      endsAt: value.endsAt ? String(value.endsAt) : undefined,
      durationDays: Number.isFinite(durationDays) ? durationDays : DEFAULT_PROMO_DAYS,
      storageKey: String(value.storageKey || "crelavo-business-12000-countdown"),
      countdownLabel: String(value.countdownLabel || "Kalan süre")
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
