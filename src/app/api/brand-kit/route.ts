import { normalizeBrandKit, shotstackBrandOverlay } from "@/lib/phase2/brand-kit";
import { supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("user_id") ?? "";
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

    const { data, error } = await supabaseAdmin().from("brand_kits").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return Response.json({ brand_kit: data, overlay: data ? shotstackBrandOverlay({ userId, logoUrl: data.logo_url, primaryColor: data.primary_color, secondaryColor: data.secondary_color, subtitleColor: data.subtitle_color, fontUrl: data.font_url, fontName: data.font_name }) : null });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load brand kit") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body.user_id ?? "").trim();
    if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });

    const normalized = normalizeBrandKit({
      userId,
      logoUrl: String(body.logo_url ?? ""),
      primaryColor: String(body.primary_color ?? ""),
      secondaryColor: String(body.secondary_color ?? ""),
      subtitleColor: String(body.subtitle_color ?? ""),
      fontUrl: String(body.font_url ?? ""),
      fontName: String(body.font_name ?? "")
    });

    const { data, error } = await supabaseAdmin()
      .from("brand_kits")
      .upsert({
        user_id: userId,
        logo_url: normalized.logoUrl ?? null,
        primary_color: normalized.primaryColor ?? null,
        secondary_color: normalized.secondaryColor ?? null,
        subtitle_color: normalized.subtitleColor ?? null,
        font_url: normalized.fontUrl ?? null,
        font_name: normalized.fontName ?? null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ brand_kit: data, overlay: shotstackBrandOverlay(normalized) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save brand kit") }, { status: 500 });
  }
}
