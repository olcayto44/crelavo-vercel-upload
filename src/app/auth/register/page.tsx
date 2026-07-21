import Link from "next/link";
import { Header } from "@/components/Header";
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
    <>
      <Header />
      <main className="container section auth-screen">
        <div className="card auth-card">
          <h1>Register</h1>
          <p style={{ color: "var(--muted)" }}>Choose how you want to start.</p>
          {next ? (
            <div className="card" style={{ margin: "14px 0", background: "rgba(34,211,238,.08)" }}>
              <span className="badge">Free tool result saved</span>
              <p style={{ color: "var(--muted)" }}>Create your account, then continue the selected free tool result in Assistant Workspace.</p>
              <Link className="btn secondary" href={next}>Preview production request</Link>
            </div>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "16px 0 18px" }}>
            <Link className="btn" href="/auth/register">Create account</Link>
            <Link className="btn secondary" href="/affiliate">Apply as partner</Link>
          </div>
          <div id="create-account">
            <RegisterForm />
          </div>
          <p style={{ color: "var(--muted)" }}>Already have an account? <Link href={loginHref}>Sign in</Link></p>
        </div>
      </main>
    </>
  );
}
