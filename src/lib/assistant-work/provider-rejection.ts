/** Never expose raw provider response bodies, credentials or prompts. */
export function providerRejection(status: number, data: unknown) {
  const body = data && typeof data === "object" ? data as Record<string, any> : {};
  const raw = body.base_resp?.status_code ?? body.error?.code;
  const providerCode = typeof raw === "number" && Number.isFinite(raw) ? String(raw) : typeof raw === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(raw) ? raw : undefined;
  const reason = status === 401 || status === 403 ? "authorization" : status === 404 ? "endpoint_unavailable" : status === 400 || status === 422 ? "invalid_request" : "provider_error";
  return {status, reason, ...(providerCode ? {providerCode} : {})};
}
