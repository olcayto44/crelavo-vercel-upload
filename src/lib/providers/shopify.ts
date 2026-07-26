import { hasProviderEnv, optionalEnv, providerEnvNames } from "./env";

export function getShopifyReadiness() {
  const hasClient = hasProviderEnv("shopify");
  const hasSecret = hasProviderEnv("shopifySecret");
  const appUrl = optionalEnv("SHOPIFY_APP_URL") || optionalEnv("NEXT_PUBLIC_APP_URL") || "https://crelavo.com";
  return {
    connected: hasClient && hasSecret,
    required: [...providerEnvNames("shopify"), ...providerEnvNames("shopifySecret")],
    optional: ["SHOPIFY_APP_URL", "SHOPIFY_SCOPES", "SHOPIFY_REDIRECT_URI"],
    appUrl,
    scopes: optionalEnv("SHOPIFY_SCOPES") || "read_products,write_products,read_orders",
    redirectUri: optionalEnv("SHOPIFY_REDIRECT_URI") || `${appUrl.replace(/\/$/, "")}/api/commerce/shopify/callback`,
    note: hasClient && hasSecret ? "Shopify app credentials are present; OAuth/store-specific token flow can be enabled from connected accounts." : "Shopify app credentials are not fully configured."
  };
}
