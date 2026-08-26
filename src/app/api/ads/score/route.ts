import { scoreAdPerformance } from "@/lib/providers/openai";
import { ProviderConfigError } from "@/lib/providers/types";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return [record.message, record.details, record.hint, record.code].filter(Boolean).map(String).join(" | ");
  }
  return "Ad performance analysis failed.";
}

function schemaSafeInsert(supabase: ReturnType<typeof supabaseAdmin>, payload: Record<string, unknown>) {
  const mutablePayload = { ...payload };
  return (async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const result = await supabase.from("production_requests").insert(mutablePayload).select("*").single();
      if (!result.error) return result;
      const message = [result.error.message, result.error.details].filter(Boolean).join(" ");
      const match = message.match(/(?:column|field)\s+["']?([a-zA-Z0-9_]+)["']?/i);
      const missingColumn = match?.[1];
      if (!missingColumn || !(missingColumn in mutablePayload) || !/schema cache|does not exist|PGRST204/i.test(`${result.error.code} ${message}`)) throw result.error;
      delete mutablePayload[missingColumn];
    }
    throw new Error("Ad score production record could not be created with the current database schema.");
  })();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = text(body.user_id, 100);
    const adText = text(body.ad_text, 12000);
    const productBrief = text(body.product_brief, 12000);
    const productUrl = text(body.product_url, 1000);
    const platform = text(body.platform, 100);
    const material = body.material && typeof body.material === "object" && !Array.isArray(body.material) ? body.material as Record<string, unknown> : undefined;

    if (!userId) return Response.json({ error: "user_required", message: "Reklam analizi için giriş yapmalısınız." }, { status: 401 });
    if (!adText) return Response.json({ error: "ad_text_required", message: "Reklam metni veya script gerekli." }, { status: 400 });
    if (!productBrief) return Response.json({ error: "product_brief_required", message: "Ürün veya kampanya brief'i gerekli." }, { status: 400 });
    if (productUrl && !/^https?:\/\/\S+$/i.test(productUrl)) return Response.json({ error: "invalid_product_url", message: "Ürün linki http veya https ile başlamalı." }, { status: 400 });

    const verified = await requireVerifiedRequestUser(request, userId);
    if (!verified.ok) return verified.response;

    const result = await scoreAdPerformance({ adText, productBrief, productUrl, platform, material });
    const title = `Ad Performance Score — ${new Date().toISOString().slice(0, 10)}`;
    const inputJson = { adText, productBrief, productUrl: productUrl || null, platform: platform || null, material: material ?? null };
    const outputJson = { analysis: result, provider: "openai", providerModel: process.env.OPENAI_AD_SCORE_MODEL || process.env.OPENAI_AD_MODEL || process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini", completedAt: new Date().toISOString(), inputJson };
    const supabase = supabaseAdmin();
    const { data: production, error } = await schemaSafeInsert(supabase, {
      user_id: userId,
      production_type: "ad_score_checker",
      package_id: "ad_score_basic",
      title,
      prompt: `${adText}\n\nProduct/campaign brief:\n${productBrief}`,
      status: "completed",
      generation_status: "succeeded",
      estimated_credits: 0,
      reserved_credits: 0,
      input_json: inputJson,
      request_metadata: { category: "ad_score_checker", provider: "openai", deliveryRequirements: { requested: true, status: "ready", formats: ["score_json", "score_markdown"] } },
      output_json: outputJson,
      admin_notes: "Completed by the real ad performance scoring provider."
    });
    if (error || !production) throw error ?? new Error("Ad score production record was not created.");

    const deliveryBase = `/api/productions/${production.id}/delivery`;
    return Response.json({
      analysis: result,
      production: { id: production.id, status: production.status, title: production.title },
      delivery: { json: `${deliveryBase}?file=score-json`, markdown: `${deliveryBase}?file=score-markdown`, manifest: `${deliveryBase}?file=manifest-json` }
    });
  } catch (error) {
    if (error instanceof ProviderConfigError) return Response.json({ error: "provider_required", message: "Gerçek reklam analizi için OPENAI_API_KEY gerekli." }, { status: 503 });
    return Response.json({ error: "ad_score_failed", message: errorMessage(error) || "Reklam analizi başarısız oldu." }, { status: 502 });
  }
}
