import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { sendCreditActivationEmail } from "@/lib/payment-email";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  if (!isAdminRequest(request, body)) return adminRequiredResponse();
  const email = String(body.email ?? "").trim().toLowerCase();
  const rawAmount = Number(body.amount ?? 0);
  const action = String(body.action ?? "add").trim().toLowerCase();
  const amount = action === "remove" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
  const note = String(body.note ?? "Manual admin credit adjustment");
  const receiptReference = String(body.receiptReference ?? body.receiptUrl ?? "").trim();
  const invoiceReference = String(body.invoiceReference ?? body.invoiceUrl ?? "").trim();
  const notifyUser = body.notifyUser !== false;

  if (!email || !Number.isFinite(rawAmount) || rawAmount <= 0) {
    return Response.json({ error: "Valid email and positive credit amount are required." }, { status: 400 });
  }
  if (!["add", "remove"].includes(action)) {
    return Response.json({ error: "Action must be add or remove." }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) throw usersError;

      const authUser = usersData.users.find((user) => user.email?.toLowerCase() === email);

      if (!authUser?.email) {
        return Response.json({ error: "User not found. User must register first." }, { status: 404 });
      }

      const { data: createdProfile, error: createProfileError } = await supabase
        .from("profiles")
        .upsert({
          id: authUser.id,
          email: authUser.email.toLowerCase(),
          role: "user"
        }, { onConflict: "id" })
        .select("id, email")
        .single();

      if (createProfileError) throw createProfileError;
      profile = createdProfile;
    }

    const { data: currentBalance, error: balanceReadError } = await supabase
      .from("credit_balances")
      .select("balance, reserved, bonus_credits")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (balanceReadError) throw balanceReadError;

    const current = currentBalance?.balance ?? 0;
    const nextBalance = Math.max(0, current + amount);
    const nextReserved = currentBalance?.reserved ?? 0;
    const currentBonus = currentBalance?.bonus_credits ?? 0;
    const nextBonusCredits = action === "add" ? currentBonus + Math.abs(amount) : Math.max(0, currentBonus - Math.abs(amount));

    const { data: balance, error: balanceError } = await supabase
      .from("credit_balances")
      .upsert({
        user_id: profile.id,
        balance: nextBalance,
        reserved: nextReserved,
        bonus_credits: nextBonusCredits,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })
      .select("balance, reserved, bonus_credits, updated_at")
      .single();

    if (balanceError) throw balanceError;

    const eventNote = [
      note,
      receiptReference ? `receipt=${receiptReference}` : "",
      invoiceReference ? `invoice=${invoiceReference}` : ""
    ].filter(Boolean).join(" | ");

    const { error: eventError } = await supabase
      .from("credit_events")
      .insert({
        user_id: profile.id,
        type: "adjustment",
        amount,
        note: eventNote
      });

    if (eventError) throw eventError;

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

    return Response.json({ profile, balance, email: emailResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add credits";
    return Response.json({ error: message }, { status: 500 });
  }
}
