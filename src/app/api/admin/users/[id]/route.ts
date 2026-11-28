import { requireAdminPermission } from "@/lib/admin-guard";
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
  const access = await requireAdminPermission(request, "owner");
  if (!access.ok) return access.response;

  const { id } = await params;
  const userId = String(id ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return Response.json({ error: "User id is required." }, { status: 400 });

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
      () => supabase.from("credit_balances").select("user_id, balance, reserved, bonus_credits, current_subscription_credits, rolled_over_credits, topup_credits, updated_at, subscription_status, billing_cycle_ends_at, active_subscription_package, active_subscription_billing").eq("user_id", userId).maybeSingle(),
      null as any
    );

    const ipHistory = await safeTable(() => supabase.from("user_ips").select("id,ip,user_agent,seen_at").eq("user_id", userId).order("seen_at", { ascending: false }).limit(50), [] as any[]);
    const paymentFulfillments = await safeTable(() => supabase.from("payment_fulfillments").select("id,whop_payment_id,plan_id,product_title,amount_usd,credits,status,billing_reason,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50), [] as any[]);
    const creditEvents = await safeTable(
      () => supabase.from("credit_events").select("id, user_id, type, amount, note, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(80),
      [] as any[]
    );

    const productions = await safeTable(
      () => supabase
        .from("production_requests")
        .select("id, title, prompt, production_type, status, automation_status, package_id, estimated_credits, reserved_credits, delivery_link, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(80),
      [] as any[]
    );

    const legacyVideoRequests = await safeTable(
      () => supabase
        .from("video_requests")
        .select("id, title, prompt, status, estimated_credits, final_video_url, created_at, updated_at")
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

    // Exact totals are separate from the bounded recent-history tables.
    async function exactTotal(table:"credit_events"|"payment_fulfillments",field:"amount"|"amount_usd"|"credits",filter:string,value:string,absolute=false){
      try{const r=await supabase.from(table).select(field,{count:"exact"}).eq("user_id",userId).eq(filter,value).limit(1000);
       if(r.error||!r.data||r.count!==r.data.length)return null;
       const values=(r.data as unknown as Record<string,unknown>[]).map(x=>x[field]);
       if(values.some(x=>x===null||x===""||!Number.isFinite(Number(x))))return null;
       return values.reduce<number>((a,x)=>a+(absolute?Math.abs(Number(x)):Number(x)),0);
      }catch{return null}
    }
    const [totalBought,totalSpent,totalPaid,totalPaidCredits,stageResult,ledgerResult,presenceResult]=await Promise.all([
      exactTotal("credit_events","amount","type","purchase"),exactTotal("credit_events","amount","type","spend",true),
      exactTotal("payment_fulfillments","amount_usd","status","fulfilled"),exactTotal("payment_fulfillments","credits","status","fulfilled"),
      supabase.from("studio_stage_jobs").select("id,category,title,state,total_credits,spent_credits,created_at,updated_at",{count:"exact"}).eq("user_id",userId).order("created_at",{ascending:false}).limit(80),
      supabase.from("credit_ledger").select("id,delta,reason,job_id,created_at",{count:"exact"}).eq("user_id",userId).order("created_at",{ascending:false}).limit(80),
      supabase.from("presence").select("ip,country,path,seen_at").eq("user_id",userId).order("seen_at",{ascending:false}).limit(1).maybeSingle()
    ]);
    const purchasedPackages = new Set<string>();
    let purchasedCredits = 0;
    let spentCredits = 0;
    for (const event of creditEvents) {
      const amount = Number(event.amount ?? 0) || 0;
      if (event.type === "purchase") {
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
        created_at: authUser?.created_at ?? profile?.created_at ?? null,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        banned_until: authUser?.banned_until ?? null,
        country: String(presenceResult.data?.country ?? authUser?.user_metadata?.country ?? "Unknown"),
        city: String(authUser?.user_metadata?.city ?? "Unknown"),
        ip: ipHistory[0]?.ip ?? presenceResult.data?.ip ?? latestLegal?.ip_address ?? "—",
        credits: balanceTotal,
        reserved,
        available: balanceTotal - reserved,
        bonus_credits: Number(balance?.bonus_credits ?? 0) || 0,
        credit_value_usd: estimateCreditValueUsd(balanceTotal),
        purchased_credits: totalBought,
        paid_usd:totalPaid,paid_credits:totalPaidCredits,balance_verified:Boolean(balance),subscription_credits:balance?.current_subscription_credits??null,rollover_credits:balance?.rolled_over_credits??null,topup_credits:balance?.topup_credits??null,
        subscription_status:balance?.subscription_status??null,
        subscription_package:balance?.active_subscription_package??null,
        subscription_billing:balance?.active_subscription_billing??null,
        subscription_cycle_end:balance?.billing_cycle_ends_at??null,
        spent_credits: totalSpent,
        purchased_packages: Array.from(purchasedPackages),
        balance_updated_at: balance?.updated_at ?? null
      },
      creditEvents,
      stageJobs:stageResult.error?null:stageResult.data,stageCount:stageResult.error?null:stageResult.count,
      ledger:ledgerResult.error?null:ledgerResult.data,ledgerCount:ledgerResult.error?null:ledgerResult.count,
      ipHistory,
      paymentFulfillments,
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
