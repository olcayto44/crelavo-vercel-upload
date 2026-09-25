import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();
  try {
    const supabase = supabaseAdmin();
    const [{ data: productions, error: productionError }, { data: balances, error: balanceError }, { count: registeredUsers, error: userError }] = await Promise.all([
      supabase.from("production_requests").select("status, generation_status, estimated_credits, reserved_credits"),
      supabase.from("credit_balances").select("balance, reserved"),
      supabase.from("profiles").select("id", { count: "exact", head: true })
    ]);
    if (productionError) throw productionError;
    if (balanceError) throw balanceError;
    if (userError) throw userError;
    const rows = productions ?? [];
    const status = (row: { status?: string | null; generation_status?: string | null }, value: string) => row.status === value || row.generation_status === value;
    return Response.json({
      registeredUsers: registeredUsers ?? 0,
      totalRequests: rows.length,
      pending: rows.filter((row) => status(row, "pending")).length,
      inProduction: rows.filter((row) => status(row, "in_production") || status(row, "processing") || status(row, "running")).length,
      ready: rows.filter((row) => status(row, "ready") || status(row, "completed")).length,
      failed: rows.filter((row) => status(row, "failed") || status(row, "error")).length,
      cancelled: rows.filter((row) => status(row, "cancelled")).length,
      totalCredits: (balances ?? []).reduce((sum, item) => sum + Number(item.balance ?? 0), 0),
      reservedCredits: (balances ?? []).reduce((sum, item) => sum + Number(item.reserved ?? 0), 0)
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load admin stats" }, { status: 500 });
  }
}
