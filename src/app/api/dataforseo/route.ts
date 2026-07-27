import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getKeywordVolume, getSerpLive } from "@/lib/providers/dataforseo";

function keywordsFrom(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function assertSeoProviderAccess(request: Request, body?: Record<string, unknown>) {
  if (!isAdminRequest(request, body)) return adminRequiredResponse();
  return null;
}

export async function GET(request: Request) {
  const accessError = assertSeoProviderAccess(request);
  if (accessError) return accessError;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "serp";
  const keyword = url.searchParams.get("keyword") || "";
  const locationName = url.searchParams.get("location_name") || undefined;
  const languageCode = url.searchParams.get("language_code") || undefined;

  try {
    if (action === "volume") {
      const keywords = keywordsFrom(url.searchParams.get("keywords") || keyword);
      if (!keywords.length) return Response.json({ error: "keyword or keywords is required." }, { status: 400 });
      const result = await getKeywordVolume({ keywords, locationName, languageCode });
      return Response.json({ action, result });
    }

    if (!keyword) return Response.json({ error: "keyword is required." }, { status: 400 });
    const result = await getSerpLive({ keyword, locationName, languageCode });
    return Response.json({ action: "serp", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DataForSEO request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessError = assertSeoProviderAccess(request, body);
    if (accessError) return accessError;
    const action = String(body.action ?? "serp");
    const locationName = body.location_name || body.locationName;
    const languageCode = body.language_code || body.languageCode;

    if (action === "volume") {
      const keywords = keywordsFrom(body.keywords ?? body.keyword);
      if (!keywords.length) return Response.json({ error: "keyword or keywords is required." }, { status: 400 });
      const result = await getKeywordVolume({ keywords, locationName, languageCode });
      return Response.json({ action, result });
    }

    const keyword = String(body.keyword ?? "").trim();
    if (!keyword) return Response.json({ error: "keyword is required." }, { status: 400 });
    const result = await getSerpLive({ keyword, locationName, languageCode });
    return Response.json({ action: "serp", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DataForSEO request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
