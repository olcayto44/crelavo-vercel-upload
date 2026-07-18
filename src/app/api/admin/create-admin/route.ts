import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const fullName = String(body.full_name ?? body.fullName ?? "Admin User").trim() || "Admin User";

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Geçerli bir admin e-postası gerekli." }, { status: 400 });
  }

  if (!password || password.length < 10) {
    return Response.json({ error: "Admin şifresi en az 10 karakter olmalı." }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "admin"
      }
    });

    if (createError) throw createError;
    const user = created.user;
    if (!user?.id || !user.email) {
      return Response.json({ error: "Admin kullanıcısı oluşturulamadı." }, { status: 500 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email.toLowerCase(),
        full_name: fullName,
        role: "admin",
        created_at: user.created_at ?? new Date().toISOString()
      }, { onConflict: "id" });

    if (profileError) throw profileError;

    return Response.json({
      ok: true,
      admin: {
        id: user.id,
        email: user.email.toLowerCase(),
        full_name: fullName,
        role: "admin"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin oluşturulamadı.";
    return Response.json({ error: message }, { status: 500 });
  }
}
