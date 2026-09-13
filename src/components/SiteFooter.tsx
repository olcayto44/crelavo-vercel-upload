export function SiteFooter() {
  return (
    <footer className="container footer clean-feed-section site-footer">
      <div className="site-footer-grid balanced-footer-grid">
        <div className="site-footer-group">
          <h3>Start here</h3>
          <nav>
            <a href="/pricing">Pricing</a>
            <a href="/tools">Tools</a>
            <a href="/categories">Categories</a>
            <a href="/?auth=register">Sign up</a>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Create</h3>
          <nav>
            <a href="/dashboard/assistant-workspace">Assistant</a>
            <a href="/live-sales-credits">Live Sales</a>
            <a href="/drone-credits">Drone video</a>
            <a href="/ai-product-video-generator">Product video</a>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Company</h3>
          <nav>
            <a href="/blog">Blog</a>
            <a href="/affiliate">Partners</a>
            <a href="/free-tools">Free tools</a>
            <a href="/contact">Contact</a>
          </nav>
        </div>
        <div className="site-footer-group">
          <h3>Legal</h3>
          <nav>
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/refund-policy">Refund policy</a>
            <a href="/cookie-policy">Cookie policy</a>
          </nav>
        </div>
        <div className="site-footer-group footer-social-group">
          <h3>Social</h3>
          <nav className="footer-social-links footer-social-text-links" aria-label="Crelavo social links">
            <a href="https://www.youtube.com/@crelavohq/featured" target="_blank" rel="noopener noreferrer"><span>YouTube</span></a>
            <a href="https://www.instagram.com/crelavohq/" target="_blank" rel="noopener noreferrer"><span>Instagram</span></a>
            <a href="https://www.tiktok.com/@crelavo" target="_blank" rel="noopener noreferrer"><span>TikTok</span></a>
            <a href="https://www.linkedin.com/company/crelavo/" target="_blank" rel="noopener noreferrer"><span>LinkedIn</span></a>
            <a href="https://x.com/crelavohq" target="_blank" rel="noopener noreferrer"><span>X</span></a>
            <a href="https://www.reddit.com/user/crelavo/" target="_blank" rel="noopener noreferrer"><span>Reddit</span></a>
          </nav>
        </div>
      </div>
      <div className="site-footer-brand footer-brand-bottom-copy">
        <p className="site-footer-description clean-footer-copy">Crelavo is an AI production studio for ecommerce video, campaigns and live-commerce.</p>
        <div className="site-footer-payment" aria-label="Accepted card payment methods">
          <span className="site-footer-payment-label">Secure checkout</span>
          <span className="site-footer-payment-mark"><img src="/payment/visa.svg" alt="Visa"/></span>
          <span className="site-footer-payment-mark"><img src="/payment/mastercard.svg" alt="Mastercard"/></span>
          <span className="site-footer-payment-mark"><img src="/payment/american-express.svg" alt="American Express"/></span>
        </div>
      </div>
      <div className="site-footer-bottom">
        <a className="site-footer-brand-link" href="/"><strong>Crelavo</strong></a>
        <span>© 2026 Crelavo. All rights reserved.</span>
      </div>
    </footer>
  );
}
