export type AdPlatform = "meta" | "tiktok" | "instagram" | "youtube" | "linkedin" | "x";

export type ConnectedAdAccount = {
  id: string;
  userId: string;
  platform: AdPlatform;
  accountName: string;
  externalAccountId: string;
  accessTokenEncrypted?: string;
  status: "connected" | "expired" | "revoked";
};

export type AdLaunchInput = {
  userId: string;
  productionId: string;
  platform: AdPlatform;
  campaignName: string;
  dailyBudget: number;
  audienceMode: "broad" | "niche" | "retargeting";
  adText: string;
  videoUrl: string;
};

export type RoasMetrics = {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  roas: number;
};

export type LipSyncTranslateInput = {
  userId: string;
  productionId?: string;
  sourceVideoUrl: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: "heygen" | "elevenlabs";
};

export type BulkGenerationItem = {
  index: number;
  productUrl: string;
  title?: string;
  status: "queued" | "validating" | "running" | "ready" | "failed";
  error?: string;
};

export type BrandKit = {
  userId: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  subtitleColor?: string;
  fontUrl?: string;
  fontName?: string;
};
