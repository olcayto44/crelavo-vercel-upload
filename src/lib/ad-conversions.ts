type ConversionPayload = {
  eventName: "preview_paid" | "business_paid";
  eventId: string;
  eventTime?: number;
  valueUsd: number;
  currency?: string;
  email?: string;
  productId?: string;
  packageName?: string;
  partnerCode?: string;
  campaign?: string;
  fbclid?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  sourceUrl?: string;
};

type ConversionResult = {
  provider: "meta" | "google_ads";
  status: "sent" | "not_configured" | "failed";
  detail: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function metaEventName(eventName: ConversionPayload["eventName"]) {
  return eventName === "preview_paid" ? "CrelavoPreviewPaid" : "CrelavoBusinessPaid";
}

async function sendMetaConversion(payload: ConversionPayload): Promise<ConversionResult> {
  const pixelId = clean(process.env.META_PIXEL_ID);
  const accessToken = clean(process.env.META_CONVERSIONS_ACCESS_TOKEN);
  if (!pixelId || !accessToken) return { provider: "meta", status: "not_configured", detail: "META_PIXEL_ID or META_CONVERSIONS_ACCESS_TOKEN missing" };

  try {
    const userData: Record<string, unknown> = {};
    if (payload.fbclid) userData.fbc = `fb.1.${payload.eventTime ?? Math.floor(Date.now() / 1000)}.${payload.fbclid}`;
    if (payload.email) userData.em = [payload.email.trim().toLowerCase()];

    const response = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: metaEventName(payload.eventName),
          event_time: payload.eventTime ?? Math.floor(Date.now() / 1000),
          event_id: payload.eventId,
          action_source: "website",
          event_source_url: payload.sourceUrl || process.env.NEXT_PUBLIC_APP_URL || "https://www.crelavo.com",
          user_data: userData,
          custom_data: {
            currency: payload.currency || "USD",
            value: payload.valueUsd,
            content_name: payload.packageName || payload.productId || payload.eventName,
            content_ids: [payload.productId || payload.eventName],
            campaign: payload.campaign || "",
            partner_code: payload.partnerCode || ""
          }
        }]
      })
    });

    if (!response.ok) return { provider: "meta", status: "failed", detail: await response.text() };
    return { provider: "meta", status: "sent", detail: "Meta CAPI event accepted" };
  } catch (error) {
    return { provider: "meta", status: "failed", detail: error instanceof Error ? error.message : "Meta conversion failed" };
  }
}

async function sendGoogleAdsConversion(payload: ConversionPayload): Promise<ConversionResult> {
  const webhookUrl = clean(process.env.GOOGLE_ADS_CONVERSION_WEBHOOK_URL);
  if (!webhookUrl) return { provider: "google_ads", status: "not_configured", detail: "GOOGLE_ADS_CONVERSION_WEBHOOK_URL missing" };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: payload.eventName,
        event_id: payload.eventId,
        value: payload.valueUsd,
        currency: payload.currency || "USD",
        gclid: payload.gclid,
        gbraid: payload.gbraid,
        wbraid: payload.wbraid,
        campaign: payload.campaign,
        partner_code: payload.partnerCode,
        product_id: payload.productId,
        package_name: payload.packageName,
        source_url: payload.sourceUrl
      })
    });

    if (!response.ok) return { provider: "google_ads", status: "failed", detail: await response.text() };
    return { provider: "google_ads", status: "sent", detail: "Google Ads conversion webhook accepted" };
  } catch (error) {
    return { provider: "google_ads", status: "failed", detail: error instanceof Error ? error.message : "Google Ads conversion failed" };
  }
}

export async function sendPaidAdConversions(payload: ConversionPayload) {
  const results = await Promise.all([sendMetaConversion(payload), sendGoogleAdsConversion(payload)]);
  return results;
}
