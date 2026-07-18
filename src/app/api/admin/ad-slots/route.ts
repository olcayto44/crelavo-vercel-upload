import { defaultAdSlots, normalizeAdSlots, type AdSlotConfig } from "@/lib/ad-config";
import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "ad_slots";

type ConfigPayload = {
  slots?: AdSlotConfig[];
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value, updated_at")
      .eq("key", CONFIG_KEY)
      .maybeSingle();

    if (error) throw error;
    const payload = data?.value as ConfigPayload | null;
    const slots = normalizeAdSlots(payload?.slots);
    return Response.json({ slots, updated_at: data?.updated_at ?? null, fallback: !data });
  } catch (error) {
    return Response.json({ slots: defaultAdSlots, fallback: true, error: errorMessage(error, "Could not load ad slots") }, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const body = await request.json();
    const slots = normalizeAdSlots(body.slots);
    if (!slots.length) return Response.json({ error: "At least one valid ad slot is required." }, { status: 400 });

    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: CONFIG_KEY,
        value: { slots },
        description: "Public and dashboard ad slot configuration",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })
      .select("value, updated_at")
      .single();

    if (error) throw error;
    const payload = data.value as ConfigPayload;
    return Response.json({ slots: normalizeAdSlots(payload.slots), updated_at: data.updated_at });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save ad slots") }, { status: 500 });
  }
}
