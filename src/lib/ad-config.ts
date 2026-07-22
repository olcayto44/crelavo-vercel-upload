import { rejectSuspiciousText } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

export type AdSlotConfig = {
  id: string;
  name: string;
  placement: string;
  size: string;
  width: number;
  height: number;
  status: "active" | "paused" | "passive";
  code: string;
  notes: string;
};

const CONFIG_KEY = "ad_slots";

export const defaultAdSlots: AdSlotConfig[] = [
  { id: "header", name: "Header ad slot", placement: "Home page top section below the hero", size: "970x90 desktop, 320x100 mobile", width: 970, height: 90, status: "passive", code: "<div class=\"demo-ad-creative\"><strong>HEADER AD</strong><span>970x90 desktop · 320x100 mobile</span></div>", notes: "For Google AdSense responsive or 970x90 banner code. No close overlay; it appears as a fixed in-page ad block." },
  { id: "content", name: "In-content ad slot", placement: "Home page between sample videos and categories", size: "728x90 or responsive", width: 728, height: 90, status: "passive", code: "<div class=\"demo-ad-creative\"><strong>IN-CONTENT AD</strong><span>728x90 or responsive</span></div>", notes: "For article, content or sponsor banners. No close overlay." },
  { id: "sidebar", name: "Sidebar ad slot", placement: "Dashboard/admin sidebar plan", size: "300x250", width: 300, height: 250, status: "passive", code: "<div class=\"demo-ad-creative box\"><strong>SIDEBAR AD</strong><span>300x250</span></div>", notes: "Medium rectangle slot for dashboard or admin side areas. No close overlay." },
  { id: "footer", name: "Footer ad slot", placement: "Above the home page footer", size: "970x250 or responsive", width: 970, height: 250, status: "passive", code: "<div class=\"demo-ad-creative large\"><strong>FOOTER AD</strong><span>970x250 or responsive</span></div>", notes: "For lower-page sponsor or partner ads. No close overlay." },
  { id: "splash", name: "Team Annual VIP Agency Bundle splash campaign", placement: "Home page visitor splash popup", size: "640x360 desktop, 320x250 mobile", width: 640, height: 360, status: "active", code: "{\"eyebrow\":\"LIMITED TIME ONLY: VIP AGENCY BUNDLE\",\"title\":\"Scale your e-commerce video production to the moon\",\"body\":\"Stop wasting thousands on video editors or slow rendering tools. Generate around 300 AI product video drafts and variations for Shopify & Amazon, run 12 simultaneous tasks, and manage your whole team in one workspace.\",\"cta\":\"START 24-HOUR TEAM PREVIEW FOR $20\",\"href\":\"/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000\",\"durationDays\":7,\"storageKey\":\"crelavo-team-annual-174000-countdown\",\"countdownLabel\":\"VIP deal ends in\",\"priceBadge\":\"$1,300/yr\",\"kicker\":\"Pay less, get 30,000 BONUS credits\",\"bonusPrimary\":\"174,000 credits today\",\"bonusSecondary\":\"Regular: 144,000\"}", notes: "Centered Team Annual splash popup with upper-right close button. Same browser sees it up to 3 times per day. CTA goes to Team yearly checkout. Pricing/category promo slots remain on the $79 Business campaign." },
  { id: "campaign-promo", name: "$79 / 12,000 credits campaign promo", placement: "Home, categories and pricing top-right promo area", size: "320x220 countdown", width: 320, height: 220, status: "active", code: "{\"eyebrow\":\"Limited-time launch offer\",\"title\":\"12,000 credits are live\",\"body\":\"Start your 24-hour preview for just $10. The Business plan now gives 12,000 credits instead of the usual 9,000.\",\"cta\":\"Start preview for $10\",\"href\":\"/dashboard/payment?package=business&billing=monthly&campaign=business-12000\",\"durationDays\":7,\"storageKey\":\"crelavo-business-12000-countdown\",\"countdownLabel\":\"Offer ends in\"}", notes: "Admin can enable/disable/pause this slot. Structured campaign fields control copy, checkout link and visitor-based countdown duration. Legacy endsAt values are still supported for manually scheduled campaigns." },
  { id: "left-rail", name: "Left rail ad slot", placement: "Desktop left edge", size: "160x600", width: 160, height: 600, status: "passive", code: "<div class=\"demo-ad-creative rail\"><strong>LEFT RAIL AD</strong><span>160x600</span></div>", notes: "For wide skyscraper ads. Visible only on wide screens; no close overlay." },
  { id: "right-rail", name: "Right rail ad slot", placement: "Desktop right edge", size: "160x600", width: 160, height: 600, status: "passive", code: "<div class=\"demo-ad-creative rail\"><strong>RIGHT RAIL AD</strong><span>160x600</span></div>", notes: "For wide skyscraper ads. Visible only on wide screens; no close overlay." }
];

