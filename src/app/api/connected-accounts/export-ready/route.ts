import { buildExportReadyPack, connectedAccountGuardrails, normalizeConnectedProvider } from "@/lib/connected-accounts";
import { requireVerifiedRequestUser } from "@/lib/supabase";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id ?? body.userId);
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;

  const targetProviders = Array.isArray(body.target_providers ?? body.targetProviders)
    ? (body.target_providers ?? body.targetProviders).map(normalizeConnectedProvider).filter(Boolean)
    : [];

  const pack = buildExportReadyPack({
    title: clean(body.title) || "Crelavo export pack",
    mediaUrl: clean(body.media_url ?? body.mediaUrl) || undefined,
    caption: clean(body.caption) || undefined,
    hashtags: Array.isArray(body.hashtags) ? body.hashtags.map(clean).filter(Boolean) : [],
    targetProviders
  });

  return Response.json({
    mode: "export_ready",
    pack,
    downloadReady: true,
    directPublishReady: false,
    guardrails: connectedAccountGuardrails
  });
}
