"use client";

import Link from "next/link";

export function ProductionRequestForm() {
  return (
    <section className="card admin-wide-card">
      <span className="badge">Legacy form disabled</span>
      <h2>Production now starts from Assistant Workspace</h2>
      <p style={{ color: "var(--muted)" }}>
        The old long production form is disabled. Video, website, mobile app, SaaS, e-commerce, visual and file delivery jobs now start from the single conversational Assistant Workspace flow.
      </p>
      <Link className="btn" href="/dashboard/assistant-workspace">Go to Assistant Workspace</Link>
    </section>
  );
}
