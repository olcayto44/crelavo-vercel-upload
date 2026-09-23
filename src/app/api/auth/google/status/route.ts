import { NextResponse } from "next/server";
export async function GET() {
  const ready = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return NextResponse.json({ ready, reason: ready ? undefined : "missing_google_env" });
}
