import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";

type RegisterSearchParams = { next?: string | string[] };

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function safeNext(value: string) {
  if (!value || !value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  return value;
}

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<RegisterSearchParams> }) {
  const params = await searchParams;
  const next = safeNext(firstParam(params?.next));
  const loginHref = next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login";

  return (
    <main className="auth-standalone-screen">
      <Link className="auth-standalone-logo" href="/">Crelavo</Link>
      <section className="card auth-standalone-card auth-register-card">
        <h1>Create account</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>Create your account and continue to the production dashboard.</p>
        {next ? (
          <div className="card" style={{ margin: "12px 0", background: "rgba(34,211,238,.08)", padding: 14 }}>
            <span className="badge">Free tool result saved</span>
            <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>Create your account, then continue the selected free tool result in Assistant Workspace.</p>
            <Link className="btn secondary" href={next}>Preview request</Link>
          </div>
        ) : null}
        <div id="create-account">
          <RegisterForm />
        </div>
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>Already have an account? <Link href={loginHref}>Sign in</Link></p>
      </section>
    </main>
  );
}
