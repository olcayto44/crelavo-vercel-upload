import { showcaseVideos, type ShowcaseVideo } from "@/lib/showcase-videos";
import { supabaseAdmin } from "@/lib/supabase";

export type ShowcaseVideoStatus = "draft" | "published";

export type ConfiguredShowcaseVideo = ShowcaseVideo & {
  order: number;
  publishStatus: ShowcaseVideoStatus;
  aspectRatio?: string;
};

type ConfigPayload = { videos?: unknown };
const CONFIG_KEY = "showcase_videos";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(normalizeString).filter(Boolean) : [];
}

function normalizeVideo(value: unknown, fallbackOrder: number): ConfiguredShowcaseVideo | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = normalizeString(item.id || item.slug);
  const title = normalizeString(item.title);
  const description = normalizeString(item.description);
  const videoUrl = normalizeString(item.videoUrl || item.contentUrl);
  const uploadDate = normalizeString(item.uploadDate);
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(id) || !title || !description || !/^https?:\/\//i.test(videoUrl)) return null;
  if (uploadDate && Number.isNaN(Date.parse(uploadDate))) return null;
  const orientation = item.orientation === "landscape" ? "landscape" : "portrait";
  const details = normalizeStringArray(item.details);
  const bestFor = normalizeStringArray(item.bestFor);
  return {
    id,
    title,
    kicker: normalizeString(item.kicker || item.category) || "Crelavo showcase",
    description,
    videoUrl,
    imageUrl: normalizeString(item.imageUrl || item.thumbnailUrl) || undefined,
    duration: normalizeString(item.duration) || undefined,
    uploadDate: uploadDate || new Date().toISOString(),
    details: details.length ? details : [description],
    bestFor: bestFor.length ? bestFor : ["Crelavo showcase"],
    productionDetails: Array.isArray(item.productionDetails)
      ? item.productionDetails.map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const detail = entry as Record<string, unknown>;
          const detailTitle = normalizeString(detail.title);
          const text = normalizeString(detail.text);
          return detailTitle && text ? { title: detailTitle, text } : null;
        }).filter(Boolean) as { title: string; text: string }[]
      : undefined,
    orientation,
    aspectRatio: normalizeString(item.aspectRatio) || (orientation === "portrait" ? "9:16" : "16:9"),
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : fallbackOrder,
    publishStatus: item.publishStatus === "published" ? "published" : "draft"
  };
}

function normalizeDefaults() {
  return showcaseVideos.map((video, index) => ({ ...video, order: index + 1, publishStatus: "published" as const, aspectRatio: video.orientation === "portrait" ? "9:16" : "16:9" }));
}

export function normalizeConfiguredShowcaseVideos(input: unknown, includeDefaults = false): ConfiguredShowcaseVideo[] {
  const values = Array.isArray(input) ? input : [];
  const normalized = values.map((value, index) => normalizeVideo(value, index + 1)).filter(Boolean) as ConfiguredShowcaseVideo[];
  if (!normalized.length && includeDefaults) return normalizeDefaults();
  return normalized.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getConfiguredShowcaseVideos(options: { includeDrafts?: boolean } = {}) {
  try {
    const { data, error } = await supabaseAdmin().from("platform_configs").select("value").eq("key", CONFIG_KEY).maybeSingle();
    if (error) throw error;
    if (!data) return options.includeDrafts ? normalizeDefaults() : normalizeDefaults();
    const payload = data.value as ConfigPayload | null;
    const videos = normalizeConfiguredShowcaseVideos(payload?.videos, true);
    return options.includeDrafts ? videos : videos.filter((video) => video.publishStatus === "published");
  } catch {
    return normalizeDefaults();
  }
}

export function getFallbackShowcaseVideos() {
  return normalizeDefaults();
}

export function getConfiguredShowcaseVideo(id: string, options: { includeDrafts?: boolean } = {}) {
  return getConfiguredShowcaseVideos(options).then((videos) => videos.find((video) => video.id === id));
}

export const showcaseVideosConfigKey = CONFIG_KEY;
