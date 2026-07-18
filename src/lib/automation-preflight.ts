export type AutomationPreflightInput = {
  productionType: string;
  requestMetadata?: Record<string, unknown>;
  inputJson?: Record<string, unknown>;
  videoProvider?: string;
  replicateModel?: string;
};

function metadataObject(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function buildProviderPreflight(input: AutomationPreflightInput) {
  const requestMetadata = input.requestMetadata ?? {};
  const inputJson = input.inputJson ?? {};
  const providerTestMode = Boolean(requestMetadata.providerTestMode ?? inputJson.providerTestMode);
  const isProjectProduction = ["website", "saas", "mobile_app", "admin_project"].includes(input.productionType);
  const requestedDuration = providerTestMode
    ? 5
    : Number(metadataObject(requestMetadata.ecommerceContext).targetDurationSeconds ?? metadataObject(inputJson.ecommerceContext).targetDurationSeconds ?? 8) || 8;
  const videoProvider = input.videoProvider || "runway";

  if (isProjectProduction) {
    return {
      provider: "project_package_builder",
      model: String(metadataObject(requestMetadata.projectWorkflow).technicalStack ?? "managed_source_delivery"),
      durationSeconds: 0,
      aspectRatio: "responsive",
      testMode: providerTestMode
    };
  }

  return {
    provider: videoProvider,
    model: videoProvider === "replicate" ? input.replicateModel || "wan-video/wan-2.2-t2v-fast" : videoProvider,
    durationSeconds: requestedDuration,
    aspectRatio: videoProvider === "runway" ? "720:1280" : "9:16",
    testMode: providerTestMode
  };
}
