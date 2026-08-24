import { after } from "next/server";
import { adminRequiredResponse, getAdminEmail, isAdminRequest } from "@/lib/admin-guard";
import { apiCostGuardConfig, enforceDailyProductionBudget, enforceRouteBudget } from "@/lib/api-cost-guard";
import { createAutomationJobId, ecommerceAdAutomationSteps, ecommerceAdPipeline, initialAutomationSteps } from "@/lib/automation";
import { normalizeDeliveryCreditRates } from "@/lib/delivery-credit-rates";
import { validateProductionSafety } from "@/lib/content-safety";
import { legalAcceptanceSnapshot, productionResponsibilityText, rightsWarrantyText, LEGAL_ACCEPTANCE_VERSION } from "@/lib/legal";
import { platformMaterialsByIds } from "@/lib/platform-materials";
import { deliveryPackageForProduction } from "@/lib/delivery-package";
import { findConfiguredProductionPackage, normalizePackageConfig, PACKAGE_CONFIG_KEY } from "@/lib/package-config";
import { estimateProductionCost, getProductionPackage } from "@/lib/production";
import { estimateProductionProfit } from "@/lib/production-profit";
import { buildProductionWorkflowState } from "@/lib/production-workflow";
import { qualityProfileForProduction } from "@/lib/production-quality";
import { providerReadinessSummary } from "@/lib/provider-readiness";
import { hasCinematicActionIntent, hasMinimaxPresenterIntent, sanitizeProviderRouteSignal } from "@/lib/heygen-routing";
import { launchCapacityPolicy, renderQueuePolicyForPackage } from "@/lib/queue-policy";
import { customerEmailForProduction, sendProductionCompletionEmail } from "@/lib/production-email";
import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function stripPostgresUnsafeText(value: string) {
  return value
    .replace(/\\u(?:0000|d[89ab][0-9a-f]{2}|d[c-f][0-9a-f]{2})/gi, "")
    .replace(/\\u(?![0-9a-f]{4})/gi, "")
    .replace(/\\+u0000/gi, "")
    .replace(/[\u0000\uD800-\uDFFF]/g, "");
}

function postgresSafe<T>(value: T): T {
  if (typeof value === "string") return stripPostgresUnsafeText(value) as T;
  if (Array.isArray(value)) return value.map((item) => postgresSafe(item)) as T;
  if (value && typeof value === "object") {
    const shallowCleaned = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, postgresSafe(item)]));
    try {
      return JSON.parse(stripPostgresUnsafeText(JSON.stringify(shallowCleaned))) as T;
    } catch {
      return shallowCleaned as T;
    }
  }
  return value;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return stripPostgresUnsafeText(error.message);
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map((value) => stripPostgresUnsafeText(value));
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

function firstUrlFromText(value: unknown) {
  const match = String(value ?? "").match(/https?:\/\/[^\s,]+/i);
  return match?.[0] ?? "";
}

function normalizeFingerprintValue(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function buildProductionRequestFingerprint(input: {
  productionType: string;
  packageId: string;
  title: string;
  prompt: string;
  quality: string;
  durationSeconds: number;
  outputCount: number;
  features: string;
  deliveryLevel: string;
}) {
  return [input.productionType, input.packageId, input.title, input.prompt, input.quality, String(input.durationSeconds || 0), String(input.outputCount || 0), input.features, input.deliveryLevel].map(normalizeFingerprintValue).join(" |");
}

function productionFingerprintForRow(row: Record<string, unknown>) {
  const requestMetadata = row.request_metadata && typeof row.request_metadata === "object" ? row.request_metadata as Record<string, unknown> : {};
  const inputJson = row.input_json && typeof row.input_json === "object" ? row.input_json as Record<string, unknown> : {};
  return normalizeFingerprintValue(requestMetadata.requestFingerprint ?? inputJson.requestFingerprint ?? buildProductionRequestFingerprint({
    productionType: String(row.production_type ?? ""),
    packageId: String(row.package_id ?? ""),
    title: String(row.title ?? ""),
    prompt: String(row.prompt ?? ""),
    quality: String(row.request_metadata && typeof row.request_metadata === "object" ? (row.request_metadata as Record<string, unknown>).quality ?? inputJson.quality ?? row.estimated_credits ?? "" : row.estimated_credits ?? ""),
    durationSeconds: Number(inputJson.outputDurationSeconds ?? requestMetadata.outputDurationSeconds ?? 0) || 0,
    outputCount: Number(inputJson.outputCount ?? requestMetadata.outputCount ?? 0) || 0,
    features: String(inputJson.features ?? requestMetadata.features ?? ""),
    deliveryLevel: String(inputJson.deliveryLevel ?? requestMetadata.deliveryLevel ?? "")
  }));
}

function appBaseUrl(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  const origin = request.headers.get("origin") || request.headers.get("x-forwarded-host");
  if (origin?.startsWith("http")) return origin.replace(/\/$/, "");
  if (origin) return `https://${origin.replace(/\/$/, "")}`;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function forwardAutomationHeaders(request: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const authorization = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");
  if (authorization) headers.Authorization = authorization;
  if (cookie) headers.Cookie = cookie;
  return headers;
}

function missingSchemaColumn(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const record = error as Record<string, unknown>;
  const code = String(record.code ?? "");
  const message = [record.message, record.details, record.hint].filter(Boolean).join(" ");
  if (code !== "PGRST204" && !/schema cache|Could not find/i.test(message)) return "";
  const singleQuoteMatch = message.match(/'([^']+)'\s+column/i);
  if (singleQuoteMatch?.[1]) return singleQuoteMatch[1];
  const doubleQuoteMatch = message.match(/column\s+"([^"]+)"/i);
  if (doubleQuoteMatch?.[1]) return doubleQuoteMatch[1];
  return "";
}

async function insertProductionRequestSchemaSafe(supabase: ReturnType<typeof supabaseAdmin>, payload: Record<string, unknown>) {
  const mutablePayload = postgresSafe({ ...payload });
  const removedColumns: string[] = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await supabase.from("production_requests").insert(mutablePayload).select("*").single();
    if (!result.error) return { data: result.data, removedColumns };
    const missingColumn = missingSchemaColumn(result.error);
    if (!missingColumn || !(missingColumn in mutablePayload)) throw result.error;
    delete mutablePayload[missingColumn];
    removedColumns.push(missingColumn);
  }
  throw new Error(`Could not create production request after removing unsupported columns: ${removedColumns.join(", ")}`);
}

