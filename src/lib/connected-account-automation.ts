import { connectedProviderLabels, type ConnectedProvider } from "@/lib/connected-account-constants";

export type PlatformFormatLimit = {
  provider: ConnectedProvider;
  video: string;
  image: string;
  caption: string;
  productMedia?: string;
};

export type ConnectedReadinessStatus = "connected" | "oauth_ready" | "permission_limited" | "expired" | "error" | "not_connected";

export type PlatformFormatValidation = {
  ok: boolean;
  warnings: string[];
  blockers: string[];
  hints: string[];
};

export const platformFormatLimits: Record<ConnectedProvider, PlatformFormatLimit> = {
  tiktok: { provider: "tiktok", video: "Prefer 9:16 MP4, short-form vertical, review TikTok Content Posting limits before upload.", image: "Cover image should be vertical-safe.", caption: "Keep caption concise; hashtags reviewed before publish." },
  youtube: { provider: "youtube", video: "Shorts: 9:16 short video; long-form: 16:9. Confirm upload type before queueing.", image: "Thumbnail required for long-form; Shorts can use frame/cover.", caption: "Title/description must be reviewed before upload." },
  instagram: { provider: "instagram", video: "Reels-friendly 9:16 MP4; avoid unsupported durations/aspect ratios.", image: "Cover should fit Reels grid and story-safe crop.", caption: "Caption and hashtags require review before publish." },
  meta: { provider: "meta", video: "Facebook/Meta video ad or page post format depends on placement.", image: "Feed/story placement needs separate safe crops.", caption: "Ad copy/page post text requires final approval." },
  shopify: { provider: "shopify", video: "Product media must meet Shopify file/media limits before upload.", image: "Product images should be compressed and alt text-ready.", caption: "Product title/description/metafields require merchant approval.", productMedia: "Use draft/media association first; no product page mutation without approval." },
  woocommerce: { provider: "woocommerce", video: "Video usually needs media library or external embed depending store setup.", image: "Media library upload should validate MIME/size.", caption: "Product description/meta updates require merchant approval.", productMedia: "Upload media first, then attach after approval." }
};

export const providerWorkerSkeletons: Record<ConnectedProvider, string[]> = {
  tiktok: ["Validate TikTok Content Posting API scopes", "Create upload/init request", "Upload media chunks", "Save TikTok draft/publish response"],
  youtube: ["Validate YouTube upload scope", "Create resumable upload session", "Upload video metadata/media", "Save YouTube video id and privacy status"],
  instagram: ["Validate Instagram business publishing scope", "Create media container", "Poll container status", "Publish after final approval and save media id"],
  meta: ["Validate Meta page/ad account permission", "Create page post or ad creative draft", "Attach media asset", "Save Meta object id and review status"],
  shopify: ["Validate Shopify product/media permissions", "Upload staged media", "Attach media or update selected product fields", "Save Shopify product/media response"],
  woocommerce: ["Validate WooCommerce REST credentials", "Upload media to WordPress/WooCommerce", "Attach media or update selected product fields", "Save WooCommerce product/media response"]
};

export function normalizeTokenExpiry(value: unknown) {
  const clean = String(value ?? "").trim();
  if (!clean) return null;
  const numeric = Number(clean);
  if (Number.isFinite(numeric) && numeric > 0) {
    const milliseconds = numeric > 10_000_000_000 ? numeric : numeric * 1000;
    return new Date(milliseconds).toISOString();
  }
  const parsed = new Date(clean);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function tokenExpiryFromSeconds(seconds: unknown) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return null;
  return new Date(Date.now() + value * 1000).toISOString();
}

