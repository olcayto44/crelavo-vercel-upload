type ProductionCompletionEmailInput = {
  to: string;
  title: string;
  productionId: string;
  deliveryUrl?: string | null;
  previewUrl?: string | null;
  sourceFilesUrl?: string | null;
  readmeUrl?: string | null;
};

type GrowthIntelligenceReportEmailInput = {
  to: string;
  brandName: string;
  requestId: string;
  reportFileUrl?: string | null;
  reportFileName?: string | null;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendProductionCompletionEmail(input: ProductionCompletionEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = input.to.trim().toLowerCase();
  if (!isEmail(to)) return { skipped: true, reason: "Valid customer email is missing." };
  if (!apiKey) return { skipped: true, reason: "RESEND_API_KEY is not configured." };

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const supportEmail = process.env.SUPPORT_EMAIL || "support@crelavo.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crelavo.com";
  const dashboardUrl = `${appUrl}/dashboard/productions`;
  const deliveryUrl = input.deliveryUrl || input.previewUrl || dashboardUrl;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Your Crelavo production is ready",
      text: [
        "Hello,",
        "",
        `Your Crelavo production is ready: ${input.title}`,
        `Production ID: ${input.productionId}`,
        "",
        `Open your delivery: ${deliveryUrl}`,
        input.previewUrl ? `Preview: ${input.previewUrl}` : "Preview: available in your dashboard",
        input.sourceFilesUrl ? `Source files: ${input.sourceFilesUrl}` : "Source files: available if included in your package",
        input.readmeUrl ? `README: ${input.readmeUrl}` : "README: available if included in your package",
        "",
        `Dashboard: ${dashboardUrl}`,
        "",
        `If you need help with delivery, contact ${supportEmail}.`
      ].join("\n")
    })
  });

  if (!response.ok) {
    return { skipped: true, reason: "Email provider rejected the production completion email." };
  }

  return { sent: true };
}

export async function sendGrowthIntelligenceReportReadyEmail(input: GrowthIntelligenceReportEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = input.to.trim().toLowerCase();
  if (!isEmail(to)) return { skipped: true, reason: "Valid customer email is missing." };
  if (!apiKey) return { skipped: true, reason: "RESEND_API_KEY is not configured." };

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const supportEmail = process.env.SUPPORT_EMAIL || "support@crelavo.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crelavo.com";
  const dashboardUrl = `${appUrl}/dashboard/growth-intelligence`;
  const deliveryUrl = input.reportFileUrl || dashboardUrl;
  const reportName = input.reportFileName || "Growth Intelligence report";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Your Growth Intelligence report is ready",
      text: [
        "Hello,",
        "",
        `Your Growth Intelligence report is ready for ${input.brandName}.`,
        `Request ID: ${input.requestId}`,
        `Report: ${reportName}`,
        "",
        `Open your report: ${deliveryUrl}`,
        `Dashboard: ${dashboardUrl}`,
        "",
        "Access follows your active service entitlement or credit eligibility in Crelavo.",
        `If you need help with the report, contact ${supportEmail}.`
      ].join("\n")
    })
  });

  if (!response.ok) {
    return { skipped: true, reason: "Email provider rejected the Growth Intelligence report email." };
  }

  return { sent: true };
}

export async function customerEmailForProduction(userId: string) {
  const { supabaseAdmin } = await import("@/lib/supabase");
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  return typeof data?.email === "string" ? data.email : "";
}
