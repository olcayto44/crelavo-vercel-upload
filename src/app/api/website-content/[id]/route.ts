import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";
import { rejectSuspiciousText } from "@/lib/security";

const MAX_CONTENT_SIZE = 300_000;
const ALLOWED_KEYS = new Set(["siteTitle", "tagline", "heroTitle", "heroBody", "primaryCta", "aboutTitle", "aboutBody", "contactEmail", "pages", "features"]);

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sanitizeContent(value: unknown) {
  const source = objectValue(value);
  const result: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(source)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (Array.isArray(raw)) result[key] = raw.map((item) => String(item ?? "").trim().slice(0, 240)).filter(Boolean).slice(0, 50);
    else result[key] = String(raw ?? "").trim().slice(0, 2000);
  }
  return result;
}

async function getOwnedWebsite(request: Request, id: string) {
  const body = await request.clone().json().catch(() => ({})) as Record<string, unknown>;
  const userId = String(body.user_id ?? request.headers.get("x-user-id") ?? "").trim();
  if (!userId) return { error: Response.json({ error: "user_required" }, { status: 401 }) } as const;
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return { error: verified.response } as const;
  const { data, error } = await supabaseAdmin().from("production_requests").select("id,user_id,production_type,output_json").eq("id", id).maybeSingle();
  if (error || !data) return { error: Response.json({ error: "website_not_found" }, { status: 404 }) } as const;
  if (String(data.user_id) !== userId || String(data.production_type) !== "website") return { error: Response.json({ error: "website_access_denied" }, { status: 403 }) } as const;
  return { data, userId } as const;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = String(searchParams.get("user_id") ?? "").trim();
  if (!userId) return Response.json({ error: "user_required" }, { status: 401 });
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified.response;
  const { data, error } = await supabaseAdmin().from("production_requests").select("id,user_id,production_type,output_json").eq("id", id).maybeSingle();
  if (error || !data) return Response.json({ error: "website_not_found" }, { status: 404 });
  if (String(data.user_id) !== userId || String(data.production_type) !== "website") return Response.json({ error: "website_access_denied" }, { status: 403 });
  const output = objectValue(data.output_json);
  return Response.json({ production_id: id, content: sanitizeContent(output.websiteContent), updated_at: output.websiteContentUpdatedAt ?? null });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await getOwnedWebsite(request, id);
  if ("error" in owned) return owned.error;
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const content = sanitizeContent(payload?.content);
  if (!Object.keys(content).length) return Response.json({ error: "content_required" }, { status: 400 });
  if (JSON.stringify(content).length > MAX_CONTENT_SIZE) return Response.json({ error: "content_too_large" }, { status: 413 });
  const values = Object.values(content).flatMap((value) => Array.isArray(value) ? value.map(String) : [String(value ?? "")]);
  const suspicious = rejectSuspiciousText(values);
  if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });
  const output = objectValue(owned.data.output_json);
  const updatedAt = new Date().toISOString();
  const nextOutput = { ...output, websiteContent: content, websiteContentUpdatedAt: updatedAt, websiteContentRevision: Number(output.websiteContentRevision ?? 0) + 1 };
  const { error } = await supabaseAdmin().from("production_requests").update({ output_json: nextOutput, updated_at: updatedAt }).eq("id", id).eq("user_id", owned.userId);
  if (error) return Response.json({ error: "website_content_update_failed" }, { status: 502 });
  return Response.json({ production_id: id, content, updated_at: updatedAt, revision: nextOutput.websiteContentRevision });
}
