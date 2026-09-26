import { requireAdminPermission } from "@/lib/admin-guard";
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

function meaningfulLocation(value: unknown) {
  const clean = String(value ?? "").trim();
  return clean && !/^(unknown|bilinmiyor|null|undefined|-)$/i.test(clean) ? clean : "";
}

function countryLabel(value: unknown) {
  const clean = meaningfulLocation(value);
  if (!clean) return "Bilinmiyor";
  if (/^[A-Za-z]{2}$/.test(clean)) {
    try { return new Intl.DisplayNames(["tr"], { type: "region" }).of(clean.toUpperCase()) || clean.toUpperCase(); } catch { return clean.toUpperCase(); }
  }
  return clean;
}

function dayKey(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
export async function GET(request: Request) {
  const access = await requireAdminPermission(request, ["users", "support", "finance"]);
  if (!access.ok) return access.response;

  try {
    const supabase = supabaseAdmin();
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (profilesError) throw profilesError;

    const authUsers: any[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;
      authUsers.push(...(data.users ?? []));
      if ((data.users ?? []).length < 100) break;
    }
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const mergedUserIds = Array.from(new Set([...(profiles ?? []).map((profile) => profile.id), ...authUsers.map((user) => user.id).filter(Boolean)]));
    const userIds = mergedUserIds;
    const { data: balances, error: balancesError } = userIds.length > 0
      ? await supabase.from("credit_balances").select("user_id, balance, reserved, updated_at").in("user_id", userIds)
      : { data: [], error: null };

    const safeBalances = balancesError ? [] : (balances ?? []);

    const { data: acceptances, error: acceptancesError } = userIds.length > 0
      ? await supabase.from("legal_acceptances").select("id, user_id, production_id, version, accepted_at, ip_address, user_agent, production_type, package_id, title, responsibility_text, rights_warranty_text").in("user_id", userIds).order("accepted_at", { ascending: false })
      : { data: [], error: null };

    const safeAcceptances = acceptancesError ? [] : (acceptances ?? []);
    const { data: ipRows } = userIds.length > 0 ? await supabase.from("user_ips").select("user_id,ip,seen_at").in("user_id", userIds).order("seen_at", { ascending: false }) : { data: [] };
    const { data: presenceRows } = userIds.length > 0 ? await supabase.from("presence").select("user_id,ip,country,seen_at").in("user_id", userIds).order("seen_at", { ascending: false }) : { data: [] };
    const latestIpMap = new Map<string, any>();
    for (const row of ipRows ?? []) if (row.user_id && !latestIpMap.has(row.user_id)) latestIpMap.set(row.user_id, row);
    const latestPresenceMap = new Map<string, any>();
    const latestCountryMap = new Map<string, string>();
    for (const row of presenceRows ?? []) {
      if (row.user_id && !latestPresenceMap.has(row.user_id)) latestPresenceMap.set(row.user_id, row);
      const country = meaningfulLocation(row.country);
      if (row.user_id && country && !latestCountryMap.has(row.user_id)) latestCountryMap.set(row.user_id, country);
    }

    const acceptanceMap = new Map<string, { latest: any; count: number }>();
    for (const acceptance of safeAcceptances) {
      const current = acceptanceMap.get(acceptance.user_id) ?? { latest: acceptance, count: 0 };
      acceptanceMap.set(acceptance.user_id, { latest: current.latest, count: current.count + 1 });
    }

    const authUserMap = new Map(authUsers.map((user) => [user.id, user]));
    const configuredAdminEmails = new Set(String(process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));

    const { data: creditEvents, error: creditEventsError } = userIds.length > 0
      ? await supabase.from("credit_events").select("user_id, type, amount, note, created_at").in("user_id", userIds).order("created_at", { ascending: false })
      : { data: [], error: null };

    const safeCreditEvents = creditEventsError ? [] : (creditEvents ?? []);

    const financeMap = new Map<string, { totalRevenueUsd: number; todayRevenueUsd: number; weeklyRevenueUsd: number; monthlyRevenueUsd: number; spentCredits: number; packageNames: Set<string>; latestPurchaseAt: string | null }>();
    for (const event of safeCreditEvents) {
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

    const balanceMap = new Map(safeBalances.map((balance) => [balance.user_id, balance]));
    const users = userIds.map((userId) => {
      const profile = profileMap.get(userId);
      const balance = balanceMap.get(userId);
      const authUser = authUserMap.get(userId);
      const credits = balance?.balance ?? 0;
      const legal = acceptanceMap.get(userId);
      const provider = authUser?.app_metadata?.provider ?? "email";
      const emailConfirmed = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
      const latestLegal = legal?.latest ?? null;
      const finance = financeMap.get(userId);
      const email = profile?.email || authUser?.email || "unknown@email";
      return {
        id: userId,
        name: profile?.full_name || String(authUser?.user_metadata?.full_name ?? "") || email.split("@")[0] || "Unnamed user",
        email,
        ip: latestIpMap.get(userId)?.ip ?? latestPresenceMap.get(userId)?.ip ?? latestLegal?.ip_address ?? "-",
        country: countryLabel(latestCountryMap.get(userId) || meaningfulLocation(authUser?.user_metadata?.country) || meaningfulLocation(authUser?.user_metadata?.country_code) || meaningfulLocation(authUser?.app_metadata?.country)),
        city: meaningfulLocation(authUser?.user_metadata?.city) || "Bilinmiyor",
        role: String(profile?.role ?? authUser?.user_metadata?.role ?? (configuredAdminEmails.has(email.toLowerCase()) ? "admin" : "user")),
        provider,
        email_confirmed: emailConfirmed,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        credits,
        reserved: balance?.reserved ?? 0,
        available: credits - (balance?.reserved ?? 0),
        value: `$${estimateCreditValueUsd(credits)}`,
        created_at: profile?.created_at ?? authUser?.created_at ?? null,
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

    users.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    const memberUsers = users.filter((user) => String(user.role).toLowerCase() !== "admin");
    const dailyCounts = new Map<string, number>();
    for (const user of memberUsers) {
      const key = dayKey(user.created_at);
      if (key) dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
    }
    const today = new Date();
    const daily = Array.from({ length: 14 }, (_, offset) => {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - offset);
      const dateKey = date.toISOString().slice(0, 10);
      return { date: dateKey, count: dailyCounts.get(dateKey) ?? 0 };
    });
    const last7Days = daily.slice(0, 7).reduce((total, item) => total + item.count, 0);

    return Response.json({ users, summary: { total_members: memberUsers.length, today_members: daily[0]?.count ?? 0, yesterday_members: daily[1]?.count ?? 0, last_7_days_members: last7Days, daily } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load users";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access = await requireAdminPermission(request, "users", body);
    if (!access.ok) return access.response;
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
