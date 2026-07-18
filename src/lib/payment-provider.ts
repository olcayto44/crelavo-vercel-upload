export type BillingMode = "monthly" | "yearly" | "one_time";

export type LemonCheckoutInput = {
  productId: string;
  productName: string;
  billing: BillingMode;
  checkoutMode: "payment" | "subscription";
  variantEnv: string;
  credits?: number | string | null;
  productType?: string | null;
  successPath: string;
  cancelPath: string;
};

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

export function paymentProviderName() {
  return (process.env.PAYMENT_PROVIDER || "whop").trim().toLowerCase();
}

export function isLemonSqueezyEnabled() {
  return paymentProviderName() === "lemon_squeezy" || paymentProviderName() === "lemonsqueezy" || paymentProviderName() === "lemon";
}

export function normalizeEnvToken(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function lemonVariantEnvForProduct(productId: string, billing: BillingMode) {
  const suffix = billing === "yearly" ? "YEARLY" : billing === "one_time" ? "ONE_TIME" : "MONTHLY";
  return `LEMON_VARIANT_${normalizeEnvToken(productId)}_${suffix}`;
}

export function lemonCheckoutUrlEnvForProduct(productId: string, billing: BillingMode) {
  const suffix = billing === "yearly" ? "YEARLY" : billing === "one_time" ? "ONE_TIME" : "MONTHLY";
  return `LEMON_CHECKOUT_URL_${normalizeEnvToken(productId)}_${suffix}`;
}

export function lemonCoreReadiness() {
  const required = ["LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID", "LEMON_SQUEEZY_WEBHOOK_SECRET"];
  return {
    required,
    missing: required.filter((name) => !hasEnv(name)),
    configured: required.map((name) => ({ name, configured: hasEnv(name) }))
  };
}

export async function createLemonSqueezyCheckout(input: LemonCheckoutInput) {
  const directCheckoutUrl = process.env[lemonCheckoutUrlEnvForProduct(input.productId, input.billing)]?.trim();
  if (directCheckoutUrl) {
    return {
      url: directCheckoutUrl,
      directCheckoutUrl: true,
      manualActivation: true,
      note: "Lemon Squeezy direct checkout URL is configured. Admin should reconcile the order/subscription from Lemon Squeezy before activating credits or service access."
    };
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env[input.variantEnv]?.trim();
  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://crelavo.com").trim().replace(/\/$/, "");

  if (!apiKey || !storeId || !variantId) {
    const missing = [
      !apiKey ? "LEMON_SQUEEZY_API_KEY" : "",
      !storeId ? "LEMON_SQUEEZY_STORE_ID" : "",
      !variantId ? input.variantEnv : ""
    ].filter(Boolean);
    return {
      error: `Lemon Squeezy checkout is not configured. Missing env: ${missing.join(", ")}`,
      status: 400
    };
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              product_id: input.productId,
              product_name: input.productName,
              product_type: input.productType || input.checkoutMode,
              billing: input.billing,
              credits: String(input.credits ?? "")
            }
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true
          },
          product_options: {
            redirect_url: `${appUrl}${input.successPath}`,
            receipt_button_text: "Return to Crelavo",
            receipt_link_url: `${appUrl}${input.successPath}`
          },
          expires_at: null
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId
            }
          },
          variant: {
            data: {
              type: "variants",
              id: variantId
            }
          }
        }
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  const url = data?.data?.attributes?.url;

  if (!response.ok || !url) {
    return {
      error: data?.errors?.[0]?.detail || data?.errors?.[0]?.title || "Lemon Squeezy checkout could not start.",
      status: response.status || 500
    };
  }

  return {
    url: String(url),
    directCheckoutUrl: false,
    manualActivation: true,
    note: "Lemon Squeezy checkout created. Webhook/admin reconciliation should confirm entitlement before credits or service access are activated."
  };
}
