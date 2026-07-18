type PaymentReceiptEmailInput = {
  to: string;
  customerName?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  sessionId: string;
  paymentIntentId?: string | null;
  receiptUrl?: string | null;
};

type CreditActivationEmailInput = {
  to: string;
  customerName?: string | null;
  credits: number;
  note?: string | null;
  receiptReference?: string | null;
  invoiceReference?: string | null;
  newBalance?: number | null;
};

type AdminPaymentNotificationInput = {
  eventType: string;
  customerEmail?: string | null;
  customerName?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  product?: string | null;
  productId?: string | null;
  productName?: string | null;
  billing?: string | null;
  billingReason?: string | null;
  credits?: string | number | null;
  sessionId?: string | null;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  paymentIntentId?: string | null;
  status?: string | null;
  receiptUrl?: string | null;
  nextPaymentAttempt?: number | null;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatMoney(amountTotal?: number | null, currency?: string | null) {
  if (typeof amountTotal !== "number") return "Amount confirmed by the payment provider";
  const code = (currency || "usd").toUpperCase();
  return new Intl.NumberFormat("en", { style: "currency", currency: code }).format(amountTotal / 100);
}

function formatValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "Not provided";
  return String(value);
}

function adminPaymentSubject(eventType: string) {
  if (eventType === "invoice.payment_failed") return "Crelavo payment failed";
  if (eventType === "invoice.paid") return "Crelavo subscription renewal paid";
  return "Crelavo payment received";
}

export async function sendPaymentReceiptEmail(input: PaymentReceiptEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = input.to.trim().toLowerCase();
  if (!isEmail(to)) return { skipped: true, reason: "Valid customer email is missing." };
  if (!apiKey) return { skipped: true, reason: "RESEND_API_KEY is not configured." };

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const supportEmail = process.env.SUPPORT_EMAIL || "support@crelavo.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crelavo.com";
  const customerName = input.customerName?.trim() || "Crelavo customer";
  const amount = formatMoney(input.amountTotal, input.currency);
  const receiptLine = input.receiptUrl ? `Payment receipt: ${input.receiptUrl}` : "Payment receipt: available from your payment provider confirmation.";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Crelavo payment receipt",
      text: [
        `Hello ${customerName},`,
        "",
        "Thank you for your Crelavo payment. Your payment was confirmed successfully.",
        `Amount: ${amount}`,
        `Checkout session: ${input.sessionId}`,
        input.paymentIntentId ? `Payment reference: ${input.paymentIntentId}` : "Payment reference: confirmed by the active payment provider",
        receiptLine,
        "",
        "You can return to your Crelavo dashboard here:",
        `${appUrl}/dashboard/credits`,
        "",
        `If you have billing questions, contact ${supportEmail}.`
      ].join("\n")
    })
  });

  if (!response.ok) {
    return { skipped: true, reason: "Email provider rejected the payment receipt." };
  }

  return { sent: true };
}

export async function sendCreditActivationEmail(input: CreditActivationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = input.to.trim().toLowerCase();
  if (!isEmail(to)) return { skipped: true, reason: "Valid customer email is missing." };
  if (!apiKey) return { skipped: true, reason: "RESEND_API_KEY is not configured." };

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const supportEmail = process.env.SUPPORT_EMAIL || "support@crelavo.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crelavo.com";
  const customerName = input.customerName?.trim() || "Crelavo customer";
  const receiptLine = input.receiptReference?.trim()
    ? `Payment receipt/reference: ${input.receiptReference.trim()}`
    : "Payment receipt/reference: Please keep your payment provider receipt or invoice email.";
  const invoiceLine = input.invoiceReference?.trim()
    ? `Invoice reference: ${input.invoiceReference.trim()}`
    : "Invoice reference: Your payment provider receipt/invoice is the billing source of record for this transaction.";
  const balanceLine = typeof input.newBalance === "number" ? `New credit balance: ${input.newBalance.toLocaleString()} credits` : "New credit balance: visible in your dashboard.";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Crelavo credits activated",
      text: [
        `Hello ${customerName},`,
        "",
        "Your Crelavo credits have been activated by the admin team after payment review.",
        `Credits activated: ${input.credits.toLocaleString()}`,
        balanceLine,
        input.note ? `Admin note: ${input.note}` : "Admin note: Payment Link activation.",
        receiptLine,
        invoiceLine,
        "",
        "You can review your credits here:",
        `${appUrl}/dashboard/credits`,
        "",
        "If you need a billing correction, invoice update, or payment support, reply with your payment receipt email or contact:",
        supportEmail
      ].join("\n")
    })
  });

  if (!response.ok) {
    return { skipped: true, reason: "Email provider rejected the credit activation email." };
  }

  return { sent: true };
}

export async function sendAdminPaymentNotificationEmail(input: AdminPaymentNotificationInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.PAYMENT_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!isEmail(to)) return { skipped: true, reason: "Valid admin payment notification email is missing." };
  if (!apiKey) return { skipped: true, reason: "RESEND_API_KEY is not configured." };

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crelavo.com";
  const amount = formatMoney(input.amountTotal, input.currency);
  const subject = adminPaymentSubject(input.eventType);
  const nextPaymentAttempt = input.nextPaymentAttempt ? new Date(input.nextPaymentAttempt * 1000).toISOString() : "Not provided";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: [
        subject,
        "",
        `Event type: ${input.eventType}`,
        `Customer email: ${formatValue(input.customerEmail)}`,
        `Customer name: ${formatValue(input.customerName)}`,
        `Amount: ${amount}`,
        `Product: ${formatValue(input.product || input.productName)}`,
        `Product ID: ${formatValue(input.productId)}`,
        `Billing: ${formatValue(input.billing)}`,
        `Billing reason: ${formatValue(input.billingReason)}`,
        `Credits: ${formatValue(input.credits)}`,
        `Status: ${formatValue(input.status)}`,
        `Checkout session: ${formatValue(input.sessionId)}`,
        `Invoice: ${formatValue(input.invoiceId)}`,
        `Subscription: ${formatValue(input.subscriptionId)}`,
        `Payment intent: ${formatValue(input.paymentIntentId)}`,
        `Next payment attempt: ${nextPaymentAttempt}`,
        input.receiptUrl ? `Payment receipt: ${input.receiptUrl}` : "Payment receipt: Not provided",
        "",
        "Admin dashboard:",
        `${appUrl}/admin`,
        "Finance dashboard:",
        `${appUrl}/admin/billing`
      ].join("\n")
    })
  });

  if (!response.ok) {
    return { skipped: true, reason: "Email provider rejected the admin payment notification." };
  }

  return { sent: true };
}
