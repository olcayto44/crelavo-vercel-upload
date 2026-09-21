import { NextRequest, NextResponse } from "next/server";
import { handleAssistantWork } from "@/lib/assistant-work/core";
import {
  isLocalCategory,
  isCopyLayoutColorOnly as isLocalCopyOnly,
  runLocalEngine,
} from "@/lib/assistant-work/runLocalEngine";
import {
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

    return NextResponse.json(
      {
        ok: false,
        spend: false,
        code: "production_pipeline_required",
        message: "Create the production through /api/productions so credits, provider jobs, status tracking and delivery remain connected.",
      },
      { status: 409 },
    );
  }

  const out = await handleAssistantWork(req, body || {});
  return NextResponse.json(out.payload, { status: out.status });
}
