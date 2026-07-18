import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { sendGrowthIntelligenceReportReadyEmail } from "@/lib/production-email";
import { supabaseAdmin } from "@/lib/supabase";

const allowedStatuses = ["waiting_entitlement", "monitoring_ready", "in_progress", "report_ready", "delivered", "cancelled"];
const allowedEntitlementStatuses = ["waiting_entitlement", "active_service", "credit_eligible", "manual_approved", "insufficient"];

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function mockRequest(body: Record<string, unknown>) {
  const entitlementStatus = body.active_entitlement ? "active_service" : "waiting_entitlement";
  return {
    id: "mock-growth-request",
    user_id: clean(body.user_id) || "mock-user",
    user_email: clean(body.user_email),
    plan_id: clean(body.plan_id) || "growth_intelligence_starter",
    brand_name: clean(body.brand_name),
    own_website: clean(body.own_website),
    competitors: clean(body.competitors),
    watched_pages: clean(body.watched_pages),
    ad_libraries: clean(body.ad_libraries),
    review_sources: clean(body.review_sources),
    target_market: clean(body.target_market),
    report_language: clean(body.report_language) || "English",
    report_frequency: clean(body.report_frequency) || "Weekly executive PDF",
    alert_channel: clean(body.alert_channel) || "Email",
    status: entitlementStatus === "waiting_entitlement" ? "waiting_entitlement" : "monitoring_ready",
    entitlement_status: entitlementStatus,
    estimated_credits: 0,
    report_file_url: null,
    report_file_name: null,
    admin_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = clean(searchParams.get("user_id"));
    const adminEmail = clean(searchParams.get("admin_email") ?? request.headers.get("x-admin-email"));

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return Response.json({ requests: [], mode: "mock" });
    }

    const supabase = supabaseAdmin();
    let query = supabase
      .from("growth_intelligence_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (adminEmail) {
      if (!isAdminRequest(request)) return adminRequiredResponse();
    } else {
      if (!userId) return Response.json({ error: "User session is required." }, { status: 401 });
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ requests: data ?? [] });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load Growth Intelligence requests") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = clean(body.user_id);
  const userEmail = clean(body.user_email);
  const brandName = clean(body.brand_name);
  const ownWebsite = clean(body.own_website);
  const competitors = clean(body.competitors);
  const planId = clean(body.plan_id) || "growth_intelligence_starter";
  const reportLanguage = clean(body.report_language) || "English";
  const reportFrequency = clean(body.report_frequency) || "Weekly executive PDF";
  const alertChannel = clean(body.alert_channel) || "Email";

  if (!userId) return Response.json({ error: "User session is required." }, { status: 401 });
  if (!brandName || !ownWebsite || !competitors) {
    return Response.json({ error: "Brand name, own website and at least one competitor are required." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ request: mockRequest(body), mode: "mock" });
  }

  try {
    const supabase = supabaseAdmin();
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email: userEmail, role: "user" }, { onConflict: "id" });
    if (profileError) throw profileError;

    const { data: balanceRow, error: balanceError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();
    if (balanceError) throw balanceError;

    const balance = Number(balanceRow?.balance ?? 0) || 0;
    const reserved = Number(balanceRow?.reserved ?? 0) || 0;
    const available = Math.max(0, balance - reserved);
    const activeEntitlement = Boolean(body.active_entitlement);
    const entitlementStatus = activeEntitlement ? "active_service" : available > 0 ? "credit_eligible" : "waiting_entitlement";
    const status = entitlementStatus === "waiting_entitlement" ? "waiting_entitlement" : "monitoring_ready";

    const requestPayload = {
      watched_pages: clean(body.watched_pages),
      ad_libraries: clean(body.ad_libraries),
      review_sources: clean(body.review_sources),
      target_market: clean(body.target_market),
      report_language: reportLanguage,
      report_frequency: reportFrequency,
      alert_channel: alertChannel,
      eligibility: {
        activeEntitlement,
        availableCredits: available,
        checkedAt: new Date().toISOString()
      }
    };

    const { data, error } = await supabase
      .from("growth_intelligence_requests")
      .insert({
        user_id: userId,
        user_email: userEmail,
        plan_id: planId,
        brand_name: brandName,
        own_website: ownWebsite,
        competitors,
        watched_pages: clean(body.watched_pages) || null,
        ad_libraries: clean(body.ad_libraries) || null,
        review_sources: clean(body.review_sources) || null,
        target_market: clean(body.target_market) || null,
        report_language: reportLanguage,
        report_frequency: reportFrequency,
        alert_channel: alertChannel,
        status,
        entitlement_status: entitlementStatus,
        estimated_credits: 0,
        request_payload: requestPayload,
        delivery_payload: {
          deliveryType: "dashboard_pdf_file",
          accessRule: "active_service_entitlement_or_credit_eligible"
        }
      })
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ request: data });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not create Growth Intelligence request") }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const id = clean(body.id);
  if (!id) return Response.json({ error: "Request id is required." }, { status: 400 });

  const status = clean(body.status);
  const entitlementStatus = clean(body.entitlement_status);
  if (status && !allowedStatuses.includes(status)) return Response.json({ error: "Invalid status." }, { status: 400 });
  if (entitlementStatus && !allowedEntitlementStatuses.includes(entitlementStatus)) return Response.json({ error: "Invalid entitlement status." }, { status: 400 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ request: { id, ...body, updated_at: new Date().toISOString() }, mode: "mock" });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from("growth_intelligence_requests")
      .select("id, user_id, user_email, brand_name, status, delivery_payload")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return Response.json({ error: "Growth Intelligence request not found." }, { status: 404 });

    const reportFileUrl = clean(body.report_file_url);
    const reportFileName = clean(body.report_file_name) || (reportFileUrl ? "Growth Intelligence report" : "");
    const nextStatus = status || (reportFileUrl ? "report_ready" : "");
    const existingDeliveryPayload = existing.delivery_payload && typeof existing.delivery_payload === "object" ? existing.delivery_payload as Record<string, unknown> : {};
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      admin_notes: clean(body.admin_notes) || null
    };
    if (nextStatus) updatePayload.status = nextStatus;
    if (entitlementStatus) updatePayload.entitlement_status = entitlementStatus;
    if (reportFileUrl || body.report_file_url === "") updatePayload.report_file_url = reportFileUrl || null;
    if (reportFileName || body.report_file_name === "") updatePayload.report_file_name = reportFileName || null;
    if (reportFileUrl) {
      updatePayload.delivery_payload = {
        ...existingDeliveryPayload,
        deliveryType: "dashboard_pdf_file",
        reportFileUrl,
        reportFileName,
        deliveredAt: new Date().toISOString(),
        accessRule: "active_service_entitlement_or_credit_eligible"
      };
    }

    const { data, error } = await supabase
      .from("growth_intelligence_requests")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    let reportEmailResult: unknown = null;
    const shouldNotify = Boolean(reportFileUrl) && ["report_ready", "delivered"].includes(String(data.status ?? nextStatus)) && existing.status !== data.status;
    if (shouldNotify) {
      try {
        reportEmailResult = await sendGrowthIntelligenceReportReadyEmail({
          to: String(data.user_email ?? existing.user_email ?? ""),
          brandName: String(data.brand_name ?? existing.brand_name ?? "Growth Intelligence"),
          requestId: String(data.id),
          reportFileUrl: String(data.report_file_url ?? reportFileUrl),
          reportFileName: String(data.report_file_name ?? reportFileName)
        });
      } catch (emailError) {
        reportEmailResult = { skipped: true, reason: errorMessage(emailError, "Could not send Growth Intelligence report email") };
      }
    }

    if (data?.id && reportEmailResult) {
      const nextDeliveryPayload = {
        ...(data.delivery_payload && typeof data.delivery_payload === "object" ? data.delivery_payload as Record<string, unknown> : {}),
        reportEmailResult
      };
      const { data: withEmailResult, error: emailUpdateError } = await supabase
        .from("growth_intelligence_requests")
        .update({ delivery_payload: nextDeliveryPayload, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select("*")
        .single();
      if (emailUpdateError) throw emailUpdateError;
      return Response.json({ request: withEmailResult, reportEmailResult });
    }

    return Response.json({ request: data, reportEmailResult });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not update Growth Intelligence request") }, { status: 500 });
  }
}
