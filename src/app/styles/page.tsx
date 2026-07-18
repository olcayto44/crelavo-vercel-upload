import Link from "next/link";
import { Layers, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

const platformStyles = [
  {
    name: "Premium SaaS",
    bestFor: "Website, admin panel, app dashboard",
    note: "Dark/navy base, blue-purple accents, polished cards, clean spacing, and global SaaS presentation."
  },
  {
    name: "Luxury Brand",
    bestFor: "Brand kit, visual pack, premium product page",
    note: "Elegant typography, premium contrast, refined spacing, and high-end visual direction."
  },
  {
    name: "Startup Clean",
    bestFor: "Landing page, pitch deck, mobile app MVP",
    note: "Simple structure, clear value proposition, modern UI sections, and conversion-focused layout."
  },
  {
    name: "Bold Social",
    bestFor: "AI video, image pack, campaign visuals",
    note: "Stronger hooks, energetic colors, scroll-stopping visual rhythm, and social-first composition."
  },
  {
    name: "Minimal Corporate",
    bestFor: "Business website, proposal pack, document pack",
    note: "Professional layout, restrained colors, readable hierarchy, and trust-focused presentation."
  },
  {
    name: "Mobile App Modern",
    bestFor: "Mobile app UI, Expo starter app, app + admin",
    note: "Rounded UI, clear navigation, component-based screens, and product-ready app structure."
  },
  {
    name: "E-commerce Product",
    bestFor: "E-commerce website, product visuals, catalog pages",
    note: "Product-first sections, clean cards, clear pricing/product blocks, and purchase-oriented UX."
  },
  {
    name: "Editorial Document",
    bestFor: "Pitch deck, proposal, guide, README, file pack",
    note: "Structured pages, strong headings, clean document hierarchy, and presentation-ready content."
  },
  {
    name: "Cinematic Video",
    bestFor: "AI video, product ad, brand film, drama trailer",
    note: "Premium lighting, controlled composition, cinematic pacing, and high-production visual language."
  }
];

export default async function StylesPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section">
        <span className="badge">Production styles</span>
        <h1>Choose a style direction for the full production</h1>
        <p className="section-lead">
          Styles now apply across the whole Crelavo production platform: websites, mobile apps, visuals, brand kits, documents, admin panels, and AI videos.
        </p>

        <section className="production-hero-card recommended-style-card" style={{ marginBottom: 28 }}>
          <span className="badge"><Sparkles size={14} /> Recommended default</span>
          <h2>Premium SaaS is the safest default for Crelavo</h2>
          <p>
            For the current platform direction, Premium SaaS should remain the default visual direction: dark/navy base, blue-purple gradients, premium cards, professional dashboard feel, and global product quality.
          </p>
          <Link className="btn" href="/dashboard/assistant-workspace?idea=Premium%20SaaS%20style">Create with Premium SaaS</Link>
        </section>

        <div className="production-pricing-grid">
          {platformStyles.map((style) => (
            <Link className="card clickable-card production-pricing-card" href={`/dashboard/assistant-workspace?idea=${encodeURIComponent(`${style.name} style`)}`} key={style.name}>
              <Layers color="var(--orange)" />
              <span className="badge">{style.bestFor}</span>
              <h3>{style.name}</h3>
              <p>{style.note}</p>
              <span className="btn">Use this style</span>
            </Link>
          ))}
        </div>

      </main>
    </>
  );
}
