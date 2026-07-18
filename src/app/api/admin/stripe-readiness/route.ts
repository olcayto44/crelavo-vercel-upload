import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { normalizePackageConfig, PACKAGE_CONFIG_KEY } from "@/lib/package-config";
import { lemonCoreReadiness, lemonVariantEnvForProduct } from "@/lib/payment-provider";
import { supabaseAdmin } from "@/lib/supabase";

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

function compact(values: Array<string | undefined>) {
  return values.map((value) => String(value ?? "").trim()).filter(Boolean);
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const { data } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", PACKAGE_CONFIG_KEY)
      .maybeSingle();
    const config = normalizePackageConfig(data?.value);
    const lemonCore = lemonCoreReadiness();
    const packageEnvNames = Array.from(new Set(config.creditPackages.flatMap((item) => {
      if (item.planType === "topup" || item.planType === "production_one_time") return [lemonVariantEnvForProduct(item.id, "one_time")];
      return [lemonVariantEnvForProduct(item.id, "monthly"), lemonVariantEnvForProduct(item.id, "yearly")];
    })));
    const paymentLinkEntries = config.creditPackages.flatMap((item) => {
      if (item.planType === "topup" || item.planType === "production_one_time") return [{ packageId: item.id, label: item.name, billing: "one_time", url: item.paymentLinkUrl ?? "" }];
      return [
        { packageId: item.id, label: item.name, billing: "monthly", url: item.monthlyPaymentLinkUrl ?? "" },
        { packageId: item.id, label: item.name, billing: "yearly", url: item.yearlyPaymentLinkUrl ?? "" }
      ];
    });
    const paymentLinksConfigured = paymentLinkEntries.filter((entry) => entry.url.trim()).length;
    const required = [...lemonCore.required, ...packageEnvNames];
    const missing = required.filter((name) => !hasEnv(name));
    const missingCore = lemonCore.missing;
    const ready = missing.length === 0;
    const paymentLinkFallbackReady = paymentLinksConfigured > 0;
    const earlyLaunchReady = paymentLinkFallbackReady && missingCore.length === 0;

    return Response.json({
      ready,
      paymentLinkFallbackReady,
      earlyLaunchReady,
      missingCore,
      required,
      missing,
      core: lemonCore.configured,
      priceIds: packageEnvNames.map((name) => ({ name, configured: hasEnv(name) })),
      paymentLinks: paymentLinkEntries.map((entry) => ({ ...entry, configured: Boolean(entry.url.trim()) })),
      paymentLinksConfigured,
      packageCount: config.creditPackages.length,
      note: ready
        ? "Lemon Squeezy checkout has all required core keys and package variant env vars."
        : earlyLaunchReady
          ? "Lemon Squeezy core API/webhook env is present and direct checkout URLs are configured. Early launch can use direct checkout URLs plus admin manual activation while variant env automation is completed."
          : paymentLinkFallbackReady
            ? "Direct checkout URLs are configured, but Lemon Squeezy core API/webhook env is incomplete. Add core env before relying on webhook notifications and admin reconciliation. Secret values are never exposed."
            : "Missing env names only are shown. Add Lemon checkout URLs for early launch or add Lemon API/variant env for automated checkout creation. Secret values are never exposed."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment readiness could not be checked.";
    return Response.json({ error: message }, { status: 500 });
  }
}
