import { sampleVideos, type SampleComment, type SampleVideo } from "@/lib/sample-videos";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "sample_videos";

type ConfigPayload = {
  videos?: SampleVideo[];
};

function isSampleVideo(value: unknown): value is SampleVideo {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["id", "title", "category", "format", "duration", "quality", "credits", "description", "href"].every((key) => typeof item[key] === "string") && Array.isArray(item.features);
}

function normalizeComments(input: unknown): SampleComment[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const comments = input.map((value) => {
    if (!value || typeof value !== "object") return null;
    const item = value as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const author = typeof item.author === "string" ? item.author.trim() : "";
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if (!id || !author || !text) return null;
    return {
      id,
      author,
      role: item.role === "admin" ? "admin" : "user",
      text,
      createdAt: typeof item.createdAt === "string" ? item.createdAt.trim() : undefined,
      likes: typeof item.likes === "number" ? item.likes : undefined,
      replies: normalizeComments(item.replies)
    } satisfies SampleComment;
  }).filter(Boolean) as SampleComment[];
  return comments.length ? comments : undefined;
}

export function normalizeSampleVideos(input: unknown): SampleVideo[] {
  if (!Array.isArray(input)) return sampleVideos;
  const normalized = input.filter(isSampleVideo).map((item) => ({
    id: item.id.trim(),
    title: item.title.trim(),
    category: item.category.trim(),
    format: item.format.trim(),
    duration: item.duration.trim(),
    quality: item.quality.trim(),
    credits: item.credits.trim(),
    description: item.description.trim(),
    features: item.features.map(String).map((feature) => feature.trim()).filter(Boolean),
    href: item.href.trim(),
    videoUrl: item.videoUrl?.trim() || undefined,
    thumbnailUrl: item.thumbnailUrl?.trim() || undefined,
    aspectRatio: item.aspectRatio?.trim() || undefined,
    platformTargets: Array.isArray(item.platformTargets) ? item.platformTargets.map(String).map((platform) => platform.trim()).filter(Boolean) : undefined,
    shareReady: Boolean(item.shareReady),
    socialCaption: item.socialCaption?.trim() || undefined,
    hashtags: Array.isArray(item.hashtags) ? item.hashtags.map(String).map((tag) => tag.trim()).filter(Boolean) : undefined,
    publishStatus: item.publishStatus,
    scheduledAt: item.scheduledAt?.trim() || undefined,
    likeCount: typeof item.likeCount === "number" ? item.likeCount : undefined,
    shareCount: typeof item.shareCount === "number" ? item.shareCount : undefined,
    comments: normalizeComments(item.comments)
  })).filter((item) => item.id && item.title && item.href);

  return normalized.length ? normalized : sampleVideos;
}

export async function getConfiguredSampleVideos() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;
    const payload = data?.value as ConfigPayload | null;
    return normalizeSampleVideos(payload?.videos);
  } catch {
    return sampleVideos;
  }
}
