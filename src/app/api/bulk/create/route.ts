import { bulkSummary, parseCsvProducts } from "@/lib/phase2/bulk";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body.user_id ?? "").trim();
    const csv = String(body.csv ?? "");
    if (!userId || !csv) return Response.json({ error: "user_id and csv are required." }, { status: 400 });

    const items = parseCsvProducts(csv);
    const summary = bulkSummary(items);
    if (!summary.readyToQueue) return Response.json({ error: "No valid product URLs found.", items, summary }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data: batch, error: batchError } = await supabase
      .from("bulk_generation_batches")
      .insert({
        user_id: userId,
        title: String(body.title ?? "Bulk product video generation"),
        total_count: summary.total,
        valid_count: summary.valid,
        failed_count: summary.failed,
        concurrency: Number(body.concurrency ?? summary.concurrency),
        default_format: String(body.default_format ?? "720p vertical TikTok video"),
        source_filename: String(body.source_filename ?? "products.csv"),
        notify_email: String(body.notify_email ?? "") || null,
        metadata: { summary }
      })
      .select("*")
      .single();

    if (batchError) throw batchError;

    const rows = items.map((item) => ({
      batch_id: batch.id,
      user_id: userId,
      row_index: item.index,
      product_url: item.productUrl || "invalid",
      title: item.title ?? null,
      video_format: String(body.default_format ?? "720p vertical TikTok video"),
      status: item.status,
      error_message: item.error ?? null,
      metadata: item
    }));

    const { error: itemsError } = await supabase.from("bulk_generation_items").insert(rows);
    if (itemsError) throw itemsError;

    return Response.json({ batch, items, summary });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not create bulk batch") }, { status: 500 });
  }
}