type ConfigPayload = {
  slots?: AdSlotConfig[];
};

const launchCampaignDefaults = new Map(defaultAdSlots.filter((slot) => ["splash", "campaign-promo"].includes(slot.id)).map((slot) => [slot.id, slot]));

function shouldUpgradeLaunchCampaignSlot(slot: AdSlotConfig) {
  if (!launchCampaignDefaults.has(slot.id)) return false;
  const signature = `${slot.name} ${slot.code} ${slot.notes}`.toLowerCase();
  return !slot.code.trim()
    || signature.includes("medium splash/banner")
    || signature.includes("medium splash")
    || signature.includes("launch credit sale")
    || signature.includes("limited credit campaigns")
    || signature.includes("flash launch deal")
    || signature.includes("get 3,000 bonus credits")
    || signature.includes("grab 12,000 credits")
    || signature.includes("sınırlı süreli kampanya")
    || signature.includes("12.000 kredi")
    || signature.includes("önizlemeyi")
    || signature.includes("kalan süre")
    || signature.includes("12,000 credits are live")
    || signature.includes("start preview for $10")
    || signature.includes("business-12000")
    || signature.includes("view packages");
}

function applyLaunchCampaignDefaults(slots: AdSlotConfig[]) {
  const upgraded = slots.map((slot) => {
    const campaignDefault = launchCampaignDefaults.get(slot.id);
    return campaignDefault && shouldUpgradeLaunchCampaignSlot(slot) ? campaignDefault : slot;
  });

  for (const campaignDefault of launchCampaignDefaults.values()) {
    if (!upgraded.some((slot) => slot.id === campaignDefault.id)) upgraded.push(campaignDefault);
  }

  return upgraded;
}

function isAdSlot(value: unknown): value is AdSlotConfig {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["id", "name", "placement", "size", "status", "code", "notes"].every((key) => typeof item[key] === "string") && typeof item.width === "number" && typeof item.height === "number";
}

function sanitizeAdSlotCode(slot: AdSlotConfig) {
  const safety = rejectSuspiciousText([slot.code, slot.notes]);
  if (safety.ok) return { code: slot.code, status: slot.status };
  return {
    code: "",
    status: "passive" as const
  };
}

export function normalizeAdSlots(input: unknown): AdSlotConfig[] {
  if (!Array.isArray(input)) return defaultAdSlots;
  const normalized = input.filter(isAdSlot).map((item) => {
    const status = ["active", "paused", "passive"].includes(item.status) ? item.status : "passive";
    const baseSlot: AdSlotConfig = {
      id: item.id.trim(),
      name: item.name.trim(),
      placement: item.placement.trim(),
      size: item.size.trim(),
      width: Number(item.width) || 300,
      height: Number(item.height) || 250,
      status,
      code: item.code,
      notes: item.notes.trim()
    };
    const sanitized = sanitizeAdSlotCode(baseSlot);
    return { ...baseSlot, ...sanitized };
  }).filter((item) => item.id && item.name);
  return normalized.length ? applyLaunchCampaignDefaults(normalized) : defaultAdSlots;
}

export function getAdRotationPool(slots: AdSlotConfig[], slotId: string) {
  const variantPrefix = `${slotId}-`;
  return slots
    .filter((item) => item.status === "active" && item.code.trim() && (item.id === slotId || item.id.startsWith(variantPrefix)))
    .sort((a, b) => {
      if (a.id === slotId) return -1;
      if (b.id === slotId) return 1;
      return a.id.localeCompare(b.id);
    });
}

export async function getConfiguredAdSlots() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;
    const payload = data?.value as ConfigPayload | null;
    return normalizeAdSlots(payload?.slots);
  } catch {
    return defaultAdSlots;
  }
}
