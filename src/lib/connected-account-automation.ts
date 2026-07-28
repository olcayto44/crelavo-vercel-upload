import { connectedProviderLabels, type ConnectedProvider } from "@/lib/connected-account-constants";

export type PlatformFormatLimit = {
  provider: ConnectedProvider;
  video: string;
  image: string;
  caption: string;
  productMedia?: string;
};

export const platformFormatLimits: Record<ConnectedProvider, PlatformFormatLimit> = {
  tiktok: { provider: "tiktok", video: "Prefer 9:16 MP4, short-form vertical, review TikTok Content Posting limits before upload.", image: "Cover image should be vertical-safe.", caption: "Keep caption concise; hashtags reviewed before publish." },
  youtube: { provider: "youtube", video: "Shorts: 9:16 short video; long-form: 16:9. Confirm upload type before queueing.", image: "Thumbnail required for long-form; Shorts can use frame/cover.", caption: "Title/description must be reviewed before upload." },
  instagram: { provider: "instagram", video: "Reels-friendly 9:16 MP4; avoid unsupported durations/aspect ratios.", image: "Cover should fit Reels grid and story-safe crop.", caption: "Caption and hashtags require review before publish." },
  meta: { provider: "meta", video: "Facebook/Meta video ad or page post format depends on placement.", image: "Feed/story placement needs separate safe crops.", caption: "Ad copy/page post text requires final approval." },
  shopify: { provider: "shopify", video: "Product media must meet Shopify file/media limits before upload.", image: "Product images should be compressed and alt text-ready.", caption: "Product title/description/metafields require merchant approval.", productMedia: "Use draft/media association first; no product page mutation without approval." },
  woocommerce: { provider: "woocommerce", video: "Video usually needs media library or external embed depending store setup.", image: "Media library upload should validate MIME/size.", caption: "Product description/meta updates require merchant approval.", productMedia: "Upload media first, then attach after approval." }
};

export function evaluateConnectedAccountReadiness(account: { status?: string; token_expires_at?: string | null; access_token_encrypted?: string | null; refresh_token_encrypted?: string | null }) {
  const status = String(account.status ?? "not_connected");
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : null;
  const now = Date.now();
  const expired = Boolean(expiresAt && expiresAt <= now);
  const expiringSoon = Boolean(expiresAt && expiresAt > now && expiresAt - now < 1000 * 60 * 60 * 24 * 7);
  if (expired) return { status: "expired", action: "Refresh token before draft upload or publish.", expiringSoon, expired };
  if (status === "connected" && account.access_token_encrypted) return { status: expiringSoon ? "permission_limited" : "connected", action: expiringSoon ? "Token expires soon; refresh before live automation." : "Ready for approval-gated draft job.", expiringSoon, expired };
  if (status === "oauth_ready") return { status: "oauth_ready", action: "Complete OAuth callback or token setup.", expiringSoon, expired };
  return { status, action: "Connection not ready for platform mutation.", expiringSoon, expired };
}

export function buildGuardedWorkerPlan(input: { provider: ConnectedProvider; jobType: string; finalApproval?: boolean }) {
  const limits = platformFormatLimits[input.provider];
  const approvalRequired = input.jobType !== "export_ready";
  const canStartLiveMutation = approvalRequired ? input.finalApproval === true : false;
  return {
    provider: input.provider,
    providerLabel: connectedProviderLabels[input.provider],
    jobType: input.jobType,
    canStartLiveMutation,
    approvalRequired,
    limits,
    nextSteps: canStartLiveMutation
      ? [`Validate ${input.provider} token/scopes`, "Validate media/product format", "Create provider draft/upload job", "Store provider response and rollback notes"]
      : ["Keep as export-ready or approval-required job", "Do not call live provider mutation endpoint", "Ask user for final approval before publish/upload"]
  };
}
