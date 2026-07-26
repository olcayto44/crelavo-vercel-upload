import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { sendAbandonedCheckoutEmail, sendPreviewReminderEmail } from "@/lib/payment-email";

function cleanEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase().slice(0, 180);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const type = String(body.type ?? "").trim();
  const to = cleanEmail(body.to ?? body.email);
  if (!isEmail(to)) return Response.json({ error: "Valid recipient email is required." }, { status: 400 });

  const input = {
    to,
    customerName: String(body.customerName ?? "").trim(),
    productName: String(body.productName ?? "").trim(),
    checkoutUrl: String(body.checkoutUrl ?? "").trim(),
    cancelUrl: String(body.cancelUrl ?? "").trim(),
    previewEndsAt: String(body.previewEndsAt ?? "").trim()
  };

  if (type === "preview_reminder") {
    const result = await sendPreviewReminderEmail(input);
    return Response.json({ ok: "sent" in result, type, result });
  }

  if (type === "abandoned_checkout") {
    const result = await sendAbandonedCheckoutEmail(input);
    return Response.json({ ok: "sent" in result, type, result });
  }

  return Response.json({ error: "Unsupported lifecycle email type. Use preview_reminder or abandoned_checkout." }, { status: 400 });
}
