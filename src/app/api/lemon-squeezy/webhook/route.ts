import crypto from "node:crypto";
import { sendAdminPaymentNotificationEmail, sendPaymentReceiptEmail } from "@/lib/payment-email";

function verifySignature(body: string, signature: string | null, secret: string | undefined) {
  if (!signature || !secret) return false;
  const digest = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const expected = Buffer.from(digest, "hex");
  const provided = Buffer.from(signature.trim(), "hex");
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

function eventName(payload: Record<string, unknown>) {
  const meta = payload.meta && typeof payload.meta === "object" ? payload.meta as Record<string, unknown> : {};
  return String(meta.event_name ?? "");
}

function customData(payload: Record<string, unknown>) {
  const meta = payload.meta && typeof payload.meta === "object" ? payload.meta as Record<string, unknown> : {};
  const custom = meta.custom_data && typeof meta.custom_data === "object" ? meta.custom_data as Record<string, unknown> : {};
  return custom;
}

function attributes(payload: Record<string, unknown>) {
  const data = payload.data && typeof payload.data === "object" ? payload.data as Record<string, unknown> : {};
  return data.attributes && typeof data.attributes === "object" ? data.attributes as Record<string, unknown> : {};
}

function amountFromAttributes(attrs: Record<string, unknown>) {
  const cents = Number(attrs.total ?? attrs.total_usd ?? attrs.subtotal ?? 0);
  return Number.isFinite(cents) ? cents : null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-signature");
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!verifySignature(body, signature, secret)) {
    return Response.json({ error: "Missing or invalid Lemon Squeezy webhook signature." }, { status: 400 });
  }

  try {
    const payload = JSON.parse(body) as Record<string, unknown>;
    const name = eventName(payload);
    const attrs = attributes(payload);
    const custom = customData(payload);
    const customerEmail = String(attrs.user_email ?? attrs.customer_email ?? "");
    const customerName = String(attrs.user_name ?? attrs.customer_name ?? "");
    const firstOrderItem = attrs.first_order_item && typeof attrs.first_order_item === "object" ? attrs.first_order_item as Record<string, unknown> : {};
    const orderId = String(attrs.identifier ?? attrs.order_number ?? firstOrderItem.id ?? "");
    const productName = String(custom.product_name ?? attrs.product_name ?? attrs.variant_name ?? "Crelavo package");
    const status = String(attrs.status ?? name);
    const amountTotal = amountFromAttributes(attrs);
    const currency = String(attrs.currency ?? "USD").toLowerCase();
    const receiptUrl = String(attrs.urls && typeof attrs.urls === "object" ? (attrs.urls as Record<string, unknown>).receipt ?? "" : "") || null;

    if (["order_created", "subscription_created", "subscription_payment_success"].includes(name)) {
      const receiptEmailResult = await sendPaymentReceiptEmail({
        to: customerEmail,
        customerName,
        amountTotal,
        currency,
        sessionId: orderId || name,
        paymentIntentId: null,
        receiptUrl
      });
      const adminPaymentNotificationResult = await sendAdminPaymentNotificationEmail({
        eventType: name,
        customerEmail,
        customerName,
        amountTotal,
        currency,
        product: String(custom.product_type ?? "lemon_squeezy"),
        productId: String(custom.product_id ?? ""),
        productName,
        billing: String(custom.billing ?? ""),
        credits: String(custom.credits ?? ""),
        sessionId: orderId || null,
        status,
        receiptUrl
      });
      console.log("Lemon Squeezy payment event", { name, orderId, productName, receiptEmailResult, adminPaymentNotificationResult });
    }

    if (["subscription_payment_failed", "subscription_cancelled", "subscription_expired"].includes(name)) {
      const adminPaymentNotificationResult = await sendAdminPaymentNotificationEmail({
        eventType: name,
        customerEmail,
        customerName,
        amountTotal,
        currency,
        product: String(custom.product_type ?? "lemon_squeezy"),
        productId: String(custom.product_id ?? ""),
        productName,
        billing: String(custom.billing ?? ""),
        credits: String(custom.credits ?? ""),
        sessionId: orderId || null,
        status,
        receiptUrl
      });
      console.warn("Lemon Squeezy subscription attention event", { name, orderId, productName, adminPaymentNotificationResult });
    }

    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lemon Squeezy webhook error.";
    return Response.json({ error: message }, { status: 400 });
  }
}
