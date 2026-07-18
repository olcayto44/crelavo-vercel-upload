import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

function estimateCreditValueUsd(credits: number) {
  if (credits <= 0) return 0;
  return Math.round((credits / 2500) * 29);
}

function banUntilFromHours(hours: number) {
  return new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1000).toISOString();
}

function withinDays(date: string | null | undefined, days: number) {
  if (!date) return false;
  const created = new Date(date).getTime();
  const start = Date.now() - days * 24 * 60 * 60 * 1000;
  return Number.isFinite(created) && created >= start;
}

function noteValue(note: string | null | undefined, key: string) {
  const parts = String(note ?? "").split("|").map((item) => item.trim());
  const match = parts.find((item) => item.toLowerCase().startsWith(`${key.toLowerCase()}=`));
  return match ? match.slice(key.length + 1).trim() : "";
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const supabase = supabaseAdmin();
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (profilesError) throw profilesError;

    const userIds = (profiles ?? []).map((profile) => profile.id);
    const { data: balances, error: balancesError } = userIds.length > 0
      ? await supabase.from("credit_balances").select("user_id, balance, reserved, updated_at").in("user_id", userIds)
      : { data: [], error: null };

    if (balancesError) throw balancesError;

    const { data: acceptances, error: acceptancesError } = userIds.length > 0
      ? await supabase.from("legal_acceptances").select("id, user_id, production_id, version, accepted_at, ip_address, user_agent, production_type, package_id, title, responsibility_text, rights_warranty_text").in("user_id", userIds).order("accepted_at", { ascending: false })
      : { data: [], error: null };

    if (acceptancesError) throw acceptancesError;

    const acceptanceMap = new Map<string, { latest: any; count: number }>();
    for (const acceptance of acceptances ?? []) {
      const current = acceptanceMap.get(acceptance.user_id) ?? { latest: acceptance, count: 0 };
      acceptanceMap.set(acceptance.user_id, { latest: current.latest, count: current.count + 1 });
    }

    const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (authUsersError) throw authUsersError;
    const authUserMap = new Map((authUsersData.users ?? []).map((user) => [user.id, user]));

    const { data: creditEvents, error: creditEventsError } = userIds.length > 0
      ? await supabase.from("credit_events").select("user_id, type, amount, note, created_at").in("user_id", userIds).order("created_at", { ascending: false })
      : { data: [], error: null };

    if (creditEventsError) throw creditEventsError;

    const financeMap = new Map<string, { totalRevenueUsd: number; todayRevenueUsd: number; weeklyRevenueUsd: number; monthlyRevenueUsd: number; spentCredits: number; packageNames: Set<string>; latestPurchaseAt: string | null }>();
    for (const event of creditEvents ?? []) {
      const userId = String(event.user_id ?? "");
      if (!userId) continue;
      const current = financeMap.get(userId) ?? { totalRevenueUsd: 0, todayRevenueUsd: 0, weeklyRevenueUsd: 0, monthlyRevenueUsd: 0, spentCredits: 0, packageNames: new Set<string>(), latestPurchaseAt: null };
      const amount = Number(event.amount ?? 0) || 0;
      if (event.type === "purchase") {
        const revenueUsd = estimateCreditValueUsd(amount);
        current.totalRevenueUsd += revenueUsd;
        if (withinDays(event.created_at, 1)) current.todayRevenueUsd += revenueUsd;
        if (withinDays(event.created_at, 7)) current.weeklyRevenueUsd += revenueUsd;
        if (withinDays(event.created_at, 30)) current.monthlyRevenueUsd += revenueUsd;
        const packageId = noteValue(event.note, "package");
        if (packageId) current.packageNames.add(packageId);
        if (!current.latestPurchaseAt || new Date(event.created_at).getTime() > new Date(current.latestPurchaseAt).getTime()) current.latestPurchaseAt = event.created_at;
      }
      if (event.type === "spend") current.spentCredits += amount;
      financeMap.set(userId, current);
    }

    const balanceMap = new Map((balances ?? []).map((balance) => [balance.user_id, balance]));
    const users = (profiles ?? []).map((profile) => {
      const balance = balanceMap.get(profile.id);
      const authUser = authUserMap.get(profile.id);
      const credits = balance?.balance ?? 0;
      const legal = acceptanceMap.get(profile.id);
      const provider = authUser?.app_metadata?.provider ?? "email";
      const emailConfirmed = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
      const latestLegal = legal?.latest ?? null;
      const finance = financeMap.get(profile.id);
      return {
        id: profile.id,
        name: profile.full_name || String(authUser?.user_metadata?.full_name ?? "") || profile.email?.split("@")[0] || "Unnamed user",
        email: profile.email,
        ip: latestLegal?.ip_address ?? "IP later",
        country: String(authUser?.user_metadata?.country ?? "Unknown"),
        city: String(authUser?.user_metadata?.city ?? "Unknown"),
        role: profile.role,
        provider,
        email_confirmed: emailConfirmed,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        credits,
        reserved: balance?.reserved ?? 0,
        available: credits - (balance?.reserved ?? 0),
        value: `$${estimateCreditValueUsd(credits)}`,
        created_at: profile.created_at ?? authUser?.created_at ?? null,
        updated_at: balance?.updated_at ?? null,
        legal_acceptance_count: legal?.count ?? 0,
        latest_legal_acceptance: latestLegal,
        banned_until: authUser?.banned_until ?? null,
        finance_summary: {
          total_revenue_usd: finance?.totalRevenueUsd ?? 0,
          today_revenue_usd: finance?.todayRevenueUsd ?? 0,
          weekly_revenue_usd: finance?.weeklyRevenueUsd ?? 0,
          monthly_revenue_usd: finance?.monthlyRevenueUsd ?? 0,
          spent_credits: finance?.spentCredits ?? 0,
          purchased_packages: Array.from(finance?.packageNames ?? []),
          latest_purchase_at: finance?.latestPurchaseAt ?? null
        }
      };
    });

    return Response.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load users";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const body = await request.json();
    const userId = String(body.user_id ?? "").trim();
    const action = String(body.action ?? "").trim();
    const banHours = Number(body.ban_hours ?? 24) || 24;

    if (!userId) return Response.json({ error: "User id is required." }, { status: 400 });

    const supabase = supabaseAdmin();

    if (action === "delete_user") {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      await supabase.from("profiles").delete().eq("id", userId);
      return Response.json({ ok: true, message: "User deleted." });
    }

    if (action === "suspend_user" || action === "timed_ip_ban") {
      const bannedUntil = banUntilFromHours(banHours);
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: `${Math.max(1, banHours)}h`,
        user_metadata: {
          admin_status: action === "timed_ip_ban" ? "timed_ip_ban" : "suspended",
          admin_banned_until: bannedUntil,
          admin_ban_note: String(body.note ?? "Admin action")
        }
      });
      if (error) throw error;
      return Response.json({ ok: true, message: action === "timed_ip_ban" ? "Timed IP/user ban applied." : "User suspended.", user: data.user });
    }

    if (action === "unsuspend_user") {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "none",
        user_metadata: {
          admin_status: "active",
          admin_banned_until: null,
          admin_ban_note: String(body.note ?? "Admin unblocked user")
        }
      });
      if (error) throw error;
      return Response.json({ ok: true, message: "User unblocked.", user: data.user });
    }

    return Response.json({ error: "Unknown admin user action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "User action failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
