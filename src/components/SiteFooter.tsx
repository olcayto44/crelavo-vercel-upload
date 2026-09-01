import Script from "next/script";
import { HardReloadLink } from "@/components/HardReloadLink";

function SocialIcon({ name }: { name: "instagram" | "youtube" | "tiktok" | "x" | "linkedin" | "reddit" }) {
  if (name === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>;
  if (name === "youtube") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4" fill="currentColor"/><path d="m10 8.5 6 3.5-6 3.5z" fill="var(--surface, #07111f)"/></svg>;
  if (name === "tiktok") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.2a4.1 4.1 0 1 1-3-3.95V7.1A7.1 7.1 0 1 0 17 14.2V8.5c1.2 1 2.7 1.6 4.5 1.6V7.2C18.4 7.2 16 5.4 15.7 3z" fill="currentColor"/></svg>;
  if (name === "x") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.2l4.1 5.5L16.9 4H20l-6.2 7.1L20.5 20h-3.2l-4.7-6.3L7.1 20H4l6.8-7.8z" fill="currentColor"/></svg>;
  if (name === "linkedin") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="var(--surface, #07111f)"/><path d="M6.8 10h2.5v7H6.8zm4 0h2.4v1c.6-.8 1.5-1.3 2.7-1.3 2.6 0 3.3 1.7 3.3 4v3.3h-2.5V14c0-1.2 0-2.7-1.6-2.7s-1.8 1.3-1.8 2.6V17h-2.5z" fill="var(--surface, #07111f)"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="9" cy="11" r="1.2" fill="var(--surface, #07111f)"/><circle cx="15" cy="11" r="1.2" fill="var(--surface, #07111f)"/><path d="M8.5 14.5c1.8 1.6 5.2 1.6 7 0" fill="none" stroke="var(--surface, #07111f)" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}

export async function SiteFooter() {
  return (
    <footer className="container footer clean-feed-section site-footer">
      <Script id="tiktok-pixel" strategy="afterInteractive">
        {`!function (w, d, t) {
  w.TiktokAnalyticsObject = t;
  var ttq = w[t] = w[t] || [];
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
  ttq.setAndDefer = function (t, e) {
    t[e] = function () {
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
  ttq.instance = function (t) {
    for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
    return e;
  };
  ttq.load = function (e, n) {
    var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._i[e]._u = r;
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date;
    ttq._o = ttq._o || {};
    ttq._o[e] = n || {};
    n = document.createElement("script");
    n.type = "text/javascript";
    n.async = true;
    n.src = r + "?sdkid=" + e + "&lib=" + t;
    e = document.getElementsByTagName("script")[0];
    e.parentNode.insertBefore(n, e);
  };
  ttq.load("DABLK7JC77U21D59TE90");
  ttq.page();
}(window, document, "ttq");`}
      </Script>
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
            <a href="https://www.instagram.com/crelavohq/" target="_blank" rel="noopener noreferrer" aria-label="Crelavo on Instagram"><SocialIcon name="instagram" /><span>Instagram</span></a>
            <a href="https://www.youtube.com/@crelavohq" target="_blank" rel="noopener noreferrer" aria-label="Crelavo on YouTube"><SocialIcon name="youtube" /><span>YouTube</span></a>
            <a href="https://www.tiktok.com/@crelavo" target="_blank" rel="noopener noreferrer" aria-label="Crelavo on TikTok"><SocialIcon name="tiktok" /><span>TikTok</span></a>
            <a href="https://x.com/crelavohq" target="_blank" rel="noopener noreferrer" aria-label="Crelavo on X"><SocialIcon name="x" /><span>X / Twitter</span></a>
            <a href="https://www.linkedin.com/company/crelavo/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="Crelavo on LinkedIn"><SocialIcon name="linkedin" /><span>LinkedIn</span></a>
            <a href="https://www.reddit.com/user/crelavo/" target="_blank" rel="noopener noreferrer" aria-label="Crelavo on Reddit"><SocialIcon name="reddit" /><span>Reddit</span></a>
          </nav>
        </div>
      </div>

      <div className="product-hunt-footer-badge" aria-label="Crelavo on Product Hunt">
        <a href="https://www.producthunt.com/products/crelavo?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-crelavo" target="_blank" rel="noopener noreferrer">
          <img alt="Crelavo - AI production for ecommerce brands — try free for 24 hours | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1236961&theme=dark&t=1788138590814" />
        </a>
      </div>

      <div className="footer-commerce-shortcuts footer-commerce-row" aria-label="E-commerce campaign shortcuts">
        <HardReloadLink href="/dashboard/create?idea=Shopify%20product%20link%20ad&category=campaign&mode=commerce">Shopify campaign</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Amazon%20product%20campaign&category=campaign&mode=commerce">Amazon campaign</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Trendyol%20product%20video&category=campaign&mode=commerce">Trendyol video</HardReloadLink>
        <HardReloadLink href="/dashboard/create?idea=Product%20link%20to%20ad%20video&category=campaign&mode=commerce">Product link ad</HardReloadLink>
        <HardReloadLink href="/woocommerce-ai-product-video-plugin">WooCommerce plugin</HardReloadLink>
        <HardReloadLink href="/tiktok-shop-ai-live-sales-agent">TikTok Shop live sales</HardReloadLink>
      </div>

      <div className="site-footer-brand footer-brand-bottom-copy">
        <HardReloadLink href="/" className="site-footer-brand-link"><strong>Crelavo</strong></HardReloadLink>
        <p className="site-footer-description clean-footer-copy" aria-label="Global AI production studio for ecommerce, app, website and campaign delivery">Crelavo is an AI production studio for ecommerce product videos, campaign briefs, websites, app assets and dashboard delivery. Teams can start with a free score, pricing review or focused production brief instead of searching through every tool at once.</p>
        <div className="site-footer-payment" aria-label="Accepted card payment methods">
          <span className="site-footer-payment-label">Secure checkout</span>
          <span className="site-footer-payment-mark"><img src="/payment/visa.svg" alt="Visa" /></span>
          <span className="site-footer-payment-mark"><img src="/payment/mastercard.svg" alt="Mastercard" /></span>
          <span className="site-footer-payment-mark"><img src="/payment/american-express.svg" alt="American Express" /></span>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>Copyright © 2026 Crelavo. All rights reserved.</span>
        <span className="site-footer-technical-line">Crelavo · AI production studio for websites, apps and ecommerce · https://www.crelavo.com</span>
      </div>
    </footer>
  );
}
