import { NextResponse } from "next/server";
import { clearSession } from "@/lib/crelavo/sessionCookie";
export async function POST() { await clearSession(); return NextResponse.json({ ok: true }); }
