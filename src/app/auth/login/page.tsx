import Link from "next/link";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/LoginForm";

type LoginSearchParams = { next?: string | string[] };

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function safeNext(value: string) {
  if (!value || !value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  return value;
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<LoginSearchParams> }) {
  const params = await searchParams;
  const next = safeNext(firstParam(params?.next));
  const registerHref = next ? `/auth/register?next=${encodeURIComponent(next)}` : "/auth/register";

  return (
    <>
      <Header />
      <main className="container section auth-screen" style={{ width: "min(100% - 32px, 520px)", maxWidth: 520, minHeight: "calc(100svh - 92px)", display: "grid", alignItems: "center", justifyItems: "center" }}>
        <div className="card auth-card" style={{ width: "100%", maxWidth: 520 }}>
          <h1>Member login</h1>
          <p style={{ color: "var(--muted)" }}>Choose how you want to continue.</p>
          {next ? (
            <div className="card" style={{ margin: "14px 0", background: "rgba(34,211,238,.08)" }}>
              <span className="badge">Continue your production request</span>
              <p style={{ color: "var(--muted)" }}>After signing in, continue with the free tool result already prepared for Assistant Workspace.</p>
              <Link className="btn secondary" href={next}>Preview production request</Link>
            </div>
          ) : null}
          <div className="auth-login-mode-row">
            <Link className="btn" href="/auth/login">Sign in</Link>
            <Link className="btn secondary" href={registerHref}>Create account</Link>
          </div>
          <div id="member-login">
            <LoginForm />
          </div>
          <p style={{ color: "var(--muted)" }}>Do not have an account? <Link href={registerHref}>Register</Link></p>
        </div>
      </main>
    </>
  );
}
