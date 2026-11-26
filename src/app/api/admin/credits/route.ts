import { requireAdminPermission } from "@/lib/admin-guard";
import { sendCreditActivationEmail } from "@/lib/payment-email";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const access = await requireAdminPermission(request, "credits", body);
  if (!access.ok) return access.response;
  const email = String(body.email ?? "").trim().toLowerCase();
  const rawAmount = Number(body.amount ?? 0);
  const action = String(body.action ?? "add").trim().toLowerCase();
  const amount = action === "remove" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
  const note = String(body.note ?? "Manual admin credit adjustment");
  const receiptReference = String(body.receiptReference ?? body.receiptUrl ?? "").trim();
  const invoiceReference = String(body.invoiceReference ?? body.invoiceUrl ?? "").trim();
  const notifyUser = body.notifyUser !== false;

  if (!email || !Number.isSafeInteger(rawAmount) || rawAmount <= 0 || rawAmount > 10000000) {
    return Response.json({ error: "Valid email and positive credit amount are required." }, { status: 400 });
  }
  if (!["add", "remove"].includes(action)) {
    return Response.json({ error: "Action must be add or remove." }, { status: 400 });
  }

  if (process.env.STUDIO_ADMIN_ATOMIC_WALLET_ENABLED !== "true" || process.env.VERCEL_ENV !== "production") {
    return Response.json({ error: "Atomic credit adjustment is not enabled." }, { status: 503 });
  }
  try {
    const supabase = supabaseAdmin();
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (profileError) throw profileError;

    // Credits must always be attached to the canonical Supabase Auth UUID.
    // Legacy profile rows can retain the same email with a stale id, which
    // makes production requests see a zero balance for the signed-in user.
    let authUser = null;
    if (profile?.id) {
      const { data: authUserData } = await supabase.auth.admin.getUserById(profile.id);
      if (authUserData.user?.email?.toLowerCase() === email) authUser = authUserData.user;
    }
    if (!authUser) {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;
      authUser = usersData.users.find((user) => user.email?.toLowerCase() === email) ?? null;
    }

    if (!authUser?.email) {
      return Response.json({ error: "User not found. User must register first." }, { status: 404 });
    }

    if (!profile || profile.id !== authUser.id) {
      const { data: canonicalProfile, error: canonicalProfileError } = await supabase
        .from("profiles")
        .upsert({
          id: authUser.id,
          email: authUser.email.toLowerCase(),
          role: "user"
        }, { onConflict: "id" })
        .select("id, email")
        .single();

      if (canonicalProfileError) throw canonicalProfileError;
      profile = canonicalProfile;
    }

    // The candidate must be installed and explicitly enabled before this write path opens.
    // Never fall back to the old non-atomic write after an uncertain RPC outcome.
    const eventNote = [
      note,
      receiptReference ? `receipt=${receiptReference}` : "",
      invoiceReference ? `invoice=${invoiceReference}` : ""
    ].filter(Boolean).join(" | ");
    if (eventNote.length > 2000) return Response.json({ error: "Credit adjustment note is too long." }, { status: 400 });
    const { data: balance, error: balanceError } = await supabase.rpc("studio_admin_adjust_bonus", {
      p_user: profile.id, p_delta: amount, p_note: eventNote,
    });
    if (balanceError) {
      if (["wallet_reconciliation_required", "insufficient_unreserved_bonus"].some(code => balanceError.message.includes(code))) {
        return Response.json({ error: "Credit adjustment requires reconciliation or sufficient unreserved bonus credits." }, { status: 409 });
      }
      return Response.json({ error: "Credit adjustment could not be confirmed. Check the wallet before retrying." }, { status: 503 });
    }
    if (!balance || !Number.isSafeInteger(balance.balance)) {
      return Response.json({ error: "Credit adjustment outcome is unconfirmed. Check the wallet before retrying." }, { status: 503 });
    }

    const emailResult = action === "add" && notifyUser
      ? await sendCreditActivationEmail({
          to: profile.email,
          credits: Math.abs(amount),
          note,
          receiptReference,
          invoiceReference,
          newBalance: balance.balance
        })
      : { skipped: true, reason: action === "remove" ? "Credit removal does not send activation email." : "Admin disabled user notification." };

    await supabase.from("email_logs").insert({ user_id: profile.id, to_email: profile.email, template: "credit_activation", subject: "Crelavo credits activated", status: emailResult?.sent === false ? "failed" : "sent", error: emailResult?.sent === false ? String(emailResult.reason ?? "Email failed") : null, created_at: new Date().toISOString() });
    return Response.json({ profile, balance, email: emailResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add credits";
    return Response.json({ error: message }, { status: 500 });
  }
}
