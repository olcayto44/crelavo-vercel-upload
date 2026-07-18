import { buildDeliveryEntries, buildDeliveryManifest, buildDeliveryReadme, buildDeliveryZip, buildPreviewHtml, buildSourceGuide } from "@/lib/automatic-delivery-builder";
import { isAdminRequest } from "@/lib/admin-guard";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function responseWithText(content: string, filename: string, contentType = "text/markdown; charset=utf-8", disposition: "attachment" | "inline" = "attachment") {
  return new Response(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="${filename}"`
    }
  });
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function firstNonEmptyObject(...values: unknown[]) {
  for (const value of values) {
    const object = objectValue(value);
    if (Object.keys(object).length) return object;
  }
  return {};
}

function previewAccessForDelivery(data: { request_metadata?: Record<string, unknown> | null; input_json?: Record<string, unknown> | null }) {
  const metadata = objectValue(data.request_metadata);
  const input = objectValue(data.input_json);
  const access = firstNonEmptyObject(metadata.previewAccess, input.previewAccess);
  const whopPreview = firstNonEmptyObject(metadata.whopPreview, input.whopPreview);
  const source = Object.keys(access).length ? access : whopPreview;
  const previewOnly = source.previewOnly === true || source.downloadAccess === "closed" || source.downloadsOpen === false;
  return {
    previewOnly,
    downloadAccess: previewOnly ? "closed" : "open"
  };
}

async function selectProductionForDelivery(id: string) {
  const supabase = supabaseAdmin();
  const fullSelect = "id, user_id, title, prompt, production_type, package_id, request_metadata, input_json, materials_json";
  const fallbackSelect = "id, user_id, title, prompt, production_type, package_id, input_json";

  const result = await supabase
    .from("production_requests")
    .select(fullSelect)
    .eq("id", id)
    .maybeSingle();

  if (!result.error || !/request_metadata/i.test(result.error.message)) return result;

  const fallback = await supabase
    .from("production_requests")
    .select(fallbackSelect)
    .eq("id", id)
    .maybeSingle();

  return {
    data: fallback.data ? { ...fallback.data, request_metadata: {}, materials_json: [] } : null,
    error: fallback.error
  };
}

async function requireDeliveryAccess(request: Request, production: { user_id?: string | null }) {
  if (isAdminRequest(request)) return { ok: true as const };
  const productionUserId = String(production.user_id ?? "").trim();
  if (!productionUserId) return { ok: false as const, response: Response.json({ error: "Delivery owner is missing; admin review is required." }, { status: 403 }) };
  const verified = await requireVerifiedRequestUser(request, productionUserId);
  if (!verified.ok) return verified;
  return { ok: true as const };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file") ?? "manifest";

  const { data, error } = await selectProductionForDelivery(id);

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Production not found" }, { status: 404 });
  }

  const access = await requireDeliveryAccess(request, data);
  if (!access.ok) return access.response;

  const safeTitle = String(data.title ?? "crelavo-delivery").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "crelavo-delivery";
  const previewAccess = previewAccessForDelivery(data);
  const downloadFiles = new Set(["readme", "source", "zip"]);

  if (previewAccess.previewOnly && downloadFiles.has(file)) {
    return Response.json({ error: "Downloads are closed during the 24-hour preview. Cancel before 24 hours to stop the main subscription; otherwise the selected plan activates automatically." }, { status: 403 });
  }

  if (file === "readme") return responseWithText(buildDeliveryReadme(data), `${safeTitle}-readme.md`);
  if (file === "source") return responseWithText(buildSourceGuide(data), `${safeTitle}-source-guide.md`);
  if (file === "preview") return responseWithText(buildPreviewHtml(data), `${safeTitle}-preview.html`, "text/html; charset=utf-8", "inline");
  if (file === "zip") {
    const zip = buildDeliveryZip(buildDeliveryEntries(data));
    return new Response(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeTitle}-delivery-package.zip"`
      }
    });
  }

  return Response.json(buildDeliveryManifest(data));
}
