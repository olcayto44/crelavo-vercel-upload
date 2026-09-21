import { NextRequest, NextResponse } from "next/server";
import { chargeCredits, handleAssistantWork, quote } from "@/lib/assistant-work/core";
import {
  isLocalCategory,
  isCopyLayoutColorOnly as isLocalCopyOnly,
  runLocalEngine,
} from "@/lib/assistant-work/runLocalEngine";
import {
  engineConfigured,
  getCategoryEngine,
  runMediaEngine,
  isCopyLayoutColorOnly,
} from "@/lib/assistant-work/runMediaEngine";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const out = await handleAssistantWork(req, { action: "balance" });
  return NextResponse.json(out.payload, { status: out.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body && typeof body === "object" && typeof body.prompt === "string") {
    const token = bearerTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { ok: false, spend: false, code: "sign_in", message: "Sign in to start production." },
        { status: 401 },
      );
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    const user = data.user;
    if (error || !user) {
      return NextResponse.json(
        { ok: false, spend: false, code: "sign_in", message: "Sign in to start production." },
        { status: 401 },
      );
    }

    const category = String(body.category || "").trim();
    const prompt = String(body.prompt || "").trim();
    const type = String(body.type || "");
    const scene = String(body.scene || "01");
    const action = String(body.action || "revise");

    if (!prompt) {
      return NextResponse.json(
        { ok: false, code: "empty_prompt", message: "Write something first." },
        { status: 400 },
      );
    }

    if (isLocalCopyOnly(prompt) || isCopyLayoutColorOnly(prompt)) {
      if (isLocalCategory(category, type)) {
        const local = await runLocalEngine({ prompt, type, category, scene, action });
        return NextResponse.json({ ...local, spend: false });
      }
      const copy = await runMediaEngine({ prompt, type, category, scene });
      return NextResponse.json({ ...copy, spend: false });
    }

    const priced = quote(category, [], "revise", prompt);
    const balanceResult = await handleAssistantWork(req, { action: "balance" });
    const available = Number((balanceResult.payload as Record<string, unknown>).balance ?? 0);
    if (priced.credits > 0 && available < priced.credits) {
      return NextResponse.json({ ok: false, spend: false, code: "insufficient", message: `Not enough credits. Need ${priced.credits}. Balance ${available}.`, balance: available, need: priced.credits }, { status: 402 });
    }

    let result;
    if (isLocalCategory(category, type)) {
      result = await runLocalEngine({ prompt, type, category, scene, action });
    } else {
      if (!getCategoryEngine(category)) return NextResponse.json({ ok: false, spend: false, code: "unknown_category", message: "Unknown production category." }, { status: 400 });
      if (!engineConfigured(category)) return NextResponse.json({ ok: false, spend: false, code: "engine_not_configured", message: "The selected provider is not configured on this host." }, { status: 503 });
      result = await runMediaEngine({ prompt, type, category, scene });
    }
    if (!result.ok) return NextResponse.json(result, { status: 400 });

    let balance = available;
    let charged = 0;
    const providerTaskId = "taskId" in result ? result.taskId : undefined;
    if (result.spend && priced.credits > 0) {
      const paid = await chargeCredits(user.id, priced.credits, `assistant_revise:${category}:${providerTaskId ?? scene}`);
      if (!paid.ok) return NextResponse.json({ ok: false, spend: false, code: paid.code, message: paid.message || "Credit charge failed.", balance: paid.available, providerTaskId: providerTaskId ?? null }, { status: paid.code === "insufficient" ? 402 : 500 });
      balance = paid.available;
      charged = priced.credits;
    }
    return NextResponse.json({ ...result, balance, charged });
  }

  const out = await handleAssistantWork(req, body || {});
  return NextResponse.json(out.payload, { status: out.status });
}
