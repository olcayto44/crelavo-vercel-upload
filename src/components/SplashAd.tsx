import { headers } from "next/headers";
import { getConfiguredAdSlots } from "@/lib/ad-config";
import { SplashAdClient } from "@/components/SplashAdClient";
import { geoOfferFromHeaders } from "@/lib/geo-offers";

export async function SplashAd() {
  const slots = await getConfiguredAdSlots();
  const slot = slots.find((item) => item.id === "splash" && item.status === "active" && item.code.trim());
  if (!slot) return null;
  const geoOffer = geoOfferFromHeaders(await headers());
  return <SplashAdClient slot={slot} geoOffer={geoOffer} />;
}
