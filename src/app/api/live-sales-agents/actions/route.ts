import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";
import { catalogFromAgent, type LiveSalesProduct } from "@/lib/live-sales";

const clean = (value: unknown) => String(value ?? "").trim();
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = clean(body.user_id), agentId = clean(body.agent_id), sessionId = clean(body.session_id), productId = clean(body.product_id);
    const action = clean(body.action);
    if (!userId || !agentId || !sessionId || !productId || !["add_to_cart", "checkout"].includes(action)) return Response.json({ error: "user_id, agent_id, session_id, product_id and a valid action are required." }, { status: 400 });
    const auth = await requireVerifiedRequestUser(request, userId);
    if (!auth.ok) return auth.response;
    const supabase = supabaseAdmin();
    const { data: agent, error } = await supabase.from("live_sales_agents").select("catalog_snapshot").eq("agent_id", agentId).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    const product = catalogFromAgent(agent ?? {}).find((item) => item.id === productId) as LiveSalesProduct | undefined;
    if (!product) return Response.json({ error: "Product is not present in the connected catalog." }, { status: 404 });
    const result = action === "checkout" && product.checkout_url ? { status: "ready", url: product.checkout_url } : { status: "provider_required", message: action === "checkout" ? "The connected store did not provide a checkout URL. Complete checkout in the store; no payment was started." : "Cart writes require a connected commerce provider. The intent was recorded without changing the store." };
    await supabase.from("live_sales_session_messages").insert({ session_id: sessionId, role: "system", content: `${action}:${product.id}`, actions: [{ type: action, product_id: product.id, result }] });
    return Response.json({ action, product, result });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Commerce action could not be completed." }, { status: 500 }); }
}
