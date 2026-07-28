export type ConnectedProvider = "tiktok" | "youtube" | "instagram" | "meta" | "shopify" | "woocommerce";
export type ConnectedAccountStatus = "not_connected" | "oauth_ready" | "connected" | "permission_limited" | "expired" | "error";
export type ConnectedAccountType = "social" | "commerce";
export type ConnectedAccountJobType = "export_ready" | "draft_upload" | "one_click_publish" | "store_upload";

export const connectedProviders: ConnectedProvider[] = ["tiktok", "youtube", "instagram", "meta", "shopify", "woocommerce"];
export const connectedStatuses: ConnectedAccountStatus[] = ["not_connected", "oauth_ready", "connected", "permission_limited", "expired", "error"];

export const connectedProviderLabels: Record<ConnectedProvider, string> = {
  tiktok: "TikTok",
  youtube: "YouTube Shorts",
  instagram: "Instagram / Reels",
  meta: "Meta / Facebook",
  shopify: "Shopify",
  woocommerce: "WooCommerce"
};

export const providerAccountTypes: Record<ConnectedProvider, ConnectedAccountType> = {
  tiktok: "social",
  youtube: "social",
  instagram: "social",
  meta: "social",
  shopify: "commerce",
  woocommerce: "commerce"
};

export const connectedAccountGuardrails = [
  "Export-ready delivery is available before direct publishing.",
  "Draft upload and one-click publish require a connected account, valid token, platform permission and explicit user approval.",
  "Never change a store product page or publish to a social account without a final user confirmation.",
  "Public copy must say export-ready, managed setup or coming automation until live E2E publish/upload is verified."
];
