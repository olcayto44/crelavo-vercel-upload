import { evaluateConnectedAccountReadiness } from "@/lib/connected-account-automation";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id ?? body.userId);
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin()
    .from("connected_accounts")
    .select("id, provider, display_name, status, scopes, token_expires_at, access_token_encrypted, refresh_token_encrypted, error_message")
    .eq("user_id", userId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const accounts = (data ?? []).map((account) => ({
    id: account.id,
    provider: account.provider,
    display_name: account.display_name,
    readiness: evaluateConnectedAccountReadiness(account)
  }));

  return Response.json({ accounts, checkedAt: new Date().toISOString() });
}
