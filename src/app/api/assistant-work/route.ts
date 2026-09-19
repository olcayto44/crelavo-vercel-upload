import { NextRequest, NextResponse } from "next/server";
import { handleAssistantWork } from "@/lib/assistant-work/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const out = await handleAssistantWork(req, { action: "balance" });
  return NextResponse.json(out.payload, { status: out.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const out = await handleAssistantWork(req, body || {});
  return NextResponse.json(out.payload, { status: out.status });
}