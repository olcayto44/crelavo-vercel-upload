import { buildMusicProviderRoute } from "@/lib/music-provider-routing";
import { buildProviderPlan, providerRouteMap } from "@/lib/provider-plan";

const criticalProviders = ["video-minimax", "video-fal", "video-kling", "voice-elevenlabs", "music-stable-audio", "payment-whop"];

export function buildProductionProviderRoutingCheck() {
  const plan = buildProviderPlan();
  const byId = new Map(plan.plans.map((item) => [item.id, item]));
  const critical = criticalProviders.map((id) => {
    const item = byId.get(id);
    return {
      id,
      label: item?.label ?? id,
      provider: item?.provider ?? "not_configured",
      status: item?.status ?? "missing",
      intendedUse: item?.intendedUse ?? "Provider route not selected in current environment.",
      finalSetup: item?.finalSetup ?? "Select/configure this provider before live E2E.",
      safeMode: item?.safeMode ?? "Keep production records in waiting_provider_config until configured."
    };
  });
  const readyCritical = critical.filter((item) => item.status === "ready" || item.status === "optional").length;
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      status: critical.some((item) => item.status === "missing") ? "manual_e2e_required" : "ready_for_controlled_e2e",
      readyCritical,
      totalCritical: critical.length,
      note: "Kling/Fal, Minimax, ElevenLabs and music/payment routes should still be proven with one controlled success and one forced-failure E2E before public claims."
    },
    selected: plan.selected,
    routeMap: providerRouteMap(),
    critical,
    musicRoute: buildMusicProviderRoute(),
    checks: [
      "Create one production record and confirm provider call is recorded in output_json/providerLifecycle.",
      "Force one provider failure and confirm the record stays failed/admin-review instead of delivered.",
      "Confirm reserved credits are not silently spent twice on retry.",
      "Confirm dashboard shows provider id/status/result or waiting_provider_config reason.",
      "Confirm final delivery link appears only after provider output/delivery package is ready."
    ]
  };
}
