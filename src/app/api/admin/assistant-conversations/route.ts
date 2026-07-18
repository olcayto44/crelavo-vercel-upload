import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

const allowedAdminStatuses = ["new", "reviewed", "needs_follow_up", "converted_to_request", "closed"];

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = String(searchParams.get("conversation_id") ?? "").trim();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return Response.json({ conversations: [], messages: [], mode: "mock" });
    }

    const supabase = supabaseAdmin();

    if (conversationId) {
      const { data: conversation, error: conversationError } = await supabase
        .from("assistant_conversations")
        .select("id, user_id, user_email, title, channel, admin_status, admin_notes, metadata, created_at, updated_at")
        .eq("id", conversationId)
        .maybeSingle();
      if (conversationError) throw conversationError;

      const { data: messages, error: messagesError } = await supabase
        .from("assistant_messages")
        .select("id, role, content, mode, language, metadata, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (messagesError) throw messagesError;

      return Response.json({ conversation, messages: messages ?? [] });
    }

    const { data: conversations, error } = await supabase
      .from("assistant_conversations")
      .select("id, user_id, user_email, title, channel, admin_status, admin_notes, metadata, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    return Response.json({ conversations: conversations ?? [] });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not load assistant conversations") }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const id = clean(body.id);
  const adminStatus = clean(body.admin_status || "new");
  const adminNotes = clean(body.admin_notes);

  if (!id) return Response.json({ error: "Conversation id is required." }, { status: 400 });
  if (!allowedAdminStatuses.includes(adminStatus)) return Response.json({ error: "Invalid assistant conversation status." }, { status: 400 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ conversation: { id, admin_status: adminStatus, admin_notes: adminNotes, updated_at: new Date().toISOString() }, mode: "mock" });
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("assistant_conversations")
      .update({ admin_status: adminStatus, admin_notes: adminNotes || null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, user_id, user_email, title, channel, admin_status, admin_notes, metadata, created_at, updated_at")
      .single();
    if (error) throw error;
    return Response.json({ conversation: data });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not update assistant conversation") }, { status: 500 });
  }
}
