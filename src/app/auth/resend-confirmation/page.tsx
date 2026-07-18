import Link from "next/link";
import { Header } from "@/components/Header";
import { ResendConfirmationForm } from "@/components/ResendConfirmationForm";

export default function ResendConfirmationPage() {
  return (
    <>
      <Header />
      <main className="container section" style={{ maxWidth: 560 }}>
        <div className="card auth-card">
          <h1>Resend confirmation email</h1>
          <p style={{ color: "var(--muted)" }}>If your confirmation link expired, enter your email address and we will send a new confirmation link.</p>
          <ResendConfirmationForm />
          <p style={{ color: "var(--muted)" }}>To return to the login page, <Link href="/auth/login">click here</Link>.</p>
        </div>
      </main>
    </>
  );
}
