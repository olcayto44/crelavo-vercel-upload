import Link from "next/link";
import { PRO_MONTHLY_CHECKOUT } from "../../lib/ids";

export default function Footer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="cl-tiny">Copyright © 2026 CreLavo.</p>
    );
  }

  return (
    <footer className="cl-footer">
      <div className="cl-wrap">
        <div className="cl-footer-grid">
          <div>
            <h3>Start here</h3>
            <nav>
              <a href={PRO_MONTHLY_CHECKOUT}>Start 24-hour trial</a>
              <Link href="/pricing">Pricing and credits</Link>
              <Link href="/free-tools/ad-performance-score-checker">
                Free AI ad scorer
              </Link>
              <Link href="/blog">AI production guides</Link>
            </nav>
          </div>
          <div>
            <h3>E-commerce workflows</h3>
            <nav>
              <Link href="/ai-product-video-generator">
                AI product video generator
              </Link>
              <Link href="/shopify-ai-product-video-app">
                Shopify AI product video app
              </Link>
              <Link href="/woocommerce-ai-product-video-plugin">
                WooCommerce video plugin
              </Link>
              <Link href="/chrome-extension">Chrome extension funnel</Link>
              <Link href="/ai-ugc-creator-program">AI UGC creator program</Link>
            </nav>
          </div>
          <div>
            <h3>Core production</h3>
            <nav>
              <Link href="/ai-video-generator">AI video production</Link>
              <Link href="/ai-website-builder">AI website builder</Link>
              <Link href="/ai-app-builder">AI app builder</Link>
              <Link href="/categories">Production categories</Link>
              <Link href="/tools">Tools catalog</Link>
            </nav>
          </div>
          <div>
            <h3>Compare tools</h3>
            <nav>
              <Link href="/alternatives">AI tool alternatives</Link>
              <Link href="/alternatives/crelavo-vs-runway">CreLavo vs Runway</Link>
              <Link href="/alternatives/crelavo-vs-heygen">CreLavo vs HeyGen</Link>
            </nav>
          </div>
          <div>
            <h3>Company and legal</h3>
            <nav>
              <Link href="/contact">Contact</Link>
              <Link href="/showcase/videos">Video showcase</Link>
              <Link href="/showcase/explore-samples">Samples</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/refund-policy">Refund policy</Link>
            </nav>
          </div>
          <div>
            <h3>Social</h3>
            <nav>
              <a href="https://www.instagram.com/crelavohq/" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href="https://www.youtube.com/@crelavohq" target="_blank" rel="noreferrer">
                YouTube
              </a>
              <a href="https://www.tiktok.com/@crelavo" target="_blank" rel="noreferrer">
                TikTok
              </a>
              <a href="https://x.com/crelavohq" target="_blank" rel="noreferrer">
                X / Twitter
              </a>
              <a href="https://www.linkedin.com/company/crelavo/" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href="https://www.reddit.com/user/crelavo/" target="_blank" rel="noreferrer">
                Reddit
              </a>
            </nav>
          </div>
        </div>
        <div className="cl-footer-brand">
          <Link href="/">
            <strong>CreLavo</strong>
          </Link>
          <p>
            CreLavo AI — Autonomous Live-Commerce Platform. For hosts selling
            physical goods live. Don&apos;t lose live orders.
          </p>
        </div>
        <div className="cl-footer-bottom">
          <span>Copyright © 2026 CreLavo. All rights reserved.</span>
          <span>CreLavo · https://www.crelavo.com</span>
        </div>
      </div>
    </footer>
  );
}