export function evaluateConnectedAccountReadiness(account: { status?: string; token_expires_at?: string | null; access_token_encrypted?: string | null; refresh_token_encrypted?: string | null; scopes?: string[] | null; error_message?: string | null }) {
  const status = String(account.status ?? "not_connected") as ConnectedReadinessStatus;
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : null;
  const now = Date.now();
  const expired = Boolean(expiresAt && expiresAt <= now);
  const expiringSoon = Boolean(expiresAt && expiresAt > now && expiresAt - now < 1000 * 60 * 60 * 24 * 7);
  const tokenPresent = Boolean(account.access_token_encrypted);
  const refreshAvailable = Boolean(account.refresh_token_encrypted);
  const scopes = Array.isArray(account.scopes) ? account.scopes : [];

  if (status === "error") return { status: "error", action: account.error_message || "Connection has an error; reconnect before automation.", tokenPresent, refreshAvailable, expiringSoon, expired, scopes };
  if (expired) return { status: refreshAvailable ? "permission_limited" : "expired", action: refreshAvailable ? "Access token expired; refresh token is available before draft upload." : "Token expired; reconnect before draft upload or publish.", tokenPresent, refreshAvailable, expiringSoon, expired, scopes };
  if (status === "connected" && tokenPresent) return { status: expiringSoon ? "permission_limited" : "connected", action: expiringSoon ? "Token expires soon; refresh before live automation." : "Ready for approval-gated draft job.", tokenPresent, refreshAvailable, expiringSoon, expired, scopes };
  if (status === "oauth_ready") return { status: "oauth_ready", action: "Complete OAuth callback or token setup.", tokenPresent, refreshAvailable, expiringSoon, expired, scopes };
  if (!tokenPresent && status === "connected") return { status: "permission_limited", action: "Connected record exists but token is missing; reconnect before platform mutation.", tokenPresent, refreshAvailable, expiringSoon, expired, scopes };
  return { status, action: "Connection not ready for platform mutation.", tokenPresent, refreshAvailable, expiringSoon, expired, scopes };
}

export function validatePlatformFormat(input: { provider: ConnectedProvider; jobType?: string; mediaUrl?: string; caption?: string; hashtags?: string[]; productId?: string; aspectRatio?: string; durationSeconds?: number | null; mediaType?: string }) : PlatformFormatValidation {
  const warnings: string[] = [];
  const blockers: string[] = [];
  const hints = [platformFormatLimits[input.provider].video, platformFormatLimits[input.provider].caption, platformFormatLimits[input.provider].productMedia].filter(Boolean) as string[];
  const captionLength = String(input.caption ?? "").length;
  const ratio = String(input.aspectRatio ?? "").trim();
  const mediaUrl = String(input.mediaUrl ?? "").trim();
  const productId = String(input.productId ?? "").trim();

  if (input.jobType !== "export_ready" && !mediaUrl) blockers.push("media_url is required before draft upload or publish job.");
  if ((input.provider === "shopify" || input.provider === "woocommerce") && input.jobType === "store_upload" && !productId) blockers.push("product_id is required for store upload jobs.");
  if (["tiktok", "instagram"].includes(input.provider) && ratio && ratio !== "9:16" && ratio !== "4:5") warnings.push(`${input.provider} usually needs vertical 9:16 or 4:5 media.`);
  if (input.provider === "youtube" && ratio && ratio !== "9:16" && ratio !== "16:9") warnings.push("YouTube needs a Shorts 9:16 or long-form 16:9 decision.");
  if (captionLength > 2200 && ["instagram", "meta"].includes(input.provider)) warnings.push("Caption is long for Meta/Instagram review.");
  if (captionLength > 4000 && input.provider === "youtube") warnings.push("YouTube description is long; confirm title/description split before upload.");
  if ((input.hashtags?.length ?? 0) > 30) warnings.push("Hashtag count is high; review platform spam limits before publishing.");

  return { ok: blockers.length === 0, warnings, blockers, hints };
}

export function buildGuardedWorkerPlan(input: { provider: ConnectedProvider; jobType: string; finalApproval?: boolean; readinessStatus?: string; hasConnectedAccount?: boolean; formatValidation?: PlatformFormatValidation }) {
  const limits = platformFormatLimits[input.provider];
  const approvalRequired = input.jobType !== "export_ready";
  const accountReady = input.jobType === "export_ready" || (input.hasConnectedAccount === true && input.readinessStatus === "connected");
  const formatReady = input.formatValidation?.ok ?? true;
  const canStartLiveMutation = approvalRequired && input.finalApproval === true && accountReady && formatReady;
  return {
    provider: input.provider,
    providerLabel: connectedProviderLabels[input.provider],
    jobType: input.jobType,
    canStartLiveMutation,
    approvalRequired,
    accountReady,
    formatReady,
    readinessStatus: input.readinessStatus ?? "not_checked",
    limits,
    formatValidation: input.formatValidation ?? validatePlatformFormat({ provider: input.provider, jobType: input.jobType }),
    workerSkeleton: providerWorkerSkeletons[input.provider],
    nextSteps: canStartLiveMutation
      ? ["Validate token/scopes again immediately before provider call", "Validate media/product format", ...providerWorkerSkeletons[input.provider], "Store provider response and rollback notes"]
      : ["Keep as export-ready or approval-required job", "Do not call live provider mutation endpoint", "Ask user for final approval and verify connected account readiness before publish/upload"]
  };
}
