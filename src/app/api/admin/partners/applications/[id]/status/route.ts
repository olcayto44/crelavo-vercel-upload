import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

const allowedStatuses = ["pending", "contacted", "approved", "rejected", "approved_pending_code", "live", "paused"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const status = String(body.status ?? "").trim();
  const adminNotes = String(body.admin_notes ?? body.adminNotes ?? "").trim();

  if (!allowedStatuses.includes(status)) {
    return Response.json({ error: "Invalid partner application status." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update partner application status." }, { status: 503 });
  }

  try {
    const update = {
      status,
      admin_notes: adminNotes || null,
      reviewed_at: ["approved", "rejected", "approved_pending_code", "live", "paused"].includes(status) ? new Date().toISOString() : null
    };

    const { data, error } = await supabaseAdmin()
      .from("partner_applications")
      .update(update)
      .eq("id", id)
      .select("id,full_name,email,status,admin_notes,reviewed_at,updated_at")
      .single();

    if (error) throw error;

    return Response.json({ application: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update partner application status.";
    return Response.json({ error: message }, { status: 500 });
  }
}
