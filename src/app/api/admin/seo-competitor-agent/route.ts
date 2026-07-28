import { requireAdminPermission } from "@/lib/admin-guard";
import { buildSeoCompetitorReport, normalizeDomains } from "@/lib/seo-competitor-agent";
import { getSerpLive } from "@/lib/providers/dataforseo";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function listFrom(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return clean(value).split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const access = await requireAdminPermission(request, ["growth", "content"], body);
  if (!access.ok) return access.response;

  const ownDomain = clean(body.own_domain ?? body.ownDomain) || "crelavo.com";
  const competitors = normalizeDomains(listFrom(body.competitors)).slice(0, 5);
  const keywords = listFrom(body.keywords).slice(0, 8);
  const locationName = clean(body.location_name ?? body.locationName) || "United States";
  const languageCode = clean(body.language_code ?? body.languageCode) || "en";

  if (!competitors.length) return Response.json({ error: "At least one competitor domain is required." }, { status: 400 });
  if (!keywords.length) return Response.json({ error: "At least one keyword is required." }, { status: 400 });

  try {
    const serpResults = [];
    for (const keyword of keywords) {
      const result = await getSerpLive({ keyword, locationName, languageCode });
      serpResults.push({ keyword, result });
    }

    const report = buildSeoCompetitorReport({
      ownDomain,
      competitors,
      keywords,
      locationName,
      languageCode,
      serpResults
    });

    return Response.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEO competitor analysis failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
