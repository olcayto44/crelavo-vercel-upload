import { NextRequest, NextResponse } from "next/server";
import { handleAssistantWork } from "@/lib/assistant-work/core";
import {
  isLocalCategory,
  isCopyLayoutColorOnly as isLocalCopyOnly,
  runLocalEngine,
} from "@/lib/assistant-work/runLocalEngine";
import {
  getCategoryEngine,
  engineConfigured,
  expectsSpend,
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

    const requireBalance = async () => {
      const balanceResult = await handleAssistantWork(req, { action: "balance" });
      const balancePayload = balanceResult.payload as Record<string, unknown>;
      const balance = Number(balancePayload.balance || 0);
      return balanceResult.status === 200 && Number.isFinite(balance) && balance > 0;
    };

    const spend = async () =>
      supabase.rpc("assistant_work_spend", {
        p_user_id: user.id,
        p_category: category,
        p_action: action,
      });

    if (isLocalCategory(category, type)) {
      const local = await runLocalEngine({ prompt, type, category, scene, action });
      if (!local.ok) return NextResponse.json(local, { status: 400 });
      if (local.spend) {
        if (!(await requireBalance())) {
          return NextResponse.json(
            { ok: false, spend: false, code: "insufficient_credits", message: "Not enough credits." },
            { status: 402 },
          );
        }
        const spent = await spend();
        if (spent.error) {
          return NextResponse.json(
            { ok: false, spend: false, code: "insufficient_credits", message: spent.error.message },
            { status: 402 },
          );
        }
      }
      return NextResponse.json(local);
    }

    if (!getCategoryEngine(category)) {
      return NextResponse.json(
        { ok: false, code: "unknown_category", message: "Unknown category." },
        { status: 400 },
      );
    }

    if (!engineConfigured(category)) {
      return NextResponse.json(
        { ok: false, code: "engine_not_configured", message: "Engine key missing on this host." },
        { status: 503 },
      );
    }

    if (expectsSpend(category, prompt) && !(await requireBalance())) {
      return NextResponse.json(
        { ok: false, spend: false, code: "insufficient_credits", message: "Not enough credits." },
        { status: 402 },
      );
    }

    const media = await runMediaEngine({ prompt, type, category, scene });
    if (!media.ok) return NextResponse.json(media, { status: 400 });
    if (media.spend) {
      const spent = await spend();
      if (spent.error) {
        return NextResponse.json(
          { ok: false, spend: false, code: "insufficient_credits", message: spent.error.message },
          { status: 402 },
        );
      }
    }
    return NextResponse.json(media);
  }

  const out = await handleAssistantWork(req, body || {});
  return NextResponse.json(out.payload, { status: out.status });
}
