import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const STATE_MARKER = "assistant_project_state";

async function currentUser(req: NextRequest) {
  const token = bearerTokenFromRequest(req);
  if (!token) return null;
  const supabase = supabaseAdmin();
  const auth = await supabase.auth.getUser(token);
  return auth.error || !auth.data.user ? null : { supabase, user: auth.data.user };
}

export async function GET(req: NextRequest) {
  const session = await currentUser(req);
  if (!session) return NextResponse.json({ ok: false, code: "sign_in" }, { status: 401 });
  const { data, error } = await session.supabase
    .from("assistant_messages")
    .select("metadata,created_at")
    .eq("user_id", session.user.id)
    .eq("role", "system")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ ok: false, code: "project_read_failed", message: error.message }, { status: 500 });
  const row = (data || []).find((item: any) => item?.metadata?.source === STATE_MARKER);
  return NextResponse.json({ ok: true, state: row?.metadata?.state ?? null, updatedAt: row?.created_at ?? null });
}

export async function POST(req: NextRequest) {
  const session = await currentUser(req);
  if (!session) return NextResponse.json({ ok: false, code: "sign_in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const state = body?.state && typeof body.state === "object" ? body.state : null;
  if (!state) return NextResponse.json({ ok: false, code: "state_required" }, { status: 400 });
  const title = String(body?.title || "Website project").slice(0, 80);
  const conversation = await session.supabase.from("assistant_conversations").insert({ user_id: session.user.id, user_email: session.user.email || null, title, channel: "assistant_workspace" }).select("id").single();
  if (conversation.error || !conversation.data?.id) return NextResponse.json({ ok: false, code: "project_create_failed", message: conversation.error?.message || "Could not create project session." }, { status: 500 });
  const message = await session.supabase.from("assistant_messages").insert({ conversation_id: conversation.data.id, user_id: session.user.id, role: "system", content: "Assistant project state", mode: "production", language: "en", metadata: { source: STATE_MARKER, state } });
  if (message.error) return NextResponse.json({ ok: false, code: "project_save_failed", message: message.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, conversationId: conversation.data.id });
}
