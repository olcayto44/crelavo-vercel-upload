import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { freeTools } from "@/lib/free-tools";

const premiumRoadmap = [
  {
    title: "One-Click Ad Localization",
    status: "Premium later",
    note: "Start with script/subtitle localization, then voice dubbing, then credit-gated lipsync only for higher plans or custom quotes."
  },
  {
    title: "AI Smart Image-to-Video",
    status: "Paid workflow later",
    note: "Do not open as free generation. Use brief/preview first, then charge high credits for 5s drafts and cinematic product videos."
  },
  {
    title: "Review-to-Avatar Video",
    status: "After review script funnel",
    note: "Use only approved customer reviews. Start with script/brief, then paid avatar testimonial video."
  },
  {
    title: "Video Ad Performance Predictor",
    status: "Next phase",
    note: "Current free tool scores scripts. Later add video upload/transcript/frame scoring and enterprise PDF reports."
  }
];

const adminChecklist = [
  "Free tools are static-config driven in src/lib/free-tools.ts; public pages and sitemap are generated automatically.",
  "Pricing trust microcopy is in CreditPlansToggle and should stay provider-neutral until Lemon/Whop activation is final.",
  "Do not promise exact free credits unless the welcome-credit backend policy matches the claim.",
  "Do not add fake live-sales/social-proof notifications; use real events or clearly labelled examples only.",
  "Heavy GPU/provider features must be credit-gated and hidden from low-tier unlimited usage."
];

export default function AdminFreeToolsPage() {
  const highlighted = new Set(["ecommerce-ad-script-generator", "review-to-ad-script-generator", "ad-performance-score-checker"]);

  return (
    <AdminShell title="Free Tools Funnel" description="Public free-tool funnel, SEO hooks, conversion CTAs and premium feature roadmap for Crelavo growth.">
      <section className="card admin-wide-card">
        <span className="badge">Today configured</span>
        <h2>High-conversion free tools now active</h2>
        <p style={{ color: "var(--muted)" }}>These pages let visitors test value before credits, then carry selected outputs into Assistant Workspace for paid preview, credit packages and full production.</p>
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {freeTools.filter((tool) => highlighted.has(tool.slug)).map((tool) => (
            <Link className="card admin-category-card" href={`/free-tools/${tool.slug}`} key={tool.slug}>
              <span className="badge">{tool.category}</span>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <small>/{`free-tools/${tool.slug}`}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">All free tools</span>
        <h2>Indexed public tools</h2>
        <div className="plan-feature-groups">
          {freeTools.map((tool) => (
            <div key={tool.slug}>
              <b>{tool.title}</b>
              <small>{tool.keyword}</small>
              <small>{tool.description}</small>
              <Link href={`/free-tools/${tool.slug}`}>Open public page</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Admin rules</span>
        <h2>What must be configured carefully</h2>
        <div className="plan-feature-groups">
          {adminChecklist.map((item) => <div key={item}><b>Rule</b><small>{item}</small></div>)}
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Roadmap memory</span>
        <h2>Premium features to remember</h2>
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {premiumRoadmap.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
