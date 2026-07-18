import { optionalEnv, requireEnv } from "@/lib/providers/env";
import type { AdLaunchInput, AdPlatform, RoasMetrics } from "./types";

export function adOAuthUrl(platform: AdPlatform, state: string) {
  const appUrl = optionalEnv("NEXT_PUBLIC_APP_URL") || "https://crelavo.com";

  if (platform === "meta" || platform === "instagram") {
    const clientId = requireEnv("META_APP_ID");
    const redirectUri = encodeURIComponent(`${appUrl}/api/ads/oauth/callback?platform=${platform}`);
    const scope = encodeURIComponent(platform === "instagram"
      ? "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management"
      : "ads_management,ads_read,business_management,pages_show_list,pages_read_engagement");
    return `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${encodeURIComponent(state)}`;
  }

  if (platform === "tiktok") {
    const clientKey = requireEnv("TIKTOK_CLIENT_KEY");
    const redirectUri = encodeURIComponent(`${appUrl}/api/ads/oauth/callback?platform=tiktok`);
    const scope = encodeURIComponent("advertiser.management,ad.upload,ad.manage,report.integrated");
    return `https://business-api.tiktok.com/portal/auth?app_id=${clientKey}&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}&scope=${scope}`;
  }

  if (platform === "youtube") {
    const clientId = requireEnv("GOOGLE_CLIENT_ID");
    const redirectUri = encodeURIComponent(`${appUrl}/api/ads/oauth/callback?platform=youtube`);
    const scope = encodeURIComponent("https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly");
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&access_type=offline&prompt=consent&scope=${scope}&state=${encodeURIComponent(state)}`;
  }

  if (platform === "linkedin") {
    const clientId = requireEnv("LINKEDIN_CLIENT_ID");
    const redirectUri = encodeURIComponent(`${appUrl}/api/ads/oauth/callback?platform=linkedin`);
    const scope = encodeURIComponent("openid profile w_member_social r_ads w_organization_social r_organization_social");
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${encodeURIComponent(state)}`;
  }

  const clientId = requireEnv("X_CLIENT_ID");
  const redirectUri = encodeURIComponent(`${appUrl}/api/ads/oauth/callback?platform=x`);
  const scope = encodeURIComponent("tweet.read tweet.write users.read offline.access");
  return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${encodeURIComponent(state)}&code_challenge=clipora_code_challenge&code_challenge_method=plain`;
}

export async function launchAd(input: AdLaunchInput) {
  if (input.platform === "meta" || input.platform === "instagram") return launchMetaAd(input);
  if (input.platform === "tiktok") return launchTikTokAd(input);
  return launchSocialPublishJob(input);
}

async function launchMetaAd(input: AdLaunchInput) {
  const token = requireEnv("META_SYSTEM_ACCESS_TOKEN");
  const adAccountId = requireEnv("META_AD_ACCOUNT_ID");
  return {
    platform: "meta",
    status: "queued",
    adAccountId,
    payload: {
      campaignName: input.campaignName,
      dailyBudget: input.dailyBudget,
      audienceMode: input.audienceMode,
      videoUrl: input.videoUrl,
      adText: input.adText
    },
    nextApiCalls: [
      `POST /act_${adAccountId}/advideos`,
      `POST /act_${adAccountId}/campaigns`,
      `POST /act_${adAccountId}/adsets`,
      `POST /act_${adAccountId}/ads`
    ],
    tokenPresent: Boolean(token)
  };
}

async function launchTikTokAd(input: AdLaunchInput) {
  const token = requireEnv("TIKTOK_ACCESS_TOKEN");
  const advertiserId = requireEnv("TIKTOK_ADVERTISER_ID");
  return {
    platform: "tiktok",
    status: "queued",
    advertiserId,
    payload: {
      campaignName: input.campaignName,
      dailyBudget: input.dailyBudget,
      audienceMode: input.audienceMode,
      videoUrl: input.videoUrl,
      adText: input.adText
    },
    nextApiCalls: [
      "POST /file/video/ad/upload/",
      "POST /campaign/create/",
      "POST /adgroup/create/",
      "POST /ad/create/"
    ],
    tokenPresent: Boolean(token)
  };
}

async function launchSocialPublishJob(input: AdLaunchInput) {
  const tokenEnvByPlatform: Record<string, string> = {
    youtube: "GOOGLE_ACCESS_TOKEN",
    linkedin: "LINKEDIN_ACCESS_TOKEN",
    x: "X_ACCESS_TOKEN"
  };
  const tokenName = tokenEnvByPlatform[input.platform] ?? "SOCIAL_ACCESS_TOKEN";
  const token = optionalEnv(tokenName);

  return {
    platform: input.platform,
    status: "queued",
    payload: {
      campaignName: input.campaignName,
      dailyBudget: input.dailyBudget,
      audienceMode: input.audienceMode,
      videoUrl: input.videoUrl,
      adText: input.adText
    },
    nextApiCalls: [
      `${input.platform}: upload media asset`,
      `${input.platform}: create post or campaign draft`,
      `${input.platform}: wait for user approval`,
      `${input.platform}: publish or schedule`
    ],
    tokenEnv: tokenName,
    tokenPresent: Boolean(token)
  };
}

export function evaluateRoas(metrics: RoasMetrics) {
  if (metrics.spend >= 30 && metrics.roas < 1) {
    return {
      action: "pause_and_regenerate_hook",
      severity: "high",
      message: "Video düşük ROAS üretti. Bütçeyi korumak için reklamı durdurup yeni hook üretmek gerekir."
    };
  }

  if (metrics.clicks > 0 && metrics.conversions === 0) {
    return {
      action: "improve_offer_or_landing",
      severity: "medium",
      message: "Tıklama var ama dönüşüm yok. Teklif, ürün sayfası veya CTA yeniden test edilmeli."
    };
  }

  return {
    action: "keep_running",
    severity: "low",
    message: "Reklam şu an izlenebilir seviyede. Veri toplamaya devam et."
  };
}