function providerCategoryForAction(actionName: string, productionType: string) {
  if (/generate_image/i.test(actionName)) return "image";
  if (/lip_sync|voice|talking/i.test(actionName)) return "voice_video";
  if (/website|saas|mobile_app|admin_panel/i.test(actionName) || ["website", "saas", "mobile_app", "admin_project"].includes(productionType)) return "software_project";
  if (/document/i.test(actionName) || productionType === "document_pack") return "document";
  if (/video|campaign|animation/i.test(actionName) || ["video", "campaign", "music_video", "animation"].includes(productionType)) return "video";
  return "general";
}

function buildAgentProviderRoutePlan(agentAction: Record<string, unknown> | null, productionType: string, packageId: string) {
  const actionName = String(agentAction?.name ?? "create_production");
  const readiness = providerReadinessSummary(productionType, packageId);
  return {
    action: actionName,
    providerCategory: providerCategoryForAction(actionName, productionType),
    providerRoute: String(agentAction?.provider_route ?? "auto"),
    readinessStatus: readiness.status,
    canStartRealProvider: readiness.canStartRealProvider,
    blockingKeys: readiness.blocking.map((item) => item.key),
    optionalMissingKeys: readiness.optionalMissing.map((item) => item.key),
    nextStatusIfMissing: readiness.canStartRealProvider ? "provider_ready" : "waiting_provider_config",
    userMessage: readiness.userMessage
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const adminEmail = searchParams.get("admin_email") ?? request.headers.get("x-admin-email");

    const supabase = supabaseAdmin();
    let query = supabase
      .from("production_requests")
      .select("*")
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(100);

    if (adminEmail) {
      if (!isAdminRequest(request)) return adminRequiredResponse();
    } else {
      if (!userId) return Response.json({ error: "User session is required." }, { status: 401 });
      const verified = await requireVerifiedRequestUser(request, userId);
      if (!verified.ok) return verified.response;
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const uniqueProductions: Record<string, unknown>[] = [];
    const seenFingerprints = new Set<string>();
    for (const item of Array.isArray(data) ? data as Record<string, unknown>[] : []) {
      const requestMetadata = item.request_metadata && typeof item.request_metadata === "object" ? item.request_metadata as Record<string, unknown> : {};
      const inputJson = item.input_json && typeof item.input_json === "object" ? item.input_json as Record<string, unknown> : {};
      const fingerprint = normalizeFingerprintValue(requestMetadata.requestFingerprint ?? inputJson.requestFingerprint ?? buildProductionRequestFingerprint({
        productionType: String(item.production_type ?? ""),
        packageId: String(item.package_id ?? ""),
        title: String(item.title ?? ""),
        prompt: String(item.prompt ?? ""),
        quality: String(requestMetadata.quality ?? inputJson.quality ?? item.estimated_credits ?? ""),
        durationSeconds: Number(inputJson.outputDurationSeconds ?? requestMetadata.outputDurationSeconds ?? 0) || 0,
        outputCount: Number(inputJson.outputCount ?? requestMetadata.outputCount ?? 0) || 0,
        features: String(inputJson.features ?? requestMetadata.features ?? ""),
        deliveryLevel: String(inputJson.deliveryLevel ?? requestMetadata.deliveryLevel ?? "")
      }));
      if (seenFingerprints.has(fingerprint)) continue;
      seenFingerprints.add(fingerprint);
      uniqueProductions.push(item);
    }

    return Response.json({ productions: uniqueProductions });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load productions") }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const adminEmail = getAdminEmail(request, body);
    const id = String(body.id ?? "").trim();

    if (!isAdminRequest(request, body)) return adminRequiredResponse();
    if (!id) return Response.json({ error: "Production id is required." }, { status: 400 });

    const allowedStatuses = ["pending", "queued", "waiting_provider_config", "in_production", "ready", "failed", "cancelled"];
    const status = String(body.status ?? "").trim();
    const generationStatus = String(body.generation_status ?? "").trim();
    const automationStatus = String(body.automation_status ?? "").trim();
    const previewUrl = String(body.preview_url ?? "").trim();
    const deliveryLink = String(body.delivery_link ?? "").trim();
    const deliveryZipUrl = String(body.delivery_zip_url ?? "").trim();
    const sourceFilesUrl = String(body.source_files_url ?? "").trim();
    const readmeUrl = String(body.readme_url ?? "").trim();
    const providerStatus = String(body.provider_status ?? "").trim();
    const providerProgressRaw = body.provider_progress === "" || body.provider_progress === undefined || body.provider_progress === null ? null : Number(body.provider_progress);
    const providerProgress = Number.isFinite(providerProgressRaw) ? Math.max(0, Math.min(100, Number(providerProgressRaw))) : null;

    const { data: existing, error: existingError } = await supabaseAdmin()
      .from("production_requests")
      .select("status, automation_status, generation_status, approval_status, reserved_credits, estimated_credits, preview_url, delivery_link, delivery_zip_url, source_files_url, output_json")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    const existingOutput = existing?.output_json && typeof existing.output_json === "object" ? existing.output_json as Record<string, unknown> : {};

    const nextStatusForWorkflow = allowedStatuses.includes(status) ? status : existing?.status ?? undefined;
    const nextAutomationStatusForWorkflow = automationStatus || (status === "ready" ? "completed" : status === "in_production" ? "running" : existing?.automation_status ?? undefined);
    const nextGenerationStatusForWorkflow = generationStatus || (providerStatus ? providerStatus : existing?.generation_status ?? "operations_update");
    const nextPreviewUrlForWorkflow = previewUrl || existing?.preview_url || null;
    const nextDeliveryLinkForWorkflow = deliveryLink || deliveryZipUrl || previewUrl || existing?.delivery_link || null;
    const nextDeliveryZipForWorkflow = deliveryZipUrl || deliveryLink || existing?.delivery_zip_url || null;
    const nextSourceFilesForWorkflow = sourceFilesUrl || existing?.source_files_url || null;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      generation_status: nextGenerationStatusForWorkflow,
      preview_url: nextPreviewUrlForWorkflow,
      delivery_link: nextDeliveryLinkForWorkflow,
      delivery_zip_url: nextDeliveryZipForWorkflow,
      source_files_url: nextSourceFilesForWorkflow,
      readme_url: readmeUrl || null,
      admin_notes: String(body.admin_notes ?? "").trim() || null,
      output_json: {
        ...existingOutput,
        updatedBy: adminEmail,
        updatedAt: new Date().toISOString(),
        automationStatus: nextAutomationStatusForWorkflow,
        deliveryReady: nextStatusForWorkflow === "ready" || Boolean(nextDeliveryLinkForWorkflow || nextDeliveryZipForWorkflow),
        previewUrl,
        preview_url: previewUrl,
        deliveryUrl: deliveryLink || deliveryZipUrl,
        delivery_url: deliveryLink || deliveryZipUrl,
        deliveryZipUrl,
        delivery_zip_url: deliveryZipUrl,
        sourceFilesUrl,
        source_files_url: sourceFilesUrl,
        readmeUrl,
        readme_url: readmeUrl,
        providerStatus: providerStatus || existingOutput.providerStatus,
        providerProgress: providerProgress ?? existingOutput.providerProgress,
        currentStep: providerStatus || existingOutput.currentStep || generationStatus || status || "operations_update",
        workflowState: buildProductionWorkflowState({
          ...existing,
          status: nextStatusForWorkflow,
          automation_status: nextAutomationStatusForWorkflow,
          generation_status: nextGenerationStatusForWorkflow,
          preview_url: nextPreviewUrlForWorkflow,
          delivery_link: nextDeliveryLinkForWorkflow,
          delivery_zip_url: nextDeliveryZipForWorkflow,
          source_files_url: nextSourceFilesForWorkflow,
          output_json: existingOutput
        })
      }
    };
    Object.keys(updatePayload).forEach((key) => updatePayload[key] === undefined ? delete updatePayload[key] : undefined);

    if (allowedStatuses.includes(status)) updatePayload.status = status;

    const { data, error } = await supabaseAdmin()
      .from("production_requests")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    let completionEmailResult: unknown = null;
    if (data?.status === "ready") {
      completionEmailResult = { skipped: true, reason: "Production update did not return a user id." };
      try {
        if (data.user_id) {
          const customerEmail = await customerEmailForProduction(String(data.user_id));
          completionEmailResult = await sendProductionCompletionEmail({
            to: customerEmail,
            title: String(data.title ?? data.id ?? "Production"),
            productionId: String(data.id),
            deliveryUrl: data.delivery_link ?? data.delivery_zip_url ?? data.preview_url ?? null,
            previewUrl: data.preview_url ?? null,
            sourceFilesUrl: data.source_files_url ?? null,
            readmeUrl: data.readme_url ?? null
          });
        }
      } catch (emailError) {
        completionEmailResult = { skipped: true, reason: errorMessage(emailError, "Could not send production completion email") };
      }
    }

    if (data?.id && completionEmailResult) {
      await supabaseAdmin()
        .from("production_requests")
        .update({ output_json: { ...(data.output_json ?? {}), completionEmailResult } })
        .eq("id", data.id);
    }

    return Response.json({ production: data && completionEmailResult ? { ...data, output_json: { ...(data.output_json ?? {}), completionEmailResult } } : data, completionEmailResult });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not update production request") }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const adminEmail = getAdminEmail(request, body);
    const id = String(body.id ?? body.production_id ?? "").trim();

    if (!isAdminRequest(request, body)) return adminRequiredResponse();
    if (!id) return Response.json({ error: "Production id is required." }, { status: 400 });

    const { data: existing, error: existingError } = await supabaseAdmin()
      .from("production_requests")
      .select("output_json")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    const existingOutput = existing?.output_json && typeof existing.output_json === "object" ? existing.output_json as Record<string, unknown> : {};

    const { data, error } = await supabaseAdmin()
      .from("production_requests")
      .update({
        status: "deleted",
        automation_status: "deleted_by_admin",
        generation_status: "deleted_by_admin",
        updated_at: new Date().toISOString(),
        output_json: { ...existingOutput, adminDeleted: true, deletedAt: new Date().toISOString(), deletedBy: adminEmail }
      })
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw error;
    return Response.json({ deleted: true, production_id: data.id });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Production could not be deleted") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = rateLimit({ key: `production:create:${ip}`, limit: 20, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body = await request.json();
  const userId = String(body.user_id ?? "").trim();
  const title = String(body.title ?? "").trim();
  const prompt = String(body.prompt ?? "").trim();
  let productionType = String(body.production_type ?? "").trim();
  let packageId = String(body.package_id ?? "").trim();
  const initialRequestMetadata = body.request_metadata && typeof body.request_metadata === "object" ? body.request_metadata as Record<string, unknown> : {};
  const initialInputJson = body.input_json && typeof body.input_json === "object" ? body.input_json as Record<string, unknown> : {};
  const serverRouteText = `${productionType} ${packageId} ${title} ${prompt} ${String(body.features ?? "")} ${JSON.stringify(initialRequestMetadata)} ${JSON.stringify(initialInputJson)}`.toLowerCase();
  const isImageProductionRequest = ["image", "brand_kit", "visual_clone", "virtual_model_studio"].includes(productionType) || /^image_/.test(packageId);
  const directLuxuryProductCommercialRoute = String(initialRequestMetadata.routeLock ?? initialInputJson.routeLock ?? "") === "minimax_direct_luxury_product_commercial" || /perfume|fragrance|matte-black|matte\s*black|luxury\s+commercial|premium\s+commercial|retail\s+counter|marble\s+wall|perfume\s+bottle/i.test(serverRouteText);
  const sanitizedServerRouteText = sanitizeProviderRouteSignal(serverRouteText);
  const serverNoPeopleMotionIntent = /no\s+human\s+presenter|do\s+not\s+use\s+any\s+human|no\s*people|no\s*presenter|avatars?|insan\s*olmasın/.test(sanitizedServerRouteText)
    && /motion\s*graphics|kinetic\s*typography|animated\s*text|text\s*cards|dynamic\s*promotional/.test(sanitizedServerRouteText);
  const serverCinematicActionIntent = hasCinematicActionIntent(serverRouteText);
  const serverMinimaxPresenterIntent = !directLuxuryProductCommercialRoute && !isImageProductionRequest && !serverNoPeopleMotionIntent && !serverCinematicActionIntent && hasMinimaxPresenterIntent(`${serverRouteText} ${String(initialRequestMetadata.preferredProvider ?? initialInputJson.preferredProvider ?? "").toLowerCase()} ${Boolean(initialRequestMetadata.presenterMode ?? initialInputJson.presenterMode)} ${String(initialRequestMetadata.creativePreset ?? initialInputJson.creativePreset ?? "").toLowerCase()}`);


  if (["talking_video_basic", "talking_video_multi_person", "talking_video_regional_culture"].includes(productionType)) productionType = "talking_video";
  if (directLuxuryProductCommercialRoute) {
    productionType = "video";
    packageId = "video_premium";
  } else if (serverMinimaxPresenterIntent && ["video", "cinematic_video"].includes(productionType)) {
    productionType = "talking_video";
  }

  const needsImages = Boolean(body.needs_images);
  const revisionBuffer = Boolean(body.revision_buffer);
  const requestedOutputCount = Number(body.output_count ?? body.requested_clip_count ?? body.requested_alternative_count ?? 1);
  const outputCount = [1, 3, 5, 10].includes(requestedOutputCount) ? requestedOutputCount : 1;
  let selectedPackage = getProductionPackage(packageId);

  if (!userId) return Response.json({ error: "User session is required." }, { status: 401 });
  const routeBudget = enforceRouteBudget(request, { route: "production:create", userId, ipLimit: 20, userLimit: 10, windowMs: 15 * 60 * 1000 });
  if (!routeBudget.ok) return routeBudget.response;
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;
  if (!title || !prompt || !productionType || !packageId) {
    return Response.json({ error: "Production type, package, title and prompt are required." }, { status: 400 });
  }
  const suspicious = rejectSuspiciousText([title, prompt, body.project_details, body.features, body.material_links, body.song_audio_link, body.music_reference_links, body.voiceover_reference_link]);
  if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });
  if (!Boolean(body.legal_acceptance)) {
    return Response.json({ error: "You must accept the copyright, brand, face, voice and content responsibility agreement before starting production." }, { status: 400 });
  }

  const safety = validateProductionSafety([
    title,
    prompt,
    body.project_details,
    body.features,
    body.material_links,
    body.song_audio_link,
    body.music_reference_links,
    body.voiceover_reference_link
  ]);
  if (!safety.ok) {
    return Response.json({ error: safety.message }, { status: 400 });
  }

  const uploadedMaterialsSource: unknown[] = Array.isArray(body.uploaded_materials) ? body.uploaded_materials : [];
  const uploadedMaterials = uploadedMaterialsSource
    .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item: Record<string, unknown>) => ({
      type: "user_upload",
      reference_type: String(item.reference_type ?? "user_material"),
      title: String(item.title ?? "Uploaded material"),
      file_url: String(item.file_url ?? ""),
      storage_bucket: String(item.storage_bucket ?? ""),
      storage_path: String(item.storage_path ?? ""),
      content_type: String(item.content_type ?? ""),
      size_bytes: Number(item.size_bytes ?? 0) || 0,
      kind: String(item.kind ?? "file"),
      rights_confirmed: Boolean(item.rights_confirmed ?? body.legal_acceptance),
      usage_tags: Array.isArray(item.usage_tags) ? item.usage_tags.map(String) : ["user-upload"]
    }))
    .filter((item) => item.file_url.length > 0);
  const musicVideoMaterialGroups = Boolean(body.music_video_material_groups) && typeof body.music_video_material_groups === "object"
    ? body.music_video_material_groups as Record<string, unknown>
    : {};
  const dramaDetails = Boolean(body.drama_details) && typeof body.drama_details === "object"
    ? body.drama_details as Record<string, unknown>
    : {};
  const droneDetails = Boolean(body.drone_details) && typeof body.drone_details === "object"
    ? body.drone_details as Record<string, unknown>
    : {};
  const liveSalesAgentDetails = Boolean(body.live_sales_agent_details) && typeof body.live_sales_agent_details === "object"
    ? body.live_sales_agent_details as Record<string, unknown>
    : {};
  const userReferenceMaterials = [
    { type: "user_material_links", label: "User material links", value: String(body.material_links ?? "").trim() },
    { type: "user_song_audio", label: "User song/audio link", value: String(body.song_audio_link ?? "").trim() },
    { type: "user_music_reference", label: "User music reference links", value: String(body.music_reference_links ?? "").trim() },
    { type: "user_voiceover_reference", label: "User voice-over reference", value: String(body.voiceover_reference_link ?? "").trim() }
  ].filter((item) => item.value.length > 0).map((item) => ({
    type: "user_reference",
    reference_type: item.type,
    title: item.label,
    file_url: item.value,
    rights_confirmed: Boolean(body.legal_acceptance),
    usage_tags: ["user-provided", "rights-confirmed"]
  }));

  const legalSnapshot = legalAcceptanceSnapshot({ productionType, packageId, title, userEmail: String(body.user_email ?? "") });
  const selectedMaterialIds = Array.isArray(body.selected_material_ids) ? body.selected_material_ids.map(String) : [];
  const selectedMaterials = platformMaterialsByIds(selectedMaterialIds);
  if (selectedMaterials.length !== selectedMaterialIds.length) {
    return Response.json({ error: "Only active materials provided by Crelavo can be selected." }, { status: 400 });
  }
  const materials = [
    ...selectedMaterials.map((material) => ({
      type: "platform_material",
      id: material.id,
      title: material.title,
      category: material.category,
      file_url: material.fileUrl,
      preview_url: material.previewUrl,
      usage_tags: material.usageTags
    })),
    ...uploadedMaterials,
    ...userReferenceMaterials
  ];
  const materialBytes = materials.reduce((total, material) => total + (Number("size_bytes" in material ? material.size_bytes : 0) || 0), 0);
  const incomingQuality = String(body.quality ?? body.selected_quality ?? "").trim();
  const safeProductionQuality = /480p|720p|draft|quick\s*test|fast\s*draft|low[-_\s]?cost/i.test(incomingQuality) ? "1080p" : incomingQuality || "1080p";
  const providerTestMode = false;
  const deliveryLevel = String(body.delivery_level ?? "").trim() || (String(body.features ?? "").toLowerCase().includes("working source") ? "working_source_package" : "production_package");
  const deliveryRequirements = body.delivery_requirements && typeof body.delivery_requirements === "object" ? body.delivery_requirements : {
    requested: false,
    status: "pending",
    formats: ["dashboard_delivery"]
  };
  const { data: deliveryRateRow } = await supabaseAdmin()
    .from("platform_configs")
    .select("value")
    .eq("key", "delivery_credit_rates")
    .maybeSingle();
  const { data: packageConfigRow } = await supabaseAdmin()
    .from("platform_configs")
    .select("value")
    .eq("key", PACKAGE_CONFIG_KEY)
    .maybeSingle();
  const deliveryCreditRates = normalizeDeliveryCreditRates(deliveryRateRow?.value);
  const packageConfig = normalizePackageConfig(packageConfigRow?.value);
  const configuredProductionPackage = findConfiguredProductionPackage(packageConfig, packageId);
  if (packageConfigRow?.value && !configuredProductionPackage) return Response.json({ error: "Selected package is not active in admin package config." }, { status: 400 });
  selectedPackage = configuredProductionPackage ?? selectedPackage;
  if (!selectedPackage) return Response.json({ error: "Selected package was not found." }, { status: 400 });
  const costEstimate = estimateProductionCost(packageId, {
    needsImages,
    revisionBuffer,
    outputCount,
    quality: safeProductionQuality,
    durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
    features: String(body.features ?? ""),
    productionType,
    materialCount: materials.length,
    materialBytes,
    deliveryRequirements,
    deliveryCreditRates,
    packageCatalog: packageConfig.productionPackages
  });
  const singleOutputCredits = costEstimate.singleOutputCredits;
  const estimatedCredits = costEstimate.minimumSafeCredits;
  const profitEstimate = estimateProductionProfit({
    packageId,
    productionType,
    reservedCredits: estimatedCredits,
    outputCount,
    durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
    quality: safeProductionQuality,
    features: String(body.features ?? ""),
    materialCount: materials.length,
    materialBytes,
    providerTestMode
  });
  const automationJobId = createAutomationJobId();
  const workflowMode = String(body.workflow_mode ?? "").trim() || "general";
  const isProductAdVideo = packageId === "campaign_product_ad_video";
  const pipeline = isProductAdVideo ? ecommerceAdPipeline() : null;
  const automationSteps = isProductAdVideo ? ecommerceAdAutomationSteps() : initialAutomationSteps();
  const directProductUrl = String(body.product_url ?? body.productUrl ?? body.product_link ?? body.productLink ?? body.reference_url ?? body.referenceUrl ?? "").trim();
  const productUrl = directProductUrl || firstUrlFromText(body.material_links) || firstUrlFromText(body.prompt) || "";
  const ecommerceContext = isProductAdVideo ? {
    productUrl,
    campaignGoal: body.campaign_goal ?? "Sales conversion",
    channels: body.campaign_channels ?? "TikTok, Instagram Reels, Meta Ads",
    publishingPlan: body.publishing_plan ?? "Preview first, then one-click export",
    abTestFocus: body.ab_test_focus ?? "Hook, CTA, subtitle style and first 3 seconds",
    adFormula: "Hook + Problem + Solution + Proof + Offer + CTA",
    targetDurationSeconds: Number(body.output_duration_seconds ?? 30) || 30,
    voiceDirection: body.voice_direction ?? "Energetic, trustworthy social ad voice",
    subtitleStyle: body.subtitle_style ?? "Animated social captions",
    revisionActions: ["Change subtitle color", "Switch to male voice", "Switch to female voice", "Change CTA", "Regenerate hook"],
    exportTargets: ["TikTok", "Instagram Reels", "Facebook/Meta Ads", "YouTube Shorts", "LinkedIn", "X/Twitter", "Shopify", "Amazon", "Trendyol", "WooCommerce"],
    providerPipeline: pipeline
  } : null;
  const deliveryPackage = deliveryPackageForProduction({
    productionType,
    packageId,
    features: String(body.features ?? ""),
    storePlatform: String(body.store_platform ?? ""),
    sourceDelivery: String(body.source_delivery ?? "")
  });
  const productionQuality = qualityProfileForProduction(productionType, packageId);
  const referenceLinkSafety = "Shared links, competitor websites, product pages, marketplace listings and reference designs are used only for analysis, brief extraction, structure understanding and inspiration. Crelavo does not reproduce or clone third-party websites, stores, applications, layouts, text, branding, UI, code, product pages or creative assets one-to-one. Final outputs must be original, adapted to the user's own brand, content and declared production scope.";
  const publishTargets = Array.isArray(body.publish_targets) ? body.publish_targets.map(String) : [];
  const renderQueuePolicy = renderQueuePolicyForPackage(packageId);
  const capacityPolicy = launchCapacityPolicy();
  const deliveryTargets = {
    publishTargets: publishTargets.length > 0 ? publishTargets : ["dashboard_delivery"],
    connectedAccountTargets: String(body.connected_account_targets ?? "").trim(),
    connectedStoreTargets: String(body.connected_store_targets ?? "").trim(),
    adminInProductionLoop: false,
    userCanPublishAfterReady: true
  };
