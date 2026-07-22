import type { Metadata } from "next";
import Link from "next/link";
import { PhaseOneFeaturePageView } from "@/components/PhaseOneFeaturePage";
import { getPhaseOneFeature } from "@/lib/feature-phase-one";

const page = getPhaseOneFeature("ai-ad-performance-score-checker")!;

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  keywords: [page.primaryKeyword, ...page.keywords],
  alternates: { canonical: `/${page.slug}` },
  openGraph: { title: page.metaTitle, description: page.metaDescription, url: `/${page.slug}`, type: "website" },
  twitter: { card: "summary_large_image", title: page.metaTitle, description: page.metaDescription }
};

const adScorerFunnelSteps = [
  { title: "1. Score the hook", text: "Check whether the first three seconds, CTA, proof and product promise are strong enough before buying production credits." },
  { title: "2. Test a low-risk preview", text: "Move into the $10 Business preview or the $20 Team Annual preview only after the ad idea has a stronger hook." },
  { title: "3. Scale the winning angle", text: "Use Crelavo credits for product video drafts, UGC variations, social campaigns and client delivery once the creative direction is clear." }
];

export default function AiAdPerformanceScoreCheckerPage() {
  return (
    <>
      <PhaseOneFeaturePageView page={page} />
      <section className="container section clean-feed-section" aria-labelledby="ad-scorer-paid-funnel-heading">
        <div className="sample-video-head">
          <div>
            <span className="badge">Meta Sales funnel</span>
            <h2 id="ad-scorer-paid-funnel-heading">Use the free score before the $10 or $20 preview</h2>
            <p className="section-lead">This page is the low-friction ad entry point for Shopify, Amazon FBA and WooCommerce sellers. Score the creative first, then test Crelavo with a Whop preview instead of jumping straight into a large package.</p>
          </div>
          <div className="category-option-row">
            <Link className="btn" href="/dashboard/payment?package=business&billing=monthly&campaign=business-12000">Start $10 Business preview</Link>
            <Link className="btn secondary" href="/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000">Start $20 Team preview</Link>
          </div>
        </div>
        <div className="admin-category-grid" style={{ marginTop: 16 }}>
          {adScorerFunnelSteps.map((step) => (
            <div className="card admin-category-card" key={step.title}>
              <span className="badge">Paid traffic step</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
