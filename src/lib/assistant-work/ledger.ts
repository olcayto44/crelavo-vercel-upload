import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type LedgerSnapshot = {
  balance: number;
  reserved: number;
  available: number;
};

export type SpendResult =
  | { ok: true; code: "ok"; balance: number; reserved: number; available: number }
  | { ok: false; code: "insufficient" | "invalid_amount" | "schema" | "rpc_error"; balance: number; reserved: number; available: number; message?: string };

let client: SupabaseClient | null = null;

function service(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("assistant_work_ledger: missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function emptySnap(): LedgerSnapshot {
  return { balance: 0, reserved: 0, available: 0 };
}

function asRow<T>(data: T | T[] | null): T | null {
  if (data == null) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function ledgerReadSnapshot(userId: string): Promise<LedgerSnapshot> {
  const { data, error } = await service().rpc("assistant_work_balance", { p_user_id: userId });
  if (error) throw new Error(`assistant_work_balance: ${error.message}`);
  const row = asRow<{ balance: number; reserved: number; available: number }>(data);
  if (!row) return emptySnap();
  return { balance: num(row.balance), reserved: num(row.reserved), available: num(row.available) };
}

/** Available credits: balance - reserved. Missing row = 0. */
export async function ledgerRead(userId: string): Promise<number> {
  const snap = await ledgerReadSnapshot(userId);
  return snap.available;
}

export async function ledgerSpend(userId: string, amount: number, note?: string): Promise<SpendResult> {
  const { data, error } = await service().rpc("assistant_work_spend", {
    p_user_id: userId,
    p_amount: amount,
    p_note: note ?? null,
  });
  if (error) return { ok: false, code: "rpc_error", ...emptySnap(), message: error.message };

  const row = asRow<{ ok: boolean; code: string; balance: number | null; reserved: number | null; available: number | null; message?: string }>(data);
  if (!row) return { ok: false, code: "rpc_error", ...emptySnap(), message: "empty" };

  const snap = { balance: num(row.balance), reserved: num(row.reserved), available: num(row.available) };
  if (row.ok && (row.code === "ok" || row.code === "spend")) return { ok: true, code: "ok", ...snap };

  const code = row.code === "insufficient" ? "insufficient" : row.code === "invalid" || row.code === "invalid_amount" ? "invalid_amount" : row.code === "schema" ? "schema" : "rpc_error";
  return { ok: false, code, ...snap, message: row.message };
}
