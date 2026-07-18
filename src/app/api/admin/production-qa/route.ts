import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { qaProduction, summarizeProductionQa } from "@/lib/production-qa";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(20, Math.min(200, Number(searchParams.get("limit") ?? 100) || 100));
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("production_requests")
      .select("id, title, production_type, package_id, status, generation_status, automation_status, estimated_credits, reserved_credits, preview_url, delivery_link, delivery_zip_url, source_files_url, readme_url, admin_notes, request_metadata, input_json, output_json, materials_json, legal_acceptance_snapshot, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const results = (Array.isArray(data) ? data : []).map((item) => qaProduction(item));
    const summary = summarizeProductionQa(results);

    return Response.json({
      generatedAt: new Date().toISOString(),
      limit,
      summary,
      results,
      nextActions: summary.status === "pass"
        ? ["Continue monitoring new productions after provider keys are connected."]
        : ["Open failing productions in /admin/productions.", "Fix critical delivery/legal/metadata gaps before marking ready.", "Re-run smoke:production-qa after code changes."]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load production QA report";
    return Response.json({ error: message }, { status: 500 });
  }
}
