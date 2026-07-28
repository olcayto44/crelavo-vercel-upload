import { evaluateConnectedAccountReadiness } from "@/lib/connected-account-automation";
import { safeAccountResponse } from "@/lib/connected-accounts";

export function connectedAccountErrorPayload(error: unknown, fallback: string, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : fallback;
  return {
    error: message,
    context: context ?? {},
    retryable: /timeout|temporar|rate|expired|refresh|network|fetch|token/i.test(message),
    nextStep: /refresh|expired|token/i.test(message)
      ? "Refresh or reconnect this account, then run readiness again."
      : "Check provider settings, callback URL and stored account credentials."
  };
}

export async function markConnectedAccountError(input: { supabase: any; accountId: string; userId: string; error: unknown; fallback: string; status?: "permission_limited" | "expired" | "error" }) {
  const payload = connectedAccountErrorPayload(input.error, input.fallback, { accountId: input.accountId });
  const { data: current } = await input.supabase
    .from("connected_accounts")
    .select("metadata")
    .eq("id", input.accountId)
    .eq("user_id", input.userId)
    .maybeSingle();
  const metadata = typeof current?.metadata === "object" && current.metadata ? current.metadata : {};
  const { data } = await input.supabase
    .from("connected_accounts")
    .update({
      status: input.status ?? "permission_limited",
      error_message: payload.error,
      metadata: { ...metadata, lastError: payload, updatedBy: "connected_account_error_guard" },
      updated_at: new Date().toISOString()
    })
    .eq("id", input.accountId)
    .eq("user_id", input.userId)
    .select("id, provider, display_name, status, scopes, token_expires_at, access_token_encrypted, refresh_token_encrypted, error_message, metadata")
    .maybeSingle();
  return { payload, account: data ? safeAccountResponse(data) : null, readiness: data ? evaluateConnectedAccountReadiness(data) : null };
}
