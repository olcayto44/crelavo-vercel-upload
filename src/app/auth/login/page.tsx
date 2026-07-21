import Link from "next/link";
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
    <main className="auth-standalone-screen">
      <Link className="auth-standalone-logo" href="/">Crelavo</Link>
      <section className="card auth-standalone-card">
        <h1>Member login</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Sign in to open your production dashboard.</p>
        {next ? (
          <div className="card" style={{ margin: "12px 0", background: "rgba(34,211,238,.08)", padding: 14 }}>
            <span className="badge">Continue your production request</span>
            <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>After signing in, continue the prepared Assistant Workspace request.</p>
            <Link className="btn secondary" href={next}>Preview request</Link>
          </div>
        ) : null}
        <div id="member-login">
          <LoginForm />
        </div>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>Do not have an account? <Link href={registerHref}>Register</Link></p>
      </section>
    </main>
  );
}
