import { HardReloadLink } from "@/components/HardReloadLink";

export async function SiteFooter() {
  return (
    <footer className="container footer clean-feed-section site-footer">
      <div className="site-footer-grid balanced-footer-grid">
        <div className="site-footer-group footer-core-services">
          <h3>Start here</h3>
          <nav>
            <HardReloadLink href="/dashboard/create">Start production brief</HardReloadLink>
            <HardReloadLink href="/pricing">Pricing and credits</HardReloadLink>
            <HardReloadLink href="/free-tools/ad-performance-score-checker">Free AI ad scorer</HardReloadLink>
            <HardReloadLink href="/blog">AI production guides</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group footer-core-services">
          <h3>E-commerce workflows</h3>
          <nav>
            <HardReloadLink href="/ai-product-video-generator">AI product video generator</HardReloadLink>
            <HardReloadLink href="/shopify-ai-product-video-app">Shopify AI product video app</HardReloadLink>
            <HardReloadLink href="/woocommerce-ai-product-video-plugin">WooCommerce video plugin</HardReloadLink>
            <HardReloadLink href="/chrome-extension">Chrome extension funnel</HardReloadLink>
            <HardReloadLink href="/ai-ugc-creator-program">AI UGC creator program</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Core production</h3>
          <nav>
            <HardReloadLink href="/ai-video-generator">AI video production</HardReloadLink>
            <HardReloadLink href="/ai-website-builder">AI website builder</HardReloadLink>
            <HardReloadLink href="/ai-app-builder">AI app builder</HardReloadLink>
            <HardReloadLink href="/categories">Production categories</HardReloadLink>
            <HardReloadLink href="/tools">Tools catalog</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Compare tools</h3>
          <nav>
            <HardReloadLink href="/alternatives">AI tool alternatives</HardReloadLink>
            <HardReloadLink href="/alternatives/crelavo-vs-runway">Crelavo vs Runway</HardReloadLink>
            <HardReloadLink href="/alternatives/crelavo-vs-heygen">Crelavo vs HeyGen</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Company and legal</h3>
          <nav>
            <HardReloadLink href="/contact">Contact</HardReloadLink>
            <HardReloadLink href="/showcase/explore-samples">Samples</HardReloadLink>
            <HardReloadLink href="/terms">Terms of Service</HardReloadLink>
            <HardReloadLink href="/privacy">Privacy Policy</HardReloadLink>
            <HardReloadLink href="/refund-policy">Refund policy</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group footer-social-group">
          <h3>Social</h3>
          <nav className="footer-social-links footer-social-text-links" aria-label="Crelavo social links">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a>
            <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer">TikTok</a>
            <a href="https://x.com/" target="_blank" rel="noreferrer">X / Twitter</a>
          </nav>
        </div>
      </div>

      <div className="footer-commerce-shortcuts footer-commerce-row" aria-label="E-commerce campaign shortcuts">
        <HardReloadLink href="/dashboard/create?idea=Shopify%20product%20link%20ad&category=campaign&mode=commerce">Shopify campaign</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Amazon%20product%20campaign&category=campaign&mode=commerce">Amazon campaign</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Trendyol%20product%20video&category=campaign&mode=commerce">Trendyol video</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Product%20link%20to%20ad%20video&category=campaign&mode=commerce">Product link ad</HardReloadLink>
      </div>

      <div className="site-footer-brand footer-brand-bottom-copy">
        <HardReloadLink href="/" className="site-footer-brand-link"><strong>Crelavo</strong></HardReloadLink>
        <p className="site-footer-description clean-footer-copy" aria-label="Global AI production studio for ecommerce, app, website and campaign delivery">Crelavo is an AI production studio for ecommerce product videos, campaign briefs, websites, app assets and dashboard delivery. Teams can start with a free score, pricing review or focused production brief instead of searching through every tool at once.</p>
      </div>

      <div className="site-footer-bottom">
        <span>Copyright © 2026 Crelavo. All rights reserved.</span>
        <span>AI production studio for websites, apps, ecommerce campaigns, AI video and AI + human QA delivery.</span>
      </div>
    </footer>
  );
}
