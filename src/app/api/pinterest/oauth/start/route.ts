import crypto from "crypto";
import { requireVerifiedRequestUser } from "@/lib/supabase";

function secret() { return String(process.env.PINTEREST_CLIENT_SECRET || process.env.ADMIN_SESSION_SECRET || "").trim(); }
function makeState(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, at: Date.now() })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = String(body.user_id ?? body.userId ?? "").trim();
  if (!userId) return Response.json({ error: "user_id is required." }, { status: 400 });
  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;
  const clientId = String(process.env.PINTEREST_CLIENT_ID || "").trim();
  const clientSecret = secret();
  if (!clientId || !clientSecret) return Response.json({ error: "Pinterest OAuth environment variables are missing." }, { status: 500 });
  const redirectUri = "https://crelavo.com/api/pinterest/oauth/callback";
  const url = new URL("https://www.pinterest.com/oauth/");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "boards:read,pins:read,pins:write,user_accounts:read");
  url.searchParams.set("state", makeState(userId));
  return Response.json({ url: url.toString() });
}