import Link from "next/link";
import { Header } from "@/components/Header";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main className="container section" style={{ maxWidth: 560 }}>
        <div className="card auth-card">
          <h1>Create a new password</h1>
          <p style={{ color: "var(--muted)" }}>If you arrived from the password reset link in your email, you can set your new password here.</p>
          <ResetPasswordForm />
          <p style={{ color: "var(--muted)" }}>To return to the login page, <Link href="/auth/login">click here</Link>.</p>
        </div>
      </main>
    </>
  );
}
