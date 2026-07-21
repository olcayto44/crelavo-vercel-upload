"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";
import { defaultFooterHelpPanels, type FooterHelpPanel } from "@/lib/site-content-config";

type DrawerKey = "faq" | "rules" | "refund" | "contact" | "api";

const drawerContent: Record<DrawerKey, { title: string; badge: string; intro: string; items: { question: string; answer: string }[] }> = {
  faq: {
    title: "Frequently Asked Questions",
    badge: "Quick answers",
    intro: "Short answers about Crelavo production, credits, delivery and AI + human QA workflows.",
    items: [
      { question: "What does Crelavo produce?", answer: "Crelavo starts AI + human QA production requests for websites, apps, e-commerce campaigns, AI videos, avatars, visuals, brand kits, documents and product-link campaigns." },
      { question: "Can I start from a product link?", answer: "Yes. Shopify, Amazon, Trendyol, WooCommerce or direct product links can be used to prepare product ads, marketplace assets, captions, visual sets and campaign packages." },
      { question: "Is it only a video generator?", answer: "No. Crelavo is positioned as a broader AI production studio for digital products, campaigns, media, creative assets and expert-reviewed delivery." },
      { question: "Where do final files appear?", answer: "Production outputs, previews, delivery links, ZIP files, source notes and revision information are organized in the user dashboard." }
    ]
  },
  rules: {
    title: "Usage Rules",
    badge: "Simple rules",
    intro: "Crelavo is for safe, commercial and publishable production requests.",
    items: [
      { question: "What can users request?", answer: "Users can request websites, app screens, campaigns, product-link ads, visuals, brand kits, videos, voice-over content and AI + human QA creative packages." },
      { question: "What should requests include?", answer: "A clear product link, brief, target platform, language, format, audience and delivery expectation helps the system reserve credits and route the production correctly." },
      { question: "What is not allowed?", answer: "Illegal, unsafe, explicit, harmful, misleading or non-commercially publishable requests are not supported." }
    ]
  },
  refund: {
    title: "Refund Policy",
    badge: "Credit policy",
    intro: "Crelavo uses a credit-based production workflow. Refunds are not offered once credits are reserved or production work begins.",
    items: [
      { question: "Are refunds available?", answer: "No. Refunds are not available for started, reserved or delivered production work because credits are allocated to provider, automation and delivery costs." },
      { question: "What happens before production starts?", answer: "Users should review the credit estimate, package scope and selected production options before submitting a request." },
      { question: "Do subscriptions renew automatically?", answer: "Yes. Monthly and yearly subscriptions renew automatically through the payment provider until cancelled. Failed renewals may suspend subscription benefits until payment is updated." },
      { question: "Do top-up credits renew?", answer: "No. One-time top-up credit packages do not renew automatically and can be purchased repeatedly whenever extra balance is needed." },
      { question: "Can users request changes?", answer: "Revision rights depend on the selected package and production scope. Revisions are handled through the dashboard instead of refunds." }
    ]
  },
  contact: {
    title: "Contact / Support",
    badge: "Support information",
    intro: "Crelavo support is available through the public contact page and support email.",
    items: [
      { question: "How can customers contact support?", answer: "Customers can use the public contact page or email support@crelavo.com for account, billing, production and delivery questions." },
      { question: "What should be included?", answer: "Include the account email, package name, production ID if available, payment receipt reference and a clear description of the request." },
      { question: "Where are production updates handled?", answer: "Production notes, revision requests and delivery status are handled inside the customer dashboard." }
    ]
  },
  api: {
    title: "API and Integrations",
    badge: "Recommendation",
    intro: "My recommendation is to present this as managed integrations first, with developer documentation introduced only when the technical access path is ready.",
    items: [
      { question: "What should be listed here now?", answer: "Shopify, Amazon, Trendyol, WooCommerce, Meta Ads, TikTok, YouTube Shorts, Whop, AI video providers, voice providers and storage/delivery integrations." },
      { question: "Should we promise open developer access now?", answer: "Not yet. It is better to say managed integrations are available and publish technical documentation only after authentication, rate limits and billing rules are ready." },
      { question: "What is the best positioning?", answer: "Crelavo connects production, commerce, ads, payments and AI providers through managed integrations from one dashboard." }
    ]
  }
};

const drawerButtons: { key: DrawerKey; label: string }[] = [
  { key: "faq", label: "Frequently Asked Questions" },
  { key: "rules", label: "Usage Rules" },
  { key: "refund", label: "Refund Policy" },
  { key: "contact", label: "Contact / Support" },
  { key: "api", label: "API and Integrations" }
];

function panelToDrawerKey(panel: FooterHelpPanel): DrawerKey | null {
  if (panel.id.includes("faq")) return "faq";
  if (panel.id.includes("rule")) return "rules";
  if (panel.id.includes("refund")) return "refund";
  if (panel.id.includes("contact") || panel.id.includes("support")) return "contact";
  if (panel.id.includes("api") || panel.id.includes("integration")) return "api";
  return null;
}

function mergeConfiguredPanels(panels: FooterHelpPanel[]) {
  const merged = { ...drawerContent };
  panels.filter((panel) => panel.active).forEach((panel) => {
    const key = panelToDrawerKey(panel);
    if (!key) return;
    merged[key] = {
      title: panel.title,
      badge: drawerContent[key].badge,
      intro: panel.description,
      items: panel.items.map((item) => ({ question: item.title, answer: item.body }))
    };
  });
  return merged;
}

export function FooterHelpDrawer({ panels = defaultFooterHelpPanels }: { panels?: FooterHelpPanel[] }) {
  const configuredDrawerContent = mergeConfiguredPanels(panels);
  const [activeKey, setActiveKey] = useState<DrawerKey | null>(null);
  const active = activeKey ? configuredDrawerContent[activeKey] : null;

  return (
    <div className="site-footer-group footer-help-group">
      <h3>Company and Help</h3>
      <nav>
        {drawerButtons.map((item) => (
          <button className="footer-help-trigger" key={item.key} type="button" onClick={() => setActiveKey(item.key)}>
            {item.label}
          </button>
        ))}
        <Link href="/blog">Blog / Content</Link>
      </nav>

      {active ? (
        <div className="footer-info-drawer-backdrop" role="presentation" onClick={() => setActiveKey(null)}>
          <aside className="footer-info-drawer" aria-label={active.title} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="footer-info-close" type="button" aria-label="Close" onClick={() => setActiveKey(null)}><X size={18} /></button>
            <span className="badge">{active.badge}</span>
            <h2>{active.title}</h2>
            <p>{active.intro}</p>
            <div className="footer-info-list">
              {active.items.map((item) => (
                <div className="footer-info-item" key={item.question}>
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
