import { NextResponse } from "next/server";
import { GET as creditsGet } from "../route";

export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function GET(req: Request) {
  const res = await creditsGet(req);
  const j = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) return NextResponse.json(j, { status: res.status });
  const available =
    num(j.available) ?? num(j.balance) ?? num(j.credits) ?? 0;
  const reserved = num(j.reserved) ?? 0;
  return NextResponse.json(
    {
      ...j,
      ok: true,
      available,
      reserved,
      balance: available,
      credits: available,
    },
    { status: 200 }
  );
}
