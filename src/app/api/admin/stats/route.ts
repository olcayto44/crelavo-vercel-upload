import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const supabase = supabaseAdmin();
    const { data: requests, error: requestsError } = await supabase
      .from("video_requests")
      .select("status, estimated_credits, reserved_credits");

    if (requestsError) throw requestsError;

    const { data: balances, error: balancesError } = await supabase
      .from("credit_balances")
      .select("balance, reserved");

    if (balancesError) throw balancesError;

    const totalRequests = requests?.length ?? 0;
    const pending = requests?.filter((item) => item.status === "pending").length ?? 0;
    const inProduction = requests?.filter((item) => item.status === "in_production").length ?? 0;
    const ready = requests?.filter((item) => item.status === "ready").length ?? 0;
    const failed = requests?.filter((item) => item.status === "failed").length ?? 0;
    const cancelled = requests?.filter((item) => item.status === "cancelled").length ?? 0;
    const totalCredits = balances?.reduce((sum, item) => sum + (item.balance ?? 0), 0) ?? 0;
    const reservedCredits = balances?.reduce((sum, item) => sum + (item.reserved ?? 0), 0) ?? 0;

    return Response.json({
      totalRequests,
      pending,
      inProduction,
      ready,
      failed,
      cancelled,
      totalCredits,
      reservedCredits
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load admin stats";
    return Response.json({ error: message }, { status: 500 });
  }
}