const agentAction = body.agent_action && typeof body.agent_action === "object"
  ? body.agent_action as Record<string, unknown>
  : null;
const agentProviderRoutePlan = buildAgentProviderRoutePlan(agentAction, productionType, packageId);
const effectiveAgentProviderRoutePlan = directLuxuryProductCommercialRoute ? {
  ...agentProviderRoutePlan,
  providerCategory: "video",
  providerRoute: "minimax",
  readinessStatus: "ready",
  canStartRealProvider: true,
  blockingKeys: [],
  optionalMissingKeys: [],
  nextStatusIfMissing: "provider_ready",
  userMessage: "Luxury product commercial route is forced to the video pipeline."
} : agentProviderRoutePlan;
const dedicatedProviderBlocked = ["talking_video", "avatar", "lip_sync", "live_sales_agent"].includes(productionType) && !serverMinimaxPresenterIntent && !effectiveAgentProviderRoutePlan.canStartRealProvider;
const reserveCredits = dedicatedProviderBlocked ? 0 : estimatedCredits;

const costGuardConfig = apiCostGuardConfig();
  const clientRequestMetadata = body.request_metadata && typeof body.request_metadata === "object" ? body.request_metadata as Record<string, unknown> : {};
  const clientInputJson = body.input_json && typeof body.input_json === "object" ? body.input_json as Record<string, unknown> : {};
  const clientOutputIntent = clientRequestMetadata.outputIntent && typeof clientRequestMetadata.outputIntent === "object" ? clientRequestMetadata.outputIntent as Record<string, unknown> : clientInputJson.outputIntent && typeof clientInputJson.outputIntent === "object" ? clientInputJson.outputIntent as Record<string, unknown> : {};
  const clientSourceHandling = clientRequestMetadata.sourceHandling && typeof clientRequestMetadata.sourceHandling === "object" ? clientRequestMetadata.sourceHandling as Record<string, unknown> : clientInputJson.sourceHandling && typeof clientInputJson.sourceHandling === "object" ? clientInputJson.sourceHandling as Record<string, unknown> : {};
  const outputPlan = {
    ...clientOutputIntent,
    outputCount,
    durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
    aspectRatio: String(body.aspect_ratio ?? body.aspectRatio ?? ""),
    quality: safeProductionQuality,
    singleOutputCredits,
    totalReservedCredits: estimatedCredits,
    packageCredits: costEstimate.packageCredits,
    providerRiskLevel: costEstimate.providerRiskLevel,
    costNotes: costEstimate.costNotes,
    profitEstimate,
    costGuard: {
      singleProductionCreditLimit: costGuardConfig.singleProductionCreditLimit,
      dailyProductionCreditLimit: costGuardConfig.dailyProductionCreditLimit,
      dailyProductionCountLimit: costGuardConfig.dailyProductionCountLimit
    },
    requestedClipCount: Number(body.requested_clip_count ?? 0) || 0,
    requestedAlternativeCount: Number(body.requested_alternative_count ?? 0) || 0,
    uniqueOutputsRequired: outputCount > 1,
    duplicatePolicy: Number(body.requested_clip_count ?? 0) > 0
      ? "Each clip must come from a different source moment/timestamp. Do not duplicate the same clip with minor edits."
      : outputCount > 1
        ? "Each alternative must use a distinct hook, visual angle or scene structure. Do not repeat the same output."
        : "Single best output",
    timestampPolicy: Number(body.requested_clip_count ?? 0) > 0 ? "different_source_timestamps_required" : "not_applicable",
    variationStrategy: outputCount === 1 ? "single_best_output" : Number(body.requested_clip_count ?? 0) > 0 ? "unique_source_moment_clips" : "multi_variant_hooks_styles_scenes"
  };

  const socialWorkflow = {
    platforms: String(body.social_platforms ?? "").trim(),
    publishType: String(body.social_publish_type ?? "").trim(),
    captionPlan: String(body.social_caption_plan ?? "").trim(),
    connectedAccountTargets: String(body.connected_account_targets ?? "").trim()
  };

  const commerceWorkflow = {
    storePlatform: String(body.store_platform ?? "").trim(),
    storeAssetGoal: String(body.store_asset_goal ?? "").trim(),
    productPageNotes: String(body.product_page_notes ?? "").trim(),
    connectedStoreTargets: String(body.connected_store_targets ?? "").trim()
  };

  const projectWorkflow = {
    modules: String(body.project_modules ?? "").trim(),
    technicalStack: String(body.technical_stack ?? "").trim(),
    sourceDelivery: String(body.source_delivery ?? "").trim(),
    deliveryLevel
  };

  const characterVoiceConsistencyPlan = body.character_voice_consistency_plan && typeof body.character_voice_consistency_plan === "object"
    ? body.character_voice_consistency_plan as Record<string, unknown>
    : body.characterVoiceConsistencyPlan && typeof body.characterVoiceConsistencyPlan === "object"
      ? body.characterVoiceConsistencyPlan as Record<string, unknown>
      : null;

  const manualOptionSummary = {
    provider: String(body.provider_service ?? body.service_network ?? "Auto provider").trim() || "Auto provider",
    quality: safeProductionQuality.trim(),
    durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
    aspectRatio: String(body.aspect_ratio ?? body.aspectRatio ?? "").trim(),
    voiceProfile: String(body.voice_profile ?? "").trim(),
    voiceLanguage: String(body.voice_language ?? "").trim(),
    musicProfile: String(body.music_profile ?? "").trim(),
    environmentProfile: String(body.environment_profile ?? "").trim(),
    deliveryHandoff: String(body.delivery_handoff ?? "").trim(),
    selectedFeatures: String(body.features ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 40),
    selectedPlatforms: String(body.target_platform ?? body.social_platforms ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20)
  };

  const isPreviewOnlyProduction = body.preview_only === true || body.previewOnly === true || String(body.access_mode ?? "").toLowerCase() === "preview";
  const previewAccess = {
    previewOnly: isPreviewOnlyProduction,
    downloadAccess: isPreviewOnlyProduction ? "closed" : "open",
    previewVideoSeconds: isPreviewOnlyProduction ? 10 : null,
    watermarkRequired: isPreviewOnlyProduction,
    note: isPreviewOnlyProduction ? "24-hour preview access: downloads closed until the selected subscription starts." : "Full delivery access follows payment, credit and package eligibility."
  };

    const requestMetadata = {
      ...clientRequestMetadata,
      requestFingerprint: buildProductionRequestFingerprint({
        productionType,
        packageId,
        title,
        prompt,
        quality: safeProductionQuality,
        durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
        outputCount,
        features: String(body.features ?? ""),
        deliveryLevel
      }),
      productionType,
      packageId,
      packageName: selectedPackage.name,
      workflowMode,
      deliveryLevel,
    style: body.style ?? "",
    quality: safeProductionQuality,
    targetPlatform: body.target_platform ?? "",
    features: body.features ?? "",
    serviceNetwork: body.service_network ?? "",
    selectedProviderService: body.provider_service ?? "",
    voiceProfile: body.voice_profile ?? "",
    voiceLanguage: body.voice_language ?? "",
    voiceoverGuard: "tts_length_limited_direction_sanitized",
    musicProfile: body.music_profile ?? "",
    environmentProfile: body.environment_profile ?? "",
    deliveryHandoff: body.delivery_handoff ?? "",
    outputDurationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
    aspectRatio: String(body.aspect_ratio ?? body.aspectRatio ?? ""),
    projectDetails: body.project_details ?? "",
    ecommerceContext,
    socialWorkflow,
    commerceWorkflow,
    projectWorkflow,
    manualOptionSummary,
    characterVoiceConsistencyPlan,
    musicVideoMaterialGroups,
    dramaDetails,
    droneDetails,
    liveSalesAgentDetails,
    audienceContext: {
      targetCountry: body.target_country ?? "",
      targetCity: body.target_city ?? "",
      environmentPreset: body.environment_preset ?? "",
      environment: body.target_environment ?? "",
      culture: body.cultural_context ?? "",
      beliefContext: body.belief_context ?? ""
    },
    materialCount: materials.length,
    materialBytes,
outputPlan,
    outputIntent: outputPlan,
    sourceHandling: clientSourceHandling,
    agentAction,
    agentProviderRoutePlan,
    deliveryTargets,
    deliveryPackage,
    deliveryRequirements,
    previewAccess,
    productionQuality,
    referenceLinkSafety,
    renderQueuePolicy,
    capacityPolicy,
    automationMode: "fully_automatic",
    providerTestMode,
    preferredProvider: serverMinimaxPresenterIntent ? "minimax" : clientRequestMetadata.preferredProvider ?? clientInputJson.preferredProvider ?? undefined,
    provider_route: serverMinimaxPresenterIntent ? "minimax" : clientRequestMetadata.provider_route ?? clientInputJson.provider_route ?? undefined,
    presenterMode: serverMinimaxPresenterIntent || Boolean(clientRequestMetadata.presenterMode ?? clientInputJson.presenterMode),
    providerTestTarget: providerTestMode ? "premium_10s_1080p_single_output" : null
  };
    const inputJson = {
      ...clientInputJson,
      requestFingerprint: buildProductionRequestFingerprint({
        productionType,
        packageId,
        title,
        prompt,
        quality: safeProductionQuality,
        durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
        outputCount,
        features: String(body.features ?? ""),
        deliveryLevel
      }),
      packageName: selectedPackage.name,
    packageDescription: selectedPackage.description,
    deliverables: selectedPackage.deliverables,
    needsImages,
    revisionBuffer,
    projectDetails: body.project_details ?? "",
    targetPlatform: body.target_platform ?? "",
    style: body.style ?? "",
    quality: safeProductionQuality,
    features: body.features ?? "",
    serviceNetwork: body.service_network ?? "",
    selectedProviderService: body.provider_service ?? "",
    voiceProfile: body.voice_profile ?? "",
    voiceLanguage: body.voice_language ?? "",
    voiceoverGuard: "tts_length_limited_direction_sanitized",
    musicProfile: body.music_profile ?? "",
    environmentProfile: body.environment_profile ?? "",
    deliveryHandoff: body.delivery_handoff ?? "",
    outputDurationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
    aspectRatio: String(body.aspect_ratio ?? body.aspectRatio ?? ""),
    adminPanel: body.admin_panel ?? false,
    workflowMode,
    ecommerceContext,
    socialWorkflow,
    commerceWorkflow,
    projectWorkflow,
    manualOptionSummary,
    characterVoiceConsistencyPlan,
    musicVideoMaterialGroups,
    dramaDetails,
    droneDetails,
    liveSalesAgentDetails,
    automationMode: "fully_automatic",
    providerTestMode,
    preferredProvider: serverMinimaxPresenterIntent ? "minimax" : clientInputJson.preferredProvider ?? clientRequestMetadata.preferredProvider ?? undefined,
    presenterMode: serverMinimaxPresenterIntent || Boolean(clientInputJson.presenterMode ?? clientRequestMetadata.presenterMode),
    providerTestTarget: providerTestMode ? "premium_10s_1080p_single_output" : null,
    automationPipeline: pipeline,
    outputPlan,
    outputIntent: outputPlan,
    sourceHandling: clientSourceHandling,
    deliveryTargets,
    deliveryPackage,
    deliveryRequirements,
    previewAccess,
    productionQuality,
    referenceLinkSafety,
    renderQueuePolicy,
    capacityPolicy,
    deliveryStandard: "Ready-to-use outputs are prepared and delivered through the customer dashboard. Social posts, ad copy, videos, files or source packages should be usable without admin production work; manual export is available now, while direct connected publishing to accounts/stores remains post-launch/API dependent.",
    customerCanSee: ["request brief", "submitted materials", "automation status", "generated outputs", "final delivery link", "revision buttons", "multi-platform social and store export actions"]
  };


  try {
    const supabase = supabaseAdmin();
    const providerProofStartAllowed = serverMinimaxPresenterIntent && reserveCredits > 0;
    const dailyBudget = await enforceDailyProductionBudget(supabase, { userId, estimatedCredits: reserveCredits, allowProviderProofTest: providerProofStartAllowed });
    if (!dailyBudget.ok) return dailyBudget.response;

    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError || !authUser.user) {
      return Response.json({ error: "User could not be verified. Please sign in again." }, { status: 401 });
    }
    if (!authUser.user.email_confirmed_at && !authUser.user.confirmed_at) {
      return Response.json({ error: "Production cannot start before email confirmation. Please open the confirmation link sent to your inbox." }, { status: 403 });
    }

    const { data: recentProductions, error: recentProductionsError } = await supabase
      .from("production_requests")
      .select("id,status,automation_status,generation_status,created_at,production_type,package_id,title,prompt,request_metadata,input_json,estimated_credits")
      .eq("user_id", userId)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(20);
    if (recentProductionsError) throw recentProductionsError;
    const requestFingerprint = buildProductionRequestFingerprint({
      productionType,
      packageId,
      title,
      prompt,
      quality: safeProductionQuality,
      durationSeconds: Number(body.output_duration_seconds ?? 0) || 0,
      outputCount,
      features: String(body.features ?? ""),
      deliveryLevel
    });
    const matchingProduction = Array.isArray(recentProductions)
      ? recentProductions.find((row) => {
          const rowRecord = row as Record<string, unknown>;
          const rowStatus = String(rowRecord.status ?? "").toLowerCase();
          if (["deleted", "failed", "cancelled"].includes(rowStatus)) return false;
          return productionFingerprintForRow(rowRecord) === normalizeFingerprintValue(requestFingerprint);
        }) as Record<string, unknown> | undefined
      : undefined;
    if (matchingProduction) {
      return Response.json({
        production: matchingProduction,
        automation_job_id: String((matchingProduction.output_json as Record<string, unknown> | undefined)?.jobId ?? "") || null,
        automation_status: String(matchingProduction.automation_status ?? matchingProduction.generation_status ?? matchingProduction.status ?? "queued"),
        provider_start_requested: false,
        duplicate_request_reused: true
      });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email: String(body.user_email ?? ""), full_name: String(authUser.user.user_metadata?.full_name ?? "") || null, role: "user" }, { onConflict: "id" });

    if (profileError) throw profileError;

    const { data: balanceRow, error: balanceError } = await supabase
      .from("credit_balances")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();

    if (balanceError) throw balanceError;

    const balance = balanceRow?.balance ?? 0;
    const reserved = balanceRow?.reserved ?? 0;
    const available = balance - reserved;

    if (reserveCredits > 0 && available < reserveCredits) {
      return Response.json({
        error: `Not enough credits. Required: ${reserveCredits}, available: ${available}.`,
        required: reserveCredits,
        requiredCredits: reserveCredits,
        available,
        shortfall: Math.max(0, reserveCredits - available),
        redirect: "/dashboard/credits"
      }, { status: 402 });
    }

    if (reserveCredits > 0) {
      const { error: reserveError } = await supabase
        .from("credit_balances")
        .upsert({ user_id: userId, balance, reserved: reserved + reserveCredits, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

      if (reserveError) throw reserveError;

      const { error: reserveEventError } = await supabase
        .from("credit_events")
        .insert({ user_id: userId, type: "reserve", amount: reserveCredits, note: `Reserved for ${selectedPackage.name}: ${title}` });

      if (reserveEventError) throw reserveEventError;
    }

    const initialOutputJson = {
      automationMode: "fully_automatic",
      automationStatus: "queued",
      automationSteps,
      agentAction,
      agentProviderRoutePlan,
      providerReadiness: {
        status: effectiveAgentProviderRoutePlan.readinessStatus,
        canStartRealProvider: effectiveAgentProviderRoutePlan.canStartRealProvider,
        blockingKeys: effectiveAgentProviderRoutePlan.blockingKeys,
        optionalMissingKeys: effectiveAgentProviderRoutePlan.optionalMissingKeys,
        userMessage: effectiveAgentProviderRoutePlan.userMessage
      },
      jobId: automationJobId,
      currentStep: isProductAdVideo ? "Product ad video queued" : "Request queued",
      steps: automationSteps,
      pipelineType: isProductAdVideo ? "ecommerce_product_ad_video" : "general_production",
      providerPipeline: pipeline,
      expectedDeliverySeconds: isProductAdVideo ? "45-60" : null,
      deliveryPackage,
      workflowState: buildProductionWorkflowState({
        status: "queued",
        generation_status: dedicatedProviderBlocked ? "waiting_provider_config" : "automation_queued",
        reserved_credits: reserveCredits,
        estimated_credits: estimatedCredits,
        output_json: {
          providerReadiness: {
            status: effectiveAgentProviderRoutePlan.readinessStatus,
            canStartRealProvider: effectiveAgentProviderRoutePlan.canStartRealProvider,
            blockingKeys: effectiveAgentProviderRoutePlan.blockingKeys,
            optionalMissingKeys: effectiveAgentProviderRoutePlan.optionalMissingKeys,
            userMessage: effectiveAgentProviderRoutePlan.userMessage
          }
        },
        request_metadata: requestMetadata
      })
    };

    const productionInsertPayload = {
      user_id: userId,
      production_type: productionType,
      package_id: packageId,
      title,
      prompt,
      status: "queued",
      generation_status: dedicatedProviderBlocked ? "waiting_provider_config" : "automation_queued",
      request_metadata: { ...requestMetadata, materials, inputJson, requestFingerprint },
      input_json: inputJson,
      materials_json: materials,
      estimated_credits: estimatedCredits,
      reserved_credits: reserveCredits,
      output_json: { ...initialOutputJson, automationStatus: dedicatedProviderBlocked ? "waiting_provider_config_no_charge" : "queued", providerStatus: dedicatedProviderBlocked ? "waiting_provider_config_no_charge" : undefined, requestMetadata: { ...requestMetadata, materials, inputJson }, materials, inputJson, legalAcceptanceSnapshot: legalSnapshot },
      admin_notes: dedicatedProviderBlocked ? "Talking/lip-sync provider is not configured. Production record created with no credit reserve; connect provider before real start." : "Automatic production queued. Admin monitors payments, failed jobs, support emails and unusual requests only."
    };

    const { data, removedColumns } = await insertProductionRequestSchemaSafe(supabase, productionInsertPayload);
    if (!data) throw new Error("Production request could not be created.");

    const { data: legalAcceptance, error: legalError } = await supabase
      .from("legal_acceptances")
      .insert({
        user_id: userId,
        production_id: data.id,
        acceptance_type: "production_liability",
        version: LEGAL_ACCEPTANCE_VERSION,
        accepted: true,
        ip_address: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null,
        user_agent: request.headers.get("user-agent") ?? null,
        production_type: productionType,
        package_id: packageId,
        title,
        responsibility_text: productionResponsibilityText,
        rights_warranty_text: rightsWarrantyText,
        metadata: legalSnapshot
      })
      .select("id")
      .single();

    const legalTableMissing = legalError && String((legalError as unknown as Record<string, unknown>).code ?? "") === "PGRST205";
    if (legalError && !legalTableMissing) throw legalError;

    const productionWithLegal = {
      ...data,
      input_json: inputJson,
      materials_json: materials,
      legal_acceptance_id: legalAcceptance?.id ?? null,
      legal_acceptance_snapshot: legalSnapshot,
      output_json: {
        ...(data.output_json && typeof data.output_json === "object" ? data.output_json as Record<string, unknown> : {}),
        legalAcceptanceId: legalAcceptance?.id ?? null,
        legalAcceptanceSnapshot: legalSnapshot,
        schemaAdaptedColumns: removedColumns
      }
    };

    const shouldAutoStartProvider = !dedicatedProviderBlocked && (["image", "brand_kit", "visual_clone", "virtual_model_studio", "video", "campaign", "cinematic_video", "documentary", "music_video", "drama", "drone_video", "video_tools", "video_clipping", "talking_video", "avatar", "lip_sync", "animation", "anime_short_film", "stickman_animation", "animal_video", "nature_video", "planet_space_video"].includes(productionType) || /^image_/.test(packageId));
    if (shouldAutoStartProvider) {
      const startUrl = `${appBaseUrl(request)}/api/automation/start`;
      const startHeaders = forwardAutomationHeaders(request);
      const startBody = JSON.stringify({ production_id: data.id, user_id: userId, legal_acceptance: true, force_start: true });
      after(async () => {
        const startResponse = await fetch(startUrl, { method: "POST", headers: startHeaders, body: startBody }).catch((error) => {
          console.error("Auto provider start failed", error);
          return null;
        });
        if (startResponse && !startResponse.ok) {
          const startText = await startResponse.text().catch(() => "");
          console.error("Auto provider start failed", startResponse.status, startText);
        }
      });
    }

    return Response.json({ production: productionWithLegal, automation_job_id: automationJobId, automation_status: shouldAutoStartProvider ? "start_requested" : "queued", provider_start_requested: shouldAutoStartProvider });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not create production request") }, { status: 500 });
  }
}
