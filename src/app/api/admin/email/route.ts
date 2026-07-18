import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function uniqueEmails(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(isEmail)));
}

async function loadRecipients(targetType: string, recipientEmail: string) {
  if (["one_user", "one_partner", "custom"].includes(targetType)) return uniqueEmails([recipientEmail]);

  const supabase = supabaseAdmin();

  if (targetType === "all_users") {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, role")
      .neq("role", "admin")
      .limit(500);
    if (error) throw error;
    return uniqueEmails((data ?? []).map((row) => String(row.email ?? "")));
  }

  if (targetType === "all_partners") {
    const { data, error } = await supabase
      .from("partner_profiles")
      .select("email")
      .limit(500);
    if (error) throw error;
    return uniqueEmails((data ?? []).map((row) => String(row.email ?? "")));
  }

  return [];
}

async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { to, sent: false, reason: "RESEND_API_KEY is not configured." };

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, text: body })
  });

  if (!response.ok) return { to, sent: false, reason: "Email provider rejected the message." };
  return { to, sent: true };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const targetType = String(body.target_type ?? body.targetType ?? "").trim();
  const recipientEmail = String(body.recipient_email ?? body.recipientEmail ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const messageBody = String(body.body ?? body.message ?? "").trim();

  if (!targetType) return Response.json({ error: "Target type is required." }, { status: 400 });
  if (!subject) return Response.json({ error: "Subject is required." }, { status: 400 });
  if (!messageBody) return Response.json({ error: "Email body is required." }, { status: 400 });

  try {
    const recipients = await loadRecipients(targetType, recipientEmail);
    if (!recipients.length) return Response.json({ error: "No valid recipient email was found." }, { status: 400 });
    if (recipients.length > 500) return Response.json({ error: "Recipient list is too large for one admin send." }, { status: 400 });

    const results = [];
    for (const to of recipients) {
      results.push(await sendEmail(to, subject, messageBody));
    }

    const sentCount = results.filter((item) => item.sent).length;
    return Response.json({ ok: sentCount > 0, sentCount, failedCount: results.length - sentCount, recipients: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin email could not be sent.";
    return Response.json({ error: message }, { status: 500 });
  }
}
