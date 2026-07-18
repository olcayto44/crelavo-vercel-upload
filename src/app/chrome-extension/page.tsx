import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

const extensionTargets = [
  {
    title: "Amazon product pages",
    text: "Show a small Generate AI Video for this Product action when a seller is reviewing a product page or listing angle."
  },
  {
    title: "Shopify product admin",
    text: "Let merchants move from a Shopify product page into a Crelavo campaign request without copying the product details manually."
  },
  {
    title: "Marketplace campaign workflow",
    text: "Send the product URL, page context and campaign intent into Crelavo so the seller can start ad video, hooks, landing copy and social assets."
  }
];

const mvpChecklist = [
  "Detect supported product pages such as Shopify admin and Amazon product URLs.",
  "Show a lightweight Generate AI Video for this Product button.",
  "Open Crelavo with the product URL prefilled in the assistant workspace.",
  "Keep the first version simple: no scraping storage, no background automation, no payment logic inside the extension.",
  "Track clicks with UTM parameters so the traffic funnel can be measured."
];

export const metadata: Metadata = {
  title: "Chrome Extension Funnel for Product Link to AI Video | Crelavo",
  description: "Crelavo Chrome extension funnel concept for Shopify, Amazon and ecommerce sellers who want to generate AI product videos and campaign assets from a product page.",
  alternates: { canonical: "/chrome-extension" },
  openGraph: {
    title: "Chrome Extension Funnel | Crelavo",
    description: "Bring Crelavo directly to ecommerce product pages with a product-link-to-video extension funnel.",
    url: "/chrome-extension",
    type: "website"
  }
};

export default async function ChromeExtensionPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section">
        <section className="production-hero-card clean-feed-section">
          <span className="badge">Chrome extension funnel</span>
          <h1>Generate AI videos from Shopify and Amazon product pages</h1>
          <p className="section-lead">
            This page defines the Crelavo Chrome extension traffic funnel: meet ecommerce sellers while they are already inside Shopify, Amazon or marketplace product pages, then send them into Crelavo with the product link ready for a campaign request.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <Link className="btn" href="/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Chrome%20extension%20product%20link%20video">Start extension campaign flow</Link>
            <Link className="btn secondary" href="/categories/campaign">Open campaign category</Link>
            <Link className="btn secondary" href="/shopify-product-link-to-ad-video">Shopify workflow</Link>
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">Where the button appears</span>
          <h2>Product-page traffic capture points</h2>
          <div className="delivery-step-grid">
            {extensionTargets.map((item) => (
              <div className="delivery-step-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">MVP scope</span>
          <h2>What should be built first</h2>
          <p>
            The first extension should stay focused on acquisition: it should not try to become the full production system. The goal is to create a high-intent click from a product page into the Crelavo workspace.
          </p>
          <ul>{mvpChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="production-hero-card clean-feed-section" style={{ marginTop: 24 }}>
          <span className="badge">SEO and growth value</span>
          <h2>Why this helps Crelavo</h2>
          <p>
            Ecommerce sellers spend their time inside product pages, not inside random AI tool directories. A browser extension creates a direct acquisition funnel from the moment a seller is thinking about a product to the moment they ask Crelavo to create product videos, ad hooks and campaign assets.
          </p>
        </section>
      </main>
    </>
  );
}
