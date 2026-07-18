import { getConfiguredAdSlots } from "@/lib/ad-config";
import { SplashAdClient } from "@/components/SplashAdClient";

export async function SplashAd() {
  const slots = await getConfiguredAdSlots();
  const slot = slots.find((item) => item.id === "splash" && item.status === "active" && item.code.trim());
  if (!slot) return null;
  return <SplashAdClient slot={slot} />;
}
