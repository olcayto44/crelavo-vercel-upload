"use client";

import { HardReloadLink } from "@/components/HardReloadLink";

type FooterLocale = "de" | "fr" | "tr";

type FooterCopy = {
  startHere: string;
  productionBrief: string;
  pricing: string;
  freeTool: string;
  guides: string;
  ecommerce: string;
  productVideo: string;
  shopify: string;
  ugc: string;
  core: string;
  aiVideo: string;
  categories: string;
  tools: string;
  company: string;
  contact: string;
  samples: string;
  terms: string;
  privacy: string;
  refund: string;
  shortcutsLabel: string;
  shopifyCampaign: string;
  amazonCampaign: string;
  trendyolVideo: string;
  productLinkAd: string;
  description: string;
  bottom: string;
};

const localizedFooterCopy: Record<FooterLocale, FooterCopy> = {
  tr: {
    startHere: "Buradan başla",
    productionBrief: "Üretim briefi başlat",
    pricing: "Fiyatlar ve krediler",
    freeTool: "Ücretsiz AI reklam skoru",
    guides: "AI üretim rehberleri",
    ecommerce: "E-ticaret akışları",
    productVideo: "AI ürün videosu üretici",
    shopify: "Shopify AI ürün videosu uygulaması",
    ugc: "AI UGC üretici programı",
    core: "Ana üretim",
    aiVideo: "AI video üretimi",
    categories: "Üretim kategorileri",
    tools: "Araç kataloğu",
    company: "Şirket ve yasal",
    contact: "İletişim",
    samples: "Örnekler",
    terms: "Kullanım Şartları",
    privacy: "Gizlilik Politikası",
    refund: "İade politikası",
    shortcutsLabel: "E-ticaret kampanya kısayolları",
    shopifyCampaign: "Shopify kampanyası",
    amazonCampaign: "Amazon kampanyası",
    trendyolVideo: "Trendyol videosu",
    productLinkAd: "Ürün linkinden reklam",
    description: "Crelavo; e-ticaret ürün videoları, kampanya briefleri, web sitesi ve uygulama varlıkları için AI üretim stüdyosudur. Ekipler tek tek araç aramak yerine fiyat, kredi ve üretim briefi üzerinden net bir akış başlatabilir.",
    bottom: "Web siteleri, uygulamalar, e-ticaret kampanyaları, AI video ve AI + insan kalite kontrolü için üretim stüdyosu."
  },
  fr: {
    startHere: "Commencer ici",
    productionBrief: "Lancer un brief de production",
    pricing: "Tarifs et crédits",
    freeTool: "Scoreur publicitaire IA gratuit",
    guides: "Guides de production IA",
    ecommerce: "Workflows e-commerce",
    productVideo: "Générateur vidéo produit IA",
    shopify: "Application Shopify vidéo produit IA",
    ugc: "Programme créateur UGC IA",
    core: "Production principale",
    aiVideo: "Production vidéo IA",
    categories: "Catégories de production",
    tools: "Catalogue d’outils",
    company: "Entreprise et légal",
    contact: "Contact",
    samples: "Exemples",
    terms: "Conditions d’utilisation",
    privacy: "Politique de confidentialité",
    refund: "Politique de remboursement",
    shortcutsLabel: "Raccourcis campagne e-commerce",
    shopifyCampaign: "Campagne Shopify",
    amazonCampaign: "Campagne Amazon",
    trendyolVideo: "Vidéo Trendyol",
    productLinkAd: "Publicité depuis un lien produit",
    description: "Crelavo est un studio de production IA pour vidéos e-commerce, briefs de campagne, sites web, assets d’application et livraison organisée. Les équipes peuvent démarrer avec un score gratuit, une revue de prix ou un brief clair au lieu de chercher outil par outil.",
    bottom: "Studio de production IA pour sites web, applications, campagnes e-commerce, vidéo IA et contrôle qualité humain."
  },
  de: {
    startHere: "Hier starten",
    productionBrief: "Produktionsbrief starten",
    pricing: "Preise und Credits",
    freeTool: "Kostenloser KI-Werbe-Score",
    guides: "KI-Produktionsleitfäden",
    ecommerce: "E-Commerce-Workflows",
    productVideo: "KI-Produktvideo-Generator",
    shopify: "Shopify KI-Produktvideo-App",
    ugc: "KI-UGC-Creator-Programm",
    core: "Kernproduktion",
    aiVideo: "KI-Videoproduktion",
    categories: "Produktionskategorien",
    tools: "Tool-Katalog",
    company: "Unternehmen und Rechtliches",
    contact: "Kontakt",
    samples: "Beispiele",
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutzerklärung",
    refund: "Rückerstattungsrichtlinie",
    shortcutsLabel: "E-Commerce-Kampagnenkürzel",
    shopifyCampaign: "Shopify-Kampagne",
    amazonCampaign: "Amazon-Kampagne",
    trendyolVideo: "Trendyol-Video",
    productLinkAd: "Produktlink-Anzeige",
    description: "Crelavo ist ein KI-Produktionsstudio für E-Commerce-Produktvideos, Kampagnenbriefings, Websites, App-Assets und strukturierte Lieferung. Teams starten mit Score, Preisprüfung oder klarem Produktionsbrief statt jedes Tool einzeln zu suchen.",
    bottom: "KI-Produktionsstudio für Websites, Apps, E-Commerce-Kampagnen, KI-Video und menschliche Qualitätskontrolle."
  }
};

