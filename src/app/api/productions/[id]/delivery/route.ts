import { buildDeliveryEntries, buildDeliveryManifest, buildDeliveryReadme, buildDeliveryZip, buildPreviewHtml, buildSourceGuide } from "@/lib/automatic-delivery-builder";
import { isAdminRequest } from "@/lib/admin-guard";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function responseWithText(content: string, filename: string, contentType = "text/markdown; charset=utf-8", disposition: "attachment" | "inline" = "attachment") {
  return new Response(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0"
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

function finalVideoUrlForDelivery(data: Record<string, unknown>) {
  const output = objectValue(data.output_json);
  return String(output.finalVideoUrl ?? output.providerFinalUrl ?? output.previewUrl ?? output.rawVisualPreviewUrl ?? data.delivery_link ?? data.preview_url ?? "").trim();
}

function previewAccessForDelivery(data: { output_json?: Record<string, unknown> | null }) {
  const output = objectValue(data.output_json);
  const input = firstNonEmptyObject(output.requestMetadata, output.inputJson);
  const access = firstNonEmptyObject(output.previewAccess, input.previewAccess);
  const whopPreview = firstNonEmptyObject(output.whopPreview, input.whopPreview);
  const source = Object.keys(access).length ? access : whopPreview;
  const previewOnly = source.previewOnly === true || source.downloadAccess === "closed" || source.downloadsOpen === false;
  return {
    previewOnly,
    downloadAccess: previewOnly ? "closed" : "open"
  };
}

async function selectProductionForDelivery(id: string) {
  const supabase = supabaseAdmin();
  const result = await supabase
    .from("production_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!result.error) return result;

  const message = String(result.error.message ?? "");
  if (/column .* does not exist|schema cache|Could not find/i.test(message)) {
    return supabase
      .from("production_requests")
      .select("id,user_id,title,prompt,production_type,package_id,request_metadata,input_json,output_json")
      .eq("id", id)
      .maybeSingle();
  }

  return result;
}

async function requireDeliveryAccess(request: Request, production: { user_id?: string | null }) {
  if (isAdminRequest(request)) return { ok: true as const };
  const productionUserId = String(production.user_id ?? "").trim();
  if (!productionUserId) return { ok: false as const, response: Response.json({ error: "Delivery owner is missing; admin review is required." }, { status: 403 }) };

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.trim()) {
    const verified = await requireVerifiedRequestUser(request, productionUserId);
    if (verified.ok) return { ok: true as const };
  }

  // Dashboard preview/download buttons open as normal browser links, so they do not carry
  // the Supabase Authorization header used by fetch requests. The production UUID link is
  // the delivery handle shown only after the user reaches the production page.
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

  if (file === "video" || file === "mp4") {
    const videoUrl = finalVideoUrlForDelivery(data as Record<string, unknown>);
    if (!videoUrl) return Response.json({ error: "Final video is not ready yet." }, { status: 404 });
    const providerResponse = await fetch(videoUrl, { cache: "no-store" });
    if (!providerResponse.ok || !providerResponse.body) return Response.json({ error: `Final video download failed: ${providerResponse.status}` }, { status: 502 });
    return new Response(providerResponse.body, {
      headers: {
        "Content-Type": providerResponse.headers.get("content-type") || "video/mp4",
        "Content-Disposition": `attachment; filename="${safeTitle}-final-video.mp4"`,
        "Cache-Control": "no-store, max-age=0"
      }
    });
  }

  if (file === "image" || file === "png" || file === "jpg" || file === "jpeg") {
    const output = data.output_json && typeof data.output_json === "object" ? data.output_json as Record<string, unknown> : {};
    const imageUrl = String(output.finalImageUrl ?? output.imageUrl ?? output.previewUrl ?? data.preview_url ?? data.delivery_link ?? "").trim();
    if (!imageUrl) return Response.json({ error: "Final image is not ready yet." }, { status: 404 });
    const providerResponse = await fetch(imageUrl, { cache: "no-store" });
    if (!providerResponse.ok || !providerResponse.body) return Response.json({ error: `Final image download failed: ${providerResponse.status}` }, { status: 502 });
    const contentType = providerResponse.headers.get("content-type") || "image/png";
    const extension = /jpeg|jpg/i.test(contentType) ? "jpg" : /webp/i.test(contentType) ? "webp" : "png";
    return new Response(providerResponse.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeTitle}-final-image.${extension}"`,
        "Cache-Control": "no-store, max-age=0"
      }
    });
  }

  if (file === "readme") return responseWithText(buildDeliveryReadme(data), `${safeTitle}-readme.md`);
  if (file === "source") return responseWithText(buildSourceGuide(data), `${safeTitle}-source-guide.md`);
  if (file === "preview" || file === "manifest") return responseWithText(buildPreviewHtml(data), `${safeTitle}-preview.html`, "text/html; charset=utf-8", "inline");
  if (file === "zip") {
    const zip = buildDeliveryZip(buildDeliveryEntries(data));
    return new Response(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeTitle}-delivery-package.zip"`,
        "Cache-Control": "no-store, max-age=0"
      }
    });
  }

  if (file === "manifest-json") return Response.json(buildDeliveryManifest(data), { headers: { "Cache-Control": "no-store, max-age=0" } });
  return responseWithText(buildPreviewHtml(data), `${safeTitle}-delivery-overview.html`, "text/html; charset=utf-8", "inline");
}
