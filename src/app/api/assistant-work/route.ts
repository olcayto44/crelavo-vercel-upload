import { NextRequest, NextResponse } from "next/server";
import { handleAssistantWork } from "@/lib/assistant-work/core";
import { runMediaEngine } from "@/lib/assistant-work/runMediaEngine";
import { isLocalCategory, runLocalEngine } from "@/lib/assistant-work/runLocalEngine";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
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

    const prompt = String(body.prompt || "");
    const type = String(body.type || "");
    const category = String(body.category || "");
    const scene = String(body.scene || "01");
    const action = String(body.action || "revise");

    if (isLocalCategory(category, type)) {
      const local = await runLocalEngine({ action, prompt, type, category, scene });
      if (!local.ok) {
        return NextResponse.json(local, { status: 400 });
      }

      if (local.spend) {
        const balanceResult = await handleAssistantWork(req, { action: "balance" });
        const balancePayload = balanceResult.payload as Record<string, unknown>;
        const balance = Number(balancePayload.balance || 0);
        if (balanceResult.status !== 200 || !Number.isFinite(balance) || balance <= 0) {
          return NextResponse.json(
            { ok: false, spend: false, code: "insufficient_credits", message: "Not enough credits." },
            { status: 402 },
          );
        }

        const spent = await supabase.rpc("assistant_work_spend", {
          p_user_id: user.id,
          p_category: category,
          p_action: action,
        });
        if (spent.error) {
          return NextResponse.json(
            { ok: false, spend: false, code: "insufficient_credits", message: spent.error.message },
            { status: 402 },
          );
        }
      }

      return NextResponse.json(local);
    }

    const result = await runMediaEngine({ category, type, prompt, scene });
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  }

  const out = await handleAssistantWork(req, body || {});
  return NextResponse.json(out.payload, { status: out.status });
}
