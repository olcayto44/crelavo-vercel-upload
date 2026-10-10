import { decryptConnectedToken } from "@/lib/connected-accounts";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || "").trim();
  const accountId = String(url.searchParams.get("connected_account_id") || "").trim();
  if (!userId || !accountId) return Response.json({ error: "user_id and connected_account_id are required." }, { status: 400 });
  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;
  const { data: account, error } = await supabaseAdmin().from("connected_accounts").select("id,provider,access_token_encrypted,status").eq("id", accountId).eq("user_id", userId).single();
  if (error || !account || account.provider !== "pinterest") return Response.json({ error: "Pinterest account not found." }, { status: 404 });
  const token = decryptConnectedToken(account.access_token_encrypted);
  if (!token) return Response.json({ error: "Pinterest access token is missing." }, { status: 400 });
  const response = await fetch("https://api.pinterest.com/v5/boards?page_size=100", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return Response.json({ error: String(data.message || data.error || "Pinterest boards could not be loaded."), details: data }, { status: response.status });
  return Response.json({ boards: Array.isArray(data.items) ? data.items.map((board: any) => ({ id: String(board.id), name: String(board.name || ""), description: String(board.description || ""), privacy: board.privacy || "PUBLIC" })) : [], bookmark: data.bookmark || null });
}