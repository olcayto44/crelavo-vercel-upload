export type LiveSalesProduct = { id: string; title: string; status?: string; handle?: string; image?: string | null; price?: string | null; checkout_url?: string | null };

export function catalogFromAgent(agent: Record<string, unknown>): LiveSalesProduct[] {
  const catalog = agent.catalog_snapshot;
  return Array.isArray(catalog) ? catalog.filter((item): item is LiveSalesProduct => Boolean(item && typeof item === "object" && String((item as Record<string, unknown>).id ?? ""))) : [];
}

export function catalogActions(message: string, catalog: LiveSalesProduct[]) {
  const text = message.toLowerCase();
  const product = catalog.find((item) => text.includes(item.title.toLowerCase()) || (item.handle && text.includes(item.handle.toLowerCase())));
  const actions: Array<Record<string, unknown>> = [];
  if (product) actions.push({ type: "show_product", product_id: product.id, title: product.title, handle: product.handle || null, image: product.image || null, price: product.price || null });
  if (product && /(buy|purchase|order|checkout|cart|add|satın|satın al|sepet|ödeme|sipariş)/i.test(message)) actions.push({ type: "add_to_cart_intent", product_id: product.id, quantity: 1, requires_confirmation: true });
  if (product && /(checkout|pay|ödeme|satın al|purchase)/i.test(message)) actions.push({ type: "checkout_intent", product_id: product.id, requires_confirmation: true });
  return actions;
}

export function fallbackProductReply(message: string, catalog: LiveSalesProduct[]) {
  if (!catalog.length) return "The connected product catalog is not available yet. Connect a Shopify or WooCommerce store, then refresh the catalog.";
  const products = catalog.slice(0, 5).map((item) => `${item.title}${item.price ? ` (${item.price})` : ""}`).join(", ");
  return `I can help with these catalog products: ${products}. Tell me which one you want to compare, add to cart, or check out.`;
}
