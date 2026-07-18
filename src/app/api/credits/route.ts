import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return Response.json({ error: "User session is required." }, { status: 401 });
  }

  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("credit_balances")
      .select("balance, reserved, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return Response.json({
      balance: data?.balance ?? 0,
      reserved: data?.reserved ?? 0,
      available: (data?.balance ?? 0) - (data?.reserved ?? 0),
      updated_at: data?.updated_at ?? null
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load credits";
    return Response.json({ error: message }, { status: 500 });
  }
}
