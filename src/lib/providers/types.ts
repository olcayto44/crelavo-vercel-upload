export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}

export type ProductSnapshot = {
  url: string;
  title: string;
  description: string;
  price: string;
  imageUrls: string[];
  rawText: string;
};

export type AdBrainResult = {
  productName: string;
  offerAngle: string;
  voiceoverScript: string;
  visualScenes: string[];
  subtitleLines: string[];
  cta: string;
};

export type ProviderJob = {
  provider: string;
  id?: string;
  status: string;
  url?: string;
  raw?: unknown;
};

export type NormalizedProviderStatus = {
  provider: string;
  id?: string;
  status: "queued" | "running" | "succeeded" | "failed" | "unknown";
  outputUrl?: string;
  error?: string;
  raw?: unknown;
};

export type EcommerceAdRunInput = {
  productionId: string;
  jobId: string;
  productUrl: string;
  campaignGoal: string;
  channels: string;
  targetDurationSeconds: number;
  voiceDirection: string;
  subtitleStyle: string;
  style?: string;
  targetCountry?: string;
  targetCity?: string;
  culture?: string;
};

export type EcommerceAdRunResult = {
  product: ProductSnapshot;
  brain: AdBrainResult;
  visualJob: ProviderJob;
  voiceAudioUrl: string;
  subtitleUrl: string;
  renderJob: ProviderJob;
};
