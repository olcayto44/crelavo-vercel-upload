import { CampaignPromoClient } from "@/components/CampaignPromoClient";
import { getConfiguredAdSlots } from "@/lib/ad-config";

export async function CampaignPromoSlot() {
  const slots = await getConfiguredAdSlots();
  const slot = slots.find((item) => item.id === "campaign-promo" && item.status === "active" && item.code.trim());
  if (!slot) return null;
  return <CampaignPromoClient />;
}