import { generateWebsiteSource, type WebsiteGeneratedFile } from "@/lib/providers/openai";
import { hasProviderEnv } from "@/lib/providers/env";
import { uploadProviderAsset } from "@/lib/providers/storage";
import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { validateProductionSafety } from "@/lib/content-safety";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

const MAX_BRIEF_LENGTH = 6000;
const ALLOWED_PATH = /^(index\.html|styles\.css|script\.js|README\.md|src\/[a-zA-Z0-9._/-]+\.(tsx|ts|css|js|json|md))$/;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Website generation failed.";
}

function cleanList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 20) : String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);
}

function validateFiles(files: WebsiteGeneratedFile[]) {
  const seen = new Set<string>();
  for (const file of files) {
    if (!ALLOWED_PATH.test(file.path) || file.path.includes("..") || file.path.startsWith("/") || file.path.includes("\\")) throw new Error("Generated website contains an unsafe file path.");
    if (seen.has(file.path)) throw new Error("Generated website contains duplicate file paths.");
    if (file.content.length > 300_000) throw new Error("Generated website contains an oversized file.");
    seen.add(file.path);
  }
  if (!seen.has("index.html") || !seen.has("styles.css") || !seen.has("script.js")) throw new Error("Generated website must include index.html, styles.css and script.js.");
}

export async function POST(request: Request) {
  const limit = rateLimit({ key: `website-generate:${clientIpFromRequest(request)}`, limit: 5, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);
  try {
    const body = await request.json();
    const userId = String(body.user_id ?? "").trim();
    const userEmail = String(body.user_email ?? "").trim().toLowerCase();
    if (!userId || !userEmail) return Response.json({ error: "user_required" }, { status: 401 });
    const verified = await requireVerifiedRequestUser(request, userId);
    if (!verified.ok) return verified.response;
    if (!hasProviderEnv("openai")) return Response.json({ error: "provider_required", message: "OPENAI_API_KEY is required for real website generation." }, { status: 503 });

    const brief = String(body.brief ?? "").trim().slice(0, MAX_BRIEF_LENGTH);
    const brand = String(body.brand ?? "").trim().slice(0, 160);
    const siteType = String(body.site_type ?? "").trim().slice(0, 120);
    const audience = String(body.audience ?? "").trim().slice(0, 500);
    const style = String(body.style ?? "").trim().slice(0, 500);
    const pages = cleanList(body.pages);
    const features = cleanList(body.features);
    if (!brief || !siteType || !brand || !audience || !style) return Response.json({ error: "brief_site_type_brand_audience_style_required" }, { status: 400 });
    if (brief.length < 20) return Response.json({ error: "brief_too_short" }, { status: 400 });
    const suspicious = rejectSuspiciousText([brief, siteType, brand, audience, style, pages.join(","), features.join(",")]);
    if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });
    const safety = validateProductionSafety([brief, siteType, brand, audience, style]);
    if (!safety.ok) return Response.json({ error: safety.message }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data: production, error: insertError } = await supabase.from("production_requests").insert({
      user_id: userId,
      production_type: "website",
      package_id: "website_builder",
      title: `${brand} website`,
      prompt: brief,
      status: "in_production",
      generation_status: "provider_generating",
      estimated_credits: 0,
      reserved_credits: 0,
      request_metadata: { source: "website_builder", siteType, brand, audience, pages, features, style, provider: "openai" },
      input_json: { brief, siteType, brand, audience, pages, features, style },
      output_json: { provider: "openai", providerStatus: "generating" }
    }).select("*").single();
    if (insertError || !production) throw insertError ?? new Error("Website production record could not be created.");

    try {
      const generated = await generateWebsiteSource({ brief, siteType, brand, audience, pages, features, style });
      validateFiles(generated.files);
      const storedFiles = await Promise.all(generated.files.map(async (file) => ({
        ...file,
        url: await uploadProviderAsset(`${production.id}/website/${file.path}`, file.content, file.contentType)
      })));
      const outputJson = { provider: "openai", providerModel: process.env.OPENAI_WEBSITE_MODEL || process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini", providerStatus: "succeeded", generatedAt: new Date().toISOString(), siteTitle: generated.siteTitle, framework: generated.framework, websiteFiles: storedFiles };
      const { data: completed, error: updateError } = await supabase.from("production_requests").update({ status: "ready", generation_status: "completed", preview_url: `/api/productions/${production.id}/delivery?file=preview`, delivery_link: `/api/productions/${production.id}/delivery?file=zip`, delivery_zip_url: `/api/productions/${production.id}/delivery?file=zip`, source_files_url: `/api/productions/${production.id}/delivery?file=source`, readme_url: `/api/productions/${production.id}/delivery?file=readme`, output_json: outputJson, updated_at: new Date().toISOString() }).eq("id", production.id).select("*").single();
      if (updateError || !completed) throw updateError ?? new Error("Website production could not be finalized.");
      return Response.json({ production: completed, outputs: { previewUrl: completed.preview_url, zipUrl: completed.delivery_zip_url, sourceUrl: completed.source_files_url, readmeUrl: completed.readme_url } });
    } catch (error) {
      await supabase.from("production_requests").update({ status: "failed", generation_status: "failed", output_json: { provider: "openai", providerStatus: "failed", error: errorMessage(error) }, admin_notes: errorMessage(error), updated_at: new Date().toISOString() }).eq("id", production.id);
      throw error;
    }
  } catch (error) {
    if (errorMessage(error).includes("OPENAI_API_KEY") || errorMessage(error).includes("provider environment")) return Response.json({ error: "provider_required", message: "OPENAI_API_KEY is required for real website generation." }, { status: 503 });
    return Response.json({ error: "website_generation_failed", message: errorMessage(error) }, { status: 502 });
  }
}
