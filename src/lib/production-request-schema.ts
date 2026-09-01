export function productionRequestUpdatePayload(payload: Record<string, unknown>) {
  const { provider, provider_job_id, output_json, ...databasePayload } = payload;
  const output = output_json && typeof output_json === "object" && !Array.isArray(output_json)
    ? { ...(output_json as Record<string, unknown>) }
    : undefined;

  if (provider !== undefined || provider_job_id !== undefined) {
    const compatibleOutput = output ?? {};
    if (provider !== undefined) compatibleOutput.provider = provider;
    if (provider_job_id !== undefined) {
      compatibleOutput.providerJobId = provider_job_id;
      compatibleOutput.provider_job_id = provider_job_id;
    }
    databasePayload.output_json = compatibleOutput;
  } else if (output_json !== undefined) {
    databasePayload.output_json = output_json;
  }

  return databasePayload;
}

export function isProductionRequestSchemaCacheError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const message = [record.message, record.details, record.hint, record.code].filter(Boolean).join(" ");
  return String(record.code ?? "") === "PGRST204" || /schema cache|could not find.*column|column .* does not exist/i.test(message);
}
