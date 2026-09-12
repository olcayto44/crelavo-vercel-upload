import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { GET as creditsGet } from "../route";

export const dynamic = "force-dynamic";

type Snap = {
  available: number;
  reserved: number;
  raw: Record<string, unknown>;
};

const WALLET_CANDIDATES = [
  { table: "credit_balances", userCol: "user_id", availCol: "balance", reservedCol: "reserved", gross: true },
  { table: "credit_wallets", userCol: "user_id", availCol: "available", reservedCol: "reserved", gross: false },
  { table: "credit_accounts", userCol: "user_id", availCol: "available", reservedCol: "reserved", gross: false },
  { table: "credits", userCol: "user_id", availCol: "available", reservedCol: "reserved", gross: false },
  { table: "user_credits", userCol: "user_id", availCol: "available", reservedCol: "reserved", gross: false },
  { table: "profiles", userCol: "id", availCol: "available", reservedCol: "reserved", gross: false },
  { table: "profiles", userCol: "id", availCol: "credits", reservedCol: "reserved_credits", gross: false },
  { table: "profiles", userCol: "id", availCol: "credit_balance", reservedCol: "reserved_credits", gross: false },
] as const;

function envUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
}
function envAnon() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
}
function envService() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
}
function n(v: unknown) {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

function userClient(token: string) {
  return createClient(envUrl(), envAnon(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
function adminClient() {
  const key = envService();
  if (!envUrl() || !key) return null;
  return createClient(envUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function requireUser(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "User session is required.", status: 401 as const };
  const sb = createClient(envUrl(), envAnon(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return { error: "Authenticated session is required.", status: 401 as const };
  }
  return { user: data.user, token };
}

async function snapshot(req: Request, userId: string): Promise<Snap> {
  const url = new URL(req.url);
  url.pathname = "/api/credits";
  url.search = "user_id=" + encodeURIComponent(userId);
  const res = await creditsGet(new Request(url.toString(), { headers: req.headers }));
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = new Error(String(raw.error || "credits_snapshot_failed"));
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return {
    available: n(raw.available) ?? n(raw.balance) ?? n(raw.credits) ?? 0,
    reserved: n(raw.reserved) ?? 0,
    raw,
  };
}

function payload(snap: Snap, extra: Record<string, unknown> = {}) {
  return {
    ok: true,
    available: snap.available,
    reserved: snap.reserved,
    balance: snap.available,
    credits: snap.available,
    ...extra,
  };
}

async function findWallet(sb: SupabaseClient, userId: string, snap: Snap) {
  const hits: Array<(typeof WALLET_CANDIDATES)[number] & { row: Record<string, unknown> }> = [];
  for (const c of WALLET_CANDIDATES) {
    const { data, error } = await sb
      .from(c.table)
      .select("*")
      .eq(c.userCol, userId)
      .limit(1)
      .maybeSingle();
    if (error || !data) continue;
    const avail = n((data as Record<string, unknown>)[c.availCol]);
    const reserved = n((data as Record<string, unknown>)[c.reservedCol]) ?? 0;
    const matches = c.gross ? avail != null && avail - reserved === snap.available : avail === snap.available;
    if (matches && reserved === snap.reserved) {
      hits.push({ ...c, row: data as Record<string, unknown> });
    }
  }
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {
    const pref = ["credit_balances", "credit_wallets", "credit_accounts", "credits", "user_credits", "profiles"];
    hits.sort((a, b) => pref.indexOf(a.table) - pref.indexOf(b.table));
    return hits[0];
  }
  return null;
}

function ledgerKey(session: string) {
  return session ? `assistant-download:${session}` : "";
}

async function markLedger(
  sb: SupabaseClient,
  row: { user_id: string; amount: number; session: string; type: string }
) {
  const key = ledgerKey(row.session);
  const { error: eventError } = await sb.from("credit_events").insert({
    user_id: row.user_id,
    amount: row.amount,
    type: "spend",
    note: `assistant_download:${row.type || "unknown"}`,
    stripe_session_id: key || null,
  });
  if (!eventError) return true;

  const tables = ["credit_transactions", "credit_ledger", "assistant_credit_spends"];
  for (const table of tables) {
    const { error } = await sb.from(table).insert({
      user_id: row.user_id,
      amount: row.amount,
      session: row.session,
      type: row.type,
      reason: "assistant_download",
    });
    if (!error) return true;
  }
  return false;
}

async function alreadySpent(sb: SupabaseClient, userId: string, session: string) {
  if (!session) return false;
  const key = ledgerKey(session);
  const { data: events, error: eventError } = await sb
    .from("credit_events")
    .select("id")
    .eq("user_id", userId)
    .eq("stripe_session_id", key)
    .limit(1);
  if (!eventError && events && events.length) return true;

  const tables = ["credit_transactions", "credit_ledger", "assistant_credit_spends"];
  for (const table of tables) {
    const { data, error } = await sb
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .eq("session", session)
      .limit(1);
    if (!error && data && data.length) return true;
  }
  return false;
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  if (body.user_id && String(body.user_id) !== auth.user.id) {
    return NextResponse.json({ error: "Authenticated session is required." }, { status: 401 });
  }

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
    return NextResponse.json({ error: "amount must be a credit integer." }, { status: 400 });
  }

  const session = String(body.session || "");
  const type = String(body.type || "");
  const sbUser = userClient(auth.token);
  const sbAdmin = adminClient();

  let snap: Snap;
  try {
    snap = await snapshot(req, auth.user.id);
  } catch (e) {
    const status = Number((e as { status?: number }).status) || 401;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "credits_snapshot_failed" },
      { status }
    );
  }

  if (amount === 0) {
    return NextResponse.json(payload(snap, { spent: 0, skipped: true }));
  }

  const prior =
    (await alreadySpent(sbUser, auth.user.id, session)) ||
    (sbAdmin ? await alreadySpent(sbAdmin, auth.user.id, session) : false);
  if (prior) {
    return NextResponse.json(payload(snap, { spent: 0, idempotent: true }));
  }

  if (snap.available < amount) {
    return NextResponse.json(
      {
        ok: false,
        error: "Not enough credits.",
        available: snap.available,
        reserved: snap.reserved,
        balance: snap.available,
        credits: snap.available,
        needed: amount,
      },
      { status: 402 }
    );
  }

  const wallet =
    (await findWallet(sbUser, auth.user.id, snap)) ||
    (sbAdmin ? await findWallet(sbAdmin, auth.user.id, snap) : null);
  if (!wallet) {
    return NextResponse.json(
      { error: "credit_wallet_not_found", available: snap.available, reserved: snap.reserved },
      { status: 500 }
    );
  }

  const nextAvail = snap.available - amount;
  const nextStored = wallet.gross ? nextAvail + snap.reserved : nextAvail;
  const currentStored = n(wallet.row[wallet.availCol]);
  const writer = sbAdmin || sbUser;
  let update = writer
    .from(wallet.table)
    .update({ [wallet.availCol]: nextStored })
    .eq(wallet.userCol, auth.user.id);
  if (currentStored != null) update = update.eq(wallet.availCol, currentStored);
  const { data: updated, error } = await update.select(wallet.userCol).maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message || "credit_spend_failed" }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "credit_balance_changed", message: "Credit balance changed. Try again." }, { status: 409 });
  }

  await markLedger(writer, {
    user_id: auth.user.id,
    amount,
    session,
    type,
  });

  let after: Snap;
  try {
    after = await snapshot(req, auth.user.id);
  } catch {
    after = { available: nextAvail, reserved: snap.reserved, raw: {} };
  }

  return NextResponse.json(payload(after, { spent: amount, session, type }));
}
