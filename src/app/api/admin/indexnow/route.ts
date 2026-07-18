import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { googleIndexingAllSitemapUrls } from "@/lib/google-indexing";

const INDEXNOW_KEY = "crelavo-indexnow-B09A1EA26FA6A860";
const INDEXNOW_KEY_LOCATION = `https://www.crelavo.com/${INDEXNOW_KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_HOST = "www.crelavo.com";
const MAX_URLS_PER_REQUEST = 10_000;

type IndexNowBody = {
  urls?: unknown;
  urlList?: unknown;
  dryRun?: unknown;
  admin_email?: unknown;
  adminEmail?: unknown;
  admin_token?: unknown;
  adminToken?: unknown;
};

function normalizeUrls(input: unknown) {
  const rawUrls = Array.isArray(input) ? input : [];
  const urls = rawUrls
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .slice(0, MAX_URLS_PER_REQUEST);

  const validUrls: string[] = [];
  const rejectedUrls: string[] = [];

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || !["www.crelavo.com", "crelavo.com"].includes(parsed.hostname)) {
        rejectedUrls.push(url);
        continue;
      }
      validUrls.push(parsed.toString());
    } catch {
      rejectedUrls.push(url);
    }
  }

  return { validUrls: [...new Set(validUrls)], rejectedUrls };
}

function defaultUrls() {
  return googleIndexingAllSitemapUrls.map((item) => item.url).slice(0, MAX_URLS_PER_REQUEST);
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  return Response.json({
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    endpoint: INDEXNOW_ENDPOINT,
    host: INDEXNOW_HOST,
    defaultUrlCount: defaultUrls().length
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: IndexNowBody = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!isAdminRequest(request, body as Record<string, unknown>)) return adminRequiredResponse();

  const requestedUrls = Array.isArray(body.urlList) ? body.urlList : body.urls;
  const { validUrls, rejectedUrls } = normalizeUrls(requestedUrls ?? defaultUrls());

  if (!validUrls.length) {
    return Response.json({ error: "No valid Crelavo URLs supplied for IndexNow.", rejectedUrls }, { status: 400 });
  }

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: validUrls
  };

  if (body.dryRun === true) {
    return Response.json({ dryRun: true, payload, rejectedUrls }, { headers: { "Cache-Control": "no-store" } });
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const text = await response.text().catch(() => "");

  return Response.json({
    submitted: response.ok,
    status: response.status,
    statusText: response.statusText,
    submittedCount: validUrls.length,
    rejectedUrls,
    responseBody: text.slice(0, 1000)
  }, {
    status: response.ok ? 200 : response.status,
    headers: { "Cache-Control": "no-store" }
  });
}
