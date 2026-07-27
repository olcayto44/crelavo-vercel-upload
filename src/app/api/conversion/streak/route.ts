import { supabaseAdmin } from "@/lib/supabase";

function cleanEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase().slice(0, 180);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayIsoDay() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return isoDay(date);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = cleanEmail(body.email);
  const consent = body.consent === true;
  const action = String(body.action ?? "daily_visit").trim().slice(0, 80) || "daily_visit";

  if (!consent || !isEmail(email)) {
    return Response.json({ error: "Email and consent are required for streak tracking." }, { status: 400 });
  }

  try {
    const today = isoDay();
    const supabase = supabaseAdmin();
    const { data: existing, error: readError } = await supabase
      .from("lead_captures")
      .select("id, metadata")
      .eq("email", email)
      .eq("source", "daily_streak")
      .maybeSingle();

    if (readError) throw readError;
    const metadata = existing?.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
    const lastClaimDay = String(metadata.lastClaimDay ?? "");
    const currentStreak = Number(metadata.currentStreak ?? 0);
    const totalCheckins = Number(metadata.totalCheckins ?? 0);
    const alreadyCheckedInToday = lastClaimDay === today;
    const nextStreak = alreadyCheckedInToday ? currentStreak : lastClaimDay === yesterdayIsoDay() ? currentStreak + 1 : 1;
    const nextTotal = alreadyCheckedInToday ? totalCheckins : totalCheckins + 1;
    const pendingRewardCredits = nextStreak >= 30 ? 500 : nextStreak >= 7 ? 100 : 0;

    const nextMetadata = {
      ...metadata,
      action,
      lastClaimDay: today,
      currentStreak: nextStreak,
      totalCheckins: nextTotal,
      alreadyCheckedInToday,
      pendingRewardCredits,
      rewardStatus: pendingRewardCredits > 0 ? "manual_review_required" : "tracking_only",
      guardrail: "Streak rewards create reviewable records only; no automatic credit minting without abuse and account checks.",
      updatedAt: new Date().toISOString()
    };

    const payload = {
      email,
      source: "daily_streak",
      offer: "daily_ai_ad_scorer_streak",
      status: pendingRewardCredits > 0 ? "pending_reward_review" : "active",
      consent: true,
      bonus_credits: pendingRewardCredits,
      metadata: nextMetadata
    };

    const { error: upsertError } = await supabase.from("lead_captures").upsert(payload, { onConflict: "email,source" });
    if (upsertError) throw upsertError;

    return Response.json({
      ok: true,
      streak: nextStreak,
      totalCheckins: nextTotal,
      alreadyCheckedInToday,
      pendingRewardCredits,
      rewardStatus: nextMetadata.rewardStatus,
      message: pendingRewardCredits > 0
        ? `Your ${nextStreak}-day streak is recorded for manual reward review.`
        : `Your ${nextStreak}-day Crelavo streak is recorded.`
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not record streak." }, { status: 500 });
  }
}
