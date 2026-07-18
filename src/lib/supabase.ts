import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

let browserClient: ReturnType<typeof createClient> | null = null;

export const supabaseBrowser = () => {
  if (!browserClient) browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
};

export const supabaseAdmin = () => {
  if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
};

export function bearerTokenFromRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token.trim() : "";
}

export async function requireVerifiedRequestUser(request: Request, expectedUserId: string) {
  const token = bearerTokenFromRequest(request);
  if (!token) return { ok: false as const, response: Response.json({ error: "Authenticated session is required." }, { status: 401 }) };

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  const user = data?.user;
  if (error || !user?.id) return { ok: false as const, response: Response.json({ error: "User session could not be verified. Please log in again." }, { status: 401 }) };
  if (user.id !== expectedUserId) return { ok: false as const, response: Response.json({ error: "You are not allowed to access this user data." }, { status: 403 }) };

  return { ok: true as const, user };
}
