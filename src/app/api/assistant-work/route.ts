import { NextRequest, NextResponse } from "next/server";
import { handleAssistantWork } from "@/lib/assistant-work/core";
import { runMediaEngine } from "@/lib/assistant-work/runMediaEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const out = await handleAssistantWork(req, { action: "balance" });
  return NextResponse.json(out.payload, { status: out.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body && typeof body === "object" && typeof body.prompt === "string") {
    const result = await runMediaEngine({
      category: typeof body.category === "string" ? body.category : undefined,
      type: typeof body.type === "string" ? body.type : undefined,
      prompt: body.prompt,
      scene: body.scene == null ? undefined : String(body.scene),
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  }

  const out = await handleAssistantWork(req, body || {});
  return NextResponse.json(out.payload, { status: out.status });
}
