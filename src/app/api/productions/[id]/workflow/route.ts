import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { buildProductionWorkflowState } from "@/lib/production-workflow";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function requireWorkflowAccess(request: Request, production: { user_id?: string | null }) {
  if (isAdminRequest(request)) return { ok: true as const };
  const userId = String(production.user_id ?? "").trim();
  if (!userId) return { ok: false as const, response: adminRequiredResponse() };
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified;
  return { ok: true as const };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin()
      .from("production_requests")
      .select("id, user_id, status, automation_status, generation_status, approval_status, reserved_credits, estimated_credits, preview_url, delivery_link, delivery_zip_url, source_files_url, output_json")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return Response.json({ error: "Production not found." }, { status: 404 });

    const access = await requireWorkflowAccess(request, data);
    if (!access.ok) return access.response;

    return Response.json({ production_id: id, workflow: buildProductionWorkflowState(data) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load production workflow") }, { status: 500 });
  }
}
