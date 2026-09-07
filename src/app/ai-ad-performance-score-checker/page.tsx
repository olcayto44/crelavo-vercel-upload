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
  { title: "2. Start the Pro trial", text: "Start Crelavo Pro free for 24 hours after the ad idea has a stronger hook; then continue at $9.99/month unless cancelled in Whop." },
  { title: "3. Scale the winning angle", text: "Use Crelavo credits for controlled 1080p product videos, UGC variations, social campaigns and client delivery once the creative direction is clear." }
];

export default function AiAdPerformanceScoreCheckerPage() {
  return (
    <>
      <PhaseOneFeaturePageView page={page} />
      <section className="container section clean-feed-section" aria-labelledby="ad-scorer-paid-funnel-heading">
        <div className="sample-video-head">
          <div>
            <span className="badge">Meta Sales funnel</span>
            <h2 id="ad-scorer-paid-funnel-heading">Use the free score before the Pro trial</h2>
            <p className="section-lead">This page is the low-friction ad entry point for Shopify, Amazon FBA and WooCommerce sellers. Score the creative first, then start Crelavo Pro for $0 for 24 hours through Whop.</p>
          </div>
          <div className="category-option-row">
            <Link className="btn" href="https://whop.com/checkout/plan_ujLQgM3kEg0dg">Start free 24-hour trial</Link>
            <Link className="btn secondary" href="https://whop.com/checkout/plan_fiabRYr6uWY43">Start free 24-hour trial</Link>
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
