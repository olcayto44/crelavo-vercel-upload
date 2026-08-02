import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const productionId = String(body.production_id ?? body.productionId ?? "").trim();
  if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: current, error: readError } = await supabase
    .from("production_requests")
    .select("*")
    .eq("id", productionId)
    .maybeSingle();

  if (readError) return Response.json({ error: readError.message }, { status: 500 });
  if (!current) return Response.json({ error: "Production not found." }, { status: 404 });

  const outputJson = current.output_json && typeof current.output_json === "object" ? current.output_json as Record<string, unknown> : {};
  const repairedOutput = {
    ...outputJson,
    automationStatus: "lost_output_recovery",
    providerStatus: "output_deleted_regenerate",
    recoveryReason: "Previous generated output was deleted from admin; regenerate this production.",
    visualJob: null,
    renderJob: null,
    finalVideoUrl: null,
    previewUrl: null,
    delivery_url: null,
    deliveryZipUrl: null
  };

  const { data, error } = await supabase
    .from("production_requests")
    .update({
      status: "queued",
      automation_status: "lost_output_recovery",
      generation_status: "output_deleted_regenerate",
      output_json: repairedOutput,
      preview_url: null,
      delivery_link: null,
      delivery_zip_url: null,
      admin_notes: "Previous output was deleted. Press Start Production to regenerate this animation video.",
      updated_at: new Date().toISOString()
    })
    .eq("id", productionId)
    .select("id,status,automation_status,generation_status,admin_notes,output_json")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({
    ok: true,
    production: {
      id: data.id,
      status: data.status,
      automation_status: data.automation_status,
      generation_status: data.generation_status,
      admin_notes: data.admin_notes,
      providerStatus: (data.output_json as Record<string, unknown>)?.providerStatus
    }
  });
}
