import Stripe from "stripe";
import { sendAdminPaymentNotificationEmail, sendPaymentReceiptEmail } from "@/lib/payment-email";
import { getStripe } from "@/lib/stripe";

function paymentIntentIdFromSession(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

async function receiptUrlForPaymentIntent(stripe: Stripe, paymentIntentId: string | null) {
  if (!paymentIntentId) return null;
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
    const latestCharge = paymentIntent.latest_charge;
    if (typeof latestCharge === "object" && latestCharge && "receipt_url" in latestCharge) return latestCharge.receipt_url ?? null;
  } catch (error) {
    console.warn("Stripe receipt lookup skipped", error instanceof Error ? error.message : error);
  }
  return null;
}

function subscriptionId(value: Stripe.Checkout.Session | Stripe.Invoice | Stripe.Subscription) {
  if ("subscription" in value) return typeof value.subscription === "string" ? value.subscription : value.subscription?.id ?? null;
  return value.id;
}

function creditsFromMetadata(metadata?: Stripe.Metadata | null) {
  return Number(metadata?.credits ?? 0) || 0;
}

function invoiceCustomerEmail(invoice: Stripe.Invoice) {
  return invoice.customer_email ?? null;
}

function invoiceCustomerName(invoice: Stripe.Invoice) {
  return invoice.customer_name ?? null;
}

function subscriptionCustomerEmail(subscription: Stripe.Subscription) {
  if (typeof subscription.customer === "string" || "deleted" in subscription.customer) return null;
  return subscription.customer.email ?? null;
}

function subscriptionCustomerName(subscription: Stripe.Subscription) {
  if (typeof subscription.customer === "string" || "deleted" in subscription.customer) return null;
  return subscription.customer.name ?? null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return Response.json({ error: "Missing Stripe webhook config" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      // Credit activation is intentionally server-only and idempotent. The session metadata tells whether this was a one-time top-up or a recurring subscription checkout.
      const paymentIntentId = paymentIntentIdFromSession(session);
      const receiptUrl = await receiptUrlForPaymentIntent(stripe, paymentIntentId);
      const receiptEmailResult = await sendPaymentReceiptEmail({
        to: session.customer_details?.email ?? session.customer_email ?? "",
        customerName: session.customer_details?.name ?? null,
        amountTotal: session.amount_total,
        currency: session.currency,
        sessionId: session.id,
        paymentIntentId,
        receiptUrl
      });
      const adminPaymentNotificationResult = await sendAdminPaymentNotificationEmail({
        eventType: event.type,
        customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
        customerName: session.customer_details?.name ?? null,
        amountTotal: session.amount_total,
        currency: session.currency,
        product: session.metadata?.product ?? null,
        productId: session.metadata?.productId ?? null,
        productName: session.metadata?.productName ?? null,
        billing: session.metadata?.billing ?? null,
        credits: creditsFromMetadata(session.metadata),
        sessionId: session.id,
        subscriptionId: subscriptionId(session),
        paymentIntentId,
        status: session.payment_status,
        receiptUrl
      });
      console.log("Checkout completed", {
        eventId: event.id,
        mode: session.mode,
        product: session.metadata?.product,
        productId: session.metadata?.productId,
        billing: session.metadata?.billing,
        credits: creditsFromMetadata(session.metadata),
        subscriptionId: subscriptionId(session),
        receiptEmailResult,
        adminPaymentNotificationResult
      });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      // Monthly/yearly subscription renewal succeeded. Load the subscription credits once this event id is recorded as processed.
      const adminPaymentNotificationResult = await sendAdminPaymentNotificationEmail({
        eventType: event.type,
        customerEmail: invoiceCustomerEmail(invoice),
        customerName: invoiceCustomerName(invoice),
        amountTotal: invoice.amount_paid,
        currency: invoice.currency,
        billingReason: invoice.billing_reason,
        invoiceId: invoice.id,
        subscriptionId: subscriptionId(invoice),
        status: invoice.status,
        receiptUrl: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null
      });
      console.log("Subscription invoice paid", {
        eventId: event.id,
        invoiceId: invoice.id,
        customer: invoice.customer,
        subscriptionId: subscriptionId(invoice),
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        billingReason: invoice.billing_reason,
        adminPaymentNotificationResult
      });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      // Failed renewals should notify the customer, mark subscription past-due/suspended and block new production starts until payment method is updated.
      const adminPaymentNotificationResult = await sendAdminPaymentNotificationEmail({
        eventType: event.type,
        customerEmail: invoiceCustomerEmail(invoice),
        customerName: invoiceCustomerName(invoice),
        amountTotal: invoice.amount_due,
        currency: invoice.currency,
        billingReason: invoice.billing_reason,
        invoiceId: invoice.id,
        subscriptionId: subscriptionId(invoice),
        status: invoice.status,
        receiptUrl: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null,
        nextPaymentAttempt: invoice.next_payment_attempt
      });
      console.warn("Subscription payment failed", {
        eventId: event.id,
        invoiceId: invoice.id,
        customer: invoice.customer,
        subscriptionId: subscriptionId(invoice),
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        nextPaymentAttempt: invoice.next_payment_attempt,
        adminPaymentNotificationResult
      });
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const shouldNotifyAdmin = event.type === "customer.subscription.deleted" || ["past_due", "unpaid", "canceled"].includes(subscription.status);
      const adminPaymentNotificationResult = shouldNotifyAdmin
        ? await sendAdminPaymentNotificationEmail({
            eventType: event.type,
            customerEmail: subscriptionCustomerEmail(subscription),
            customerName: subscriptionCustomerName(subscription),
            subscriptionId: subscription.id,
            status: subscription.status,
            billing: subscription.cancel_at_period_end ? "cancel_at_period_end" : "active_or_updated"
          })
        : { skipped: true, reason: "Subscription status does not require admin payment notification." };
      console.log("Subscription status changed", {
        eventId: event.id,
        subscriptionId: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        adminPaymentNotificationResult
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return Response.json({ error: message }, { status: 400 });
  }
}
