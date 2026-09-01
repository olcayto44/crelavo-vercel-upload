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

export type AdPerformanceScoreResult = {
  totalScore: number;
  verdict: string;
  hook: { score: number; analysis: string; rewrite: string };
  messageClarity: { score: number; analysis: string };
  targetAudience: { score: number; analysis: string; audience: string };
  valueProposition: { score: number; analysis: string };
  cta: { score: number; analysis: string; rewrite: string };
  platformFit: { score: number; analysis: string; platforms: string[] };
  risks: string[];
  recommendations: string[];
  rewrittenBrief: string;
  rewrittenScript: string;
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
  width?: number;
  height?: number;
  durationSeconds?: number;
  hasAudio?: boolean;
  resolutionLabel?: string;
  error?: string;
  httpStatus?: number;
  errorCategory?: "http_error" | "not_found" | "expired" | "timeout" | "provider_error" | "unknown";
  errorMessage?: string;
  raw?: unknown;
};

export type EcommerceAdRunInput = {
  productionId: string;
  jobId: string;
  productUrl?: string;
  productBrief?: string;
  campaignGoal: string;
  channels: string;
  targetDurationSeconds: number;
  aspectRatio?: string;
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
  renderJob?: ProviderJob | null;
};
