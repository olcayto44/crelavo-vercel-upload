import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

function estimateCreditValueUsd(credits: number) {
  if (credits <= 0) return 0;
  return Math.round((credits / 2500) * 29);
}

function noteValue(note: string | null | undefined, key: string) {
  const parts = String(note ?? "").split("|").map((item) => item.trim());
  const match = parts.find((item) => item.toLowerCase().startsWith(`${key.toLowerCase()}=`));
  return match ? match.slice(key.length + 1).trim() : "";
}

async function safeTable<T>(loader: () => PromiseLike<{ data: T | null; error: any }>, fallback: T) {
  try {
    const { data, error } = await loader();
    if (error) return fallback;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  const { id } = await params;
  const userId = String(id ?? "").trim();
  if (!userId) return Response.json({ error: "User id is required." }, { status: 400 });

  try {
    const supabase = supabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError && !profile) throw authUserError;
    const authUser = authUserData?.user ?? null;
    const email = String(profile?.email ?? authUser?.email ?? "").toLowerCase();

    if (!profile && !authUser) return Response.json({ error: "User not found." }, { status: 404 });

    const balance = await safeTable(
      () => supabase.from("credit_balances").select("user_id, balance, reserved, bonus_credits, updated_at").eq("user_id", userId).maybeSingle(),
      null as any
    );

    const creditEvents = await safeTable(
      () => supabase.from("credit_events").select("id, user_id, type, amount, note, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(80),
      [] as any[]
    );

    const productions = await safeTable(
      () => supabase
        .from("production_requests")
        .select("id, title, prompt, production_type, status, automation_status, package_id, estimated_credits, reserved_credits, final_video_url, created_at, updated_at, output_json")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(80),
      [] as any[]
    );

    const legacyVideoRequests = await safeTable(
      () => supabase
        .from("video_requests")
        .select("id, title, prompt, status, package_id, estimated_credits, final_video_url, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
      [] as any[]
    );

    const legalAcceptances = await safeTable(
      () => supabase
        .from("legal_acceptances")
        .select("id, production_id, version, accepted_at, ip_address, user_agent, production_type, package_id, title")
        .eq("user_id", userId)
        .order("accepted_at", { ascending: false })
        .limit(20),
      [] as any[]
    );

    const incomingMessages = email
      ? await safeTable(
          () => supabase
            .from("lead_captures")
            .select("id, email, source, offer, status, page_url, metadata, created_at")
            .eq("email", email)
            .order("created_at", { ascending: false })
            .limit(30),
          [] as any[]
        )
      : [];

    const outgoingEmails = email
      ? await safeTable(
          () => supabase
            .from("admin_email_logs")
            .select("id, recipient_email, subject, body, status, created_at")
            .eq("recipient_email", email)
            .order("created_at", { ascending: false })
            .limit(30),
          [] as any[]
        )
      : [];

    const purchasedPackages = new Set<string>();
    let purchasedCredits = 0;
    let spentCredits = 0;
    for (const event of creditEvents) {
      const amount = Number(event.amount ?? 0) || 0;
      if (event.type === "purchase" || event.type === "adjustment") {
        if (amount > 0) purchasedCredits += amount;
        const packageId = noteValue(event.note, "package") || noteValue(event.note, "package_id");
        if (packageId) purchasedPackages.add(packageId);
      }
      if (event.type === "spend") spentCredits += Math.abs(amount);
    }

    const balanceTotal = Number(balance?.balance ?? 0) || 0;
    const reserved = Number(balance?.reserved ?? 0) || 0;
    const latestLegal = legalAcceptances[0] ?? null;

    return Response.json({
      user: {
        id: userId,
        name: String(profile?.full_name || authUser?.user_metadata?.full_name || email.split("@")[0] || "Unnamed user"),
        email,
        role: profile?.role ?? "user",
        provider: authUser?.app_metadata?.provider ?? "email",
        email_confirmed: Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at),
        created_at: profile?.created_at ?? authUser?.created_at ?? null,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        banned_until: authUser?.banned_until ?? null,
        country: String(authUser?.user_metadata?.country ?? latestLegal?.country ?? "Unknown"),
        city: String(authUser?.user_metadata?.city ?? "Unknown"),
        ip: latestLegal?.ip_address ?? "IP later",
        credits: balanceTotal,
        reserved,
        available: balanceTotal - reserved,
        bonus_credits: Number(balance?.bonus_credits ?? 0) || 0,
        credit_value_usd: estimateCreditValueUsd(balanceTotal),
        purchased_credits: purchasedCredits,
        spent_credits: spentCredits,
        purchased_packages: Array.from(purchasedPackages),
        balance_updated_at: balance?.updated_at ?? null
      },
      creditEvents,
      productions,
      legacyVideoRequests,
      legalAcceptances,
      incomingMessages,
      outgoingEmails
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load user detail.";
    return Response.json({ error: message }, { status: 500 });
  }
}
