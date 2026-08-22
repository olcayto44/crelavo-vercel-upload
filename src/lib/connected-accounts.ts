import crypto from "crypto";
import { connectedProviderLabels, connectedProviders, connectedStatuses, type ConnectedAccountStatus, type ConnectedProvider } from "./connected-account-constants.ts";
export { connectedAccountGuardrails, connectedProviderLabels, connectedProviders, connectedStatuses, providerAccountTypes } from "./connected-account-constants.ts";
export type { ConnectedAccountJobType, ConnectedAccountStatus, ConnectedAccountType, ConnectedProvider } from "./connected-account-constants.ts";

function encryptionSecret() {
  return String(process.env.CONNECTED_ACCOUNT_TOKEN_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_API_TOKEN || process.env.NEXTAUTH_SECRET || "").trim();
}

function keyFromSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptConnectedToken(token: string) {
  const clean = token.trim();
  if (!clean) return null;
  const secret = encryptionSecret();
  if (!secret) return `plain:${Buffer.from(clean, "utf8").toString("base64url")}`;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
  const encrypted = Buffer.concat([cipher.update(clean, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptConnectedToken(value?: string | null) {
  if (!value) return "";
  if (value.startsWith("plain:")) return Buffer.from(value.slice(6), "base64url").toString("utf8");
  if (!value.startsWith("v1:")) return "";
  const secret = encryptionSecret();
  if (!secret) return "";
  const [, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  if (!ivRaw || !tagRaw || !encryptedRaw) return "";
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyFromSecret(secret), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
}

export function normalizeConnectedProvider(value: unknown): ConnectedProvider | null {
  const provider = String(value ?? "").trim().toLowerCase();
  return connectedProviders.includes(provider as ConnectedProvider) ? provider as ConnectedProvider : null;
}

export function normalizeConnectedStatus(value: unknown): ConnectedAccountStatus {
  const status = String(value ?? "").trim().toLowerCase();
  return connectedStatuses.includes(status as ConnectedAccountStatus) ? status as ConnectedAccountStatus : "not_connected";
}

export function safeAccountResponse<T extends Record<string, any>>(account: T) {
  return {
    ...account,
    access_token_encrypted: account.access_token_encrypted ? "stored" : null,
    refresh_token_encrypted: account.refresh_token_encrypted ? "stored" : null,
    token_present: Boolean(account.access_token_encrypted),
    refresh_token_present: Boolean(account.refresh_token_encrypted)
  };
}

export function buildExportReadyPack(input: {
  title?: string;
  mediaUrl?: string;
  caption?: string;
  hashtags?: string[];
  targetProviders?: ConnectedProvider[];
  productId?: string;
  productTags?: string[];
}) {
  const defaultProviders: ConnectedProvider[] = ["tiktok", "youtube", "instagram"];
  const targetProviders: ConnectedProvider[] = input.targetProviders?.length ? input.targetProviders : defaultProviders;
  return targetProviders.map((provider) => ({
    provider,
    label: connectedProviderLabels[provider],
    status: "export_ready",
    mediaUrl: input.mediaUrl ?? "dashboard_delivery_asset",
    title: input.title || "Crelavo production export",
    caption: input.caption || "Review and edit this caption before publishing.",
    hashtags: input.hashtags?.length ? input.hashtags : ["#ai", "#videomarketing", "#ecommerce"],
    productId: input.productId || "",
    productTags: input.productTags?.length ? input.productTags : [],
    format: provider === "youtube" ? "Shorts-ready 9:16 or long-form 16:9" : provider === "shopify" || provider === "woocommerce" ? "Product media + description assets" : "Vertical 9:16 social video",
    guardrail: "Manual download/export is safe now. Direct upload/publish requires connected account verification and final approval."
  }));
}
