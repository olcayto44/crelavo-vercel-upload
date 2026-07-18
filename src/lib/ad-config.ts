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
  { id: "splash", name: "Medium splash/banner ad", placement: "Medium ad area after the home page hero", size: "640x360 desktop, 320x250 mobile", width: 640, height: 360, status: "passive", code: "<div class=\"demo-ad-creative splash\"><strong>MEDIUM SPLASH/BANNER</strong><span>640x360 desktop · 320x250 mobile</span></div>", notes: "Not full-screen; no close button needed. It appears as a centered popup only when enabled." },
  { id: "campaign-promo", name: "Flashing campaign promo", placement: "Home, categories and pricing top-right promo area", size: "320x220 countdown", width: 320, height: 220, status: "active", code: "{\"eyebrow\":\"Launch offer\",\"title\":\"Launch credit sale\",\"body\":\"Use this promo slot for package discounts, launch offers and limited credit campaigns.\",\"cta\":\"View packages\",\"href\":\"/pricing\",\"durationDays\":14}", notes: "Admin can enable/disable/pause this slot. Edit structured campaign fields to change campaign copy, link and countdown duration. Legacy endsAt values are still supported for manually scheduled campaigns." },
  { id: "left-rail", name: "Left rail ad slot", placement: "Desktop left edge", size: "160x600", width: 160, height: 600, status: "passive", code: "<div class=\"demo-ad-creative rail\"><strong>LEFT RAIL AD</strong><span>160x600</span></div>", notes: "For wide skyscraper ads. Visible only on wide screens; no close overlay." },
  { id: "right-rail", name: "Right rail ad slot", placement: "Desktop right edge", size: "160x600", width: 160, height: 600, status: "passive", code: "<div class=\"demo-ad-creative rail\"><strong>RIGHT RAIL AD</strong><span>160x600</span></div>", notes: "For wide skyscraper ads. Visible only on wide screens; no close overlay." }
];

type ConfigPayload = {
  slots?: AdSlotConfig[];
};

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
  return normalized.length ? normalized : defaultAdSlots;
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
