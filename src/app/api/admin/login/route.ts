import { createClient } from "@supabase/supabase-js";
import { ADMIN_SESSION_COOKIE, adminSessionCookieHeader, clearAdminSessionCookieHeader, createAdminSessionToken, getExpectedAdminEmail, getExpectedAdminPassword, getExpectedAdminUsername, verifyAdminSessionToken } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const sessionCookie = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  const token = sessionCookie ? decodeURIComponent(sessionCookie.slice(ADMIN_SESSION_COOKIE.length + 1)) : "";
  return Response.json({ authenticated: verifyAdminSessionToken(token) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = String(body.identifier ?? body.email ?? body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const expectedEmail = getExpectedAdminEmail();
    const expectedUsername = getExpectedAdminUsername();
    const expectedPassword = getExpectedAdminPassword();

    const envIdentifierOk = Boolean(expectedEmail && expectedPassword && (identifier === expectedEmail || identifier === expectedUsername));
    const envPasswordOk = Boolean(expectedPassword && password === expectedPassword);

    if (envIdentifierOk && envPasswordOk) {
      const token = createAdminSessionToken(expectedEmail);
      if (!token) {
        return Response.json({ error: "Admin session could not be created." }, { status: 500, headers: { "Cache-Control": "no-store" } });
      }

      return Response.json(
        { ok: true, email: expectedEmail, source: "env" },
        { headers: { "Set-Cookie": adminSessionCookieHeader(token), "Cache-Control": "no-store" } }
      );
    }

    if (identifier.includes("@")) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE ?? "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
        const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
        const user = data.user;
        if (!error && user?.id && user.email) {
          const { data: profile, error: profileError } = await supabaseAdmin()
            .from("profiles")
            .select("role, email")
            .eq("id", user.id)
            .maybeSingle();

          if (!profileError && String(profile?.role ?? "").toLowerCase() === "admin") {
            const token = createAdminSessionToken(user.email.toLowerCase());
            if (!token) {
              return Response.json({ error: "Admin session could not be created." }, { status: 500, headers: { "Cache-Control": "no-store" } });
            }

            return Response.json(
              { ok: true, email: user.email.toLowerCase(), source: "supabase" },
              { headers: { "Set-Cookie": adminSessionCookieHeader(token), "Cache-Control": "no-store" } }
            );
          }
        }
      }
    }

    return Response.json({ error: "Admin username/email or password is incorrect." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Admin login failed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearAdminSessionCookieHeader(), "Cache-Control": "no-store" } });
}