export function LocalizedSiteFooter({ locale }: { locale: FooterLocale }) {
  const copy = localizedFooterCopy[locale];

  return (
    <footer className="container footer clean-feed-section site-footer">
      <div className="site-footer-grid balanced-footer-grid">
        <div className="site-footer-group footer-core-services">
          <h3>{copy.startHere}</h3>
          <nav>
            <HardReloadLink href="/dashboard/create">{copy.productionBrief}</HardReloadLink>
            <HardReloadLink href="/pricing">{copy.pricing}</HardReloadLink>
            <HardReloadLink href="/free-tools/ad-performance-score-checker">{copy.freeTool}</HardReloadLink>
            <HardReloadLink href="/blog">{copy.guides}</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group footer-core-services">
          <h3>{copy.ecommerce}</h3>
          <nav>
            <HardReloadLink href="/ai-product-video-generator">{copy.productVideo}</HardReloadLink>
            <HardReloadLink href="/shopify-ai-product-video-app">{copy.shopify}</HardReloadLink>
            <HardReloadLink href="/ai-ugc-creator-program">{copy.ugc}</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>{copy.core}</h3>
          <nav>
            <HardReloadLink href="/ai-video-generator">{copy.aiVideo}</HardReloadLink>
            <HardReloadLink href="/categories">{copy.categories}</HardReloadLink>
            <HardReloadLink href="/tools">{copy.tools}</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>{copy.company}</h3>
          <nav>
            <HardReloadLink href="/contact">{copy.contact}</HardReloadLink>
            <HardReloadLink href="/showcase/explore-samples">{copy.samples}</HardReloadLink>
            <HardReloadLink href="/terms">{copy.terms}</HardReloadLink>
            <HardReloadLink href="/privacy">{copy.privacy}</HardReloadLink>
            <HardReloadLink href="/refund-policy">{copy.refund}</HardReloadLink>
          </nav>
        </div>
      </div>

      <div className="footer-commerce-shortcuts footer-commerce-row" aria-label={copy.shortcutsLabel}>
        <HardReloadLink href="/dashboard/create?idea=Shopify%20product%20link%20ad&category=campaign&mode=commerce">{copy.shopifyCampaign}</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Amazon%20product%20campaign&category=campaign&mode=commerce">{copy.amazonCampaign}</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Trendyol%20product%20video&category=campaign&mode=commerce">{copy.trendyolVideo}</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Product%20link%20to%20ad%20video&category=campaign&mode=commerce">{copy.productLinkAd}</HardReloadLink>
      </div>

      <div className="site-footer-brand footer-brand-bottom-copy">
        <HardReloadLink href="/" className="site-footer-brand-link"><strong>Crelavo</strong></HardReloadLink>
        <p className="site-footer-description clean-footer-copy">{copy.description}</p>
      </div>

      <div className="site-footer-bottom">
        <span>Copyright © 2026 Crelavo.</span>
        <span>{copy.bottom}</span>
      </div>
    </footer>
  );
}
