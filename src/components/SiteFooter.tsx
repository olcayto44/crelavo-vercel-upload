import { HardReloadLink } from "@/components/HardReloadLink";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export async function SiteFooter() {
  const siteContent = await getConfiguredSiteContentConfig();
  const activeSocialLinks = siteContent.socialLinks.filter((link) => link.active);
  return (
    <footer className="container footer clean-feed-section site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-group">
          <h3>Platform</h3>
          <nav>
            <HardReloadLink href="/pricing">Pricing</HardReloadLink>
            <HardReloadLink href="/tools">Tools</HardReloadLink>
            <HardReloadLink href="/alternatives">Alternatives</HardReloadLink>
            <HardReloadLink href="/categories">Categories</HardReloadLink>
            <HardReloadLink href="/showcase/explore-samples">Samples</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Core services</h3>
          <nav>
            <HardReloadLink href="/products/website">Website production</HardReloadLink>
            <HardReloadLink href="/ai-product-video-generator">AI product video generator</HardReloadLink>
            <HardReloadLink href="/shopify-product-link-to-ad-video">Shopify product video</HardReloadLink>
            <HardReloadLink href="/amazon-product-ad-video">Amazon product ad video</HardReloadLink>
            <HardReloadLink href="/trendyol-product-video">Trendyol product video</HardReloadLink>
            <HardReloadLink href="/chrome-extension">Chrome extension funnel</HardReloadLink>
            <HardReloadLink href="/shopify-ai-product-video-app">Shopify AI video app</HardReloadLink>
            <HardReloadLink href="/woocommerce-ai-product-video-plugin">WooCommerce video plugin</HardReloadLink>
            <HardReloadLink href="/ai-ugc-creator-program">AI UGC creator program</HardReloadLink>
            <HardReloadLink href="/ai-tool-launch-distribution-plan">AI tool launch plan</HardReloadLink>
            <HardReloadLink href="/ai-social-media-launch-plan">AI social media launch</HardReloadLink>
            <HardReloadLink href="/pinterest-youtube-visual-distribution-plan">Pinterest YouTube plan</HardReloadLink>
            <HardReloadLink href="/ai-ad-performance-score-checker">AI ad score checker</HardReloadLink>
            <HardReloadLink href="/ai-virtual-model-studio">AI virtual model studio</HardReloadLink>
            <HardReloadLink href="/ai-cultural-localization">AI cultural localization</HardReloadLink>
            <HardReloadLink href="/ai-campaign-calendar">AI campaign calendar</HardReloadLink>
            <HardReloadLink href="/crelavo-academy">Crelavo Academy</HardReloadLink>
            <HardReloadLink href="/community-showcase">Community showcase</HardReloadLink>
            <HardReloadLink href="/tiktok-shop-ai-live-sales-agent">TikTok Shop live sales agent</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Alternatives</h3>
          <nav>
            <HardReloadLink href="/alternatives">All alternatives</HardReloadLink>
            <HardReloadLink href="/alternatives/crelavo-vs-runway">Crelavo vs Runway</HardReloadLink>
            <HardReloadLink href="/alternatives/crelavo-vs-heygen">Crelavo vs HeyGen</HardReloadLink>
            <HardReloadLink href="/alternatives/crelavo-vs-synthesia">Crelavo vs Synthesia</HardReloadLink>
            <HardReloadLink href="/alternatives/best-shopify-video-generator-tools">Best Shopify video tools</HardReloadLink>
            <HardReloadLink href="/alternatives/best-ai-product-video-generators">Best AI product video generators</HardReloadLink>
            <HardReloadLink href="/alternatives/best-ecommerce-video-creation-tools">Best ecommerce video tools</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Company</h3>
          <nav>
            <HardReloadLink href="/contact">Contact</HardReloadLink>
            <HardReloadLink href="/blog">Blog</HardReloadLink>
            <HardReloadLink href="/api-documentation">API documentation</HardReloadLink>
            <HardReloadLink href="/affiliate">Partner program</HardReloadLink>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Legal</h3>
          <nav>
            <HardReloadLink href="/terms">Terms of Service</HardReloadLink>
            <HardReloadLink href="/privacy">Privacy Policy</HardReloadLink>
            <HardReloadLink href="/refund-policy">Refund / Cancellation Policy</HardReloadLink>
            <HardReloadLink href="/cookie-policy">Cookie Policy</HardReloadLink>
          </nav>
        </div>
        {activeSocialLinks.length ? (
          <div className="site-footer-group footer-social-group">
            <h3>Social</h3>
            <nav className="footer-social-links" aria-label="Crelavo social links">
              {activeSocialLinks.map((link) => <a href={link.href} key={`${link.label}-${link.href}`} target="_blank" rel="noreferrer">{link.label}</a>)}
            </nav>
          </div>
        ) : null}
        <div className="site-footer-brand footer-brand-bottom-right">
          <HardReloadLink href="/" className="site-footer-brand-link"><strong>Crelavo</strong></HardReloadLink>
          <p className="site-footer-description clean-footer-copy" aria-label="Global AI production studio for websites, mobile apps, e-commerce product campaigns, Shopify product link ads, Amazon product campaigns and Trendyol product videos">Global AI production studio for websites, mobile apps, e-commerce product campaigns, Shopify/Amazon/Trendyol product links, ad videos, avatars, visuals, voice-over and AI + human QA delivery.</p>
          <div className="footer-commerce-shortcuts" aria-label="E-commerce campaign shortcuts">
            <HardReloadLink href="/dashboard/assistant-workspace?idea=Shopify%20product%20link%20ad&category=campaign&mode=commerce">Shopify campaign</HardReloadLink>
            <HardReloadLink href="/dashboard/assistant-workspace?idea=Amazon%20product%20campaign&category=campaign&mode=commerce">Amazon campaign</HardReloadLink>
            <HardReloadLink href="/dashboard/assistant-workspace?idea=Trendyol%20product%20video&category=campaign&mode=commerce">Trendyol video</HardReloadLink>
            <HardReloadLink href="/dashboard/assistant-workspace?idea=Product%20link%20to%20ad%20video&category=campaign&mode=commerce">Product link ad</HardReloadLink>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>Copyright © 2026 Crelavo. All rights reserved.</span>
        <span>AI production studio for websites, apps, e-commerce campaigns, AI video and AI + human QA delivery.</span>
      </div>
    </footer>
  );
}
