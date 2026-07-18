import Link from "next/link";
import { Header } from "@/components/Header";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <main className="container section" style={{ maxWidth: 560 }}>
        <div className="card auth-card">
          <h1>Forgot password</h1>
          <p style={{ color: "var(--muted)" }}>Enter your email address and we will send a secure link to create a new password.</p>
          <ForgotPasswordForm />
          <p style={{ color: "var(--muted)" }}>Remembered your password? <Link href="/auth/login">Sign in</Link></p>
        </div>
      </main>
    </>
  );
}
