import Link from "next/link";
import { CreditPlansToggle } from "@/components/CreditPlansToggle";
import { DashboardShell } from "@/components/DashboardShell";
import { packages, topUpPackages } from "@/lib/data";

export default function CreditsPage() {
  return (
    <DashboardShell>
      <div className="card">
        <span className="badge">Credits</span>
        <h2>Choose your Crelavo credit package</h2>
        <p style={{ color: "var(--muted)" }}>
          Start with a monthly or yearly credit package first. Extra top-up credits stay below the main plans so the page stays simple.
        </p>
      </div>

      <section style={{ marginTop: 18 }}>
        <CreditPlansToggle plans={packages} ctaLabel="Start 24-Hour Preview" />
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 24 }}>
        <span className="badge">Need extra credits?</span>
        <h2>Add top-up credits</h2>
        <p style={{ color: "var(--muted)" }}>
          Top-ups are one-time credit additions. They do not replace your main package and can be bought whenever production volume increases.
        </p>
        <div style={{ marginTop: 16 }}>
          <CreditPlansToggle plans={topUpPackages} ctaLabel="Add credits" />
        </div>
      </section>

      <section className="credit-trust-strip" aria-label="Credit safety summary" style={{ marginTop: 24 }}>
        <div>
          <span className="badge">Credit safety</span>
          <h3>Estimate first</h3>
          <p>Production screens show estimated credits before a job starts.</p>
        </div>
        <div>
          <span className="badge">Reserved credits</span>
          <h3>Only after confirmation</h3>
          <p>Credits are reserved only when the user confirms production start.</p>
        </div>
        <div>
          <span className="badge">More plans</span>
          <h3>Special services stay separate</h3>
          <p><Link href="/live-sales-credits">Live sales</Link> and <Link href="/drone-credits">drone packages</Link> have their own pages.</p>
        </div>
      </section>
    </DashboardShell>
  );
}
