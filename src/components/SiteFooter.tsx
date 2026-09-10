import { HardReloadLink } from "@/components/HardReloadLink";

function SocialIcon({ name }: { name: "instagram" | "youtube" | "x" | "linkedin" }) {
  if (name === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>;
  if (name === "youtube") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4" fill="currentColor"/><path d="m10 8.5 6 3.5-6 3.5z" fill="var(--surface, #07111f)"/></svg>;
  if (name === "x") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.2l4.1 5.5L16.9 4H20l-6.2 7.1L20.5 20h-3.2l-4.7-6.3L7.1 20H4l6.8-7.8z" fill="currentColor"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="var(--surface, #07111f)"/><path d="M6.8 10h2.5v7H6.8zm4 0h2.4v1c.6-.8 1.5-1.3 2.7-1.3 2.6 0 3.3 1.7 3.3 4v3.3h-2.5V14c0-1.2 0-2.7-1.6-2.7s-1.8 1.3-1.8 2.6V17h-2.5z" fill="var(--surface, #07111f)"/></svg>;
}

export function SiteFooter() {
  return (
    <footer className="container footer clean-feed-section site-footer">
      <div className="site-footer-grid balanced-footer-grid">
        <div className="site-footer-group"><h3>Start here</h3><nav>
          <HardReloadLink href="/pricing">Pricing</HardReloadLink>
          <HardReloadLink href="/?auth=register">Sign up</HardReloadLink>
          <HardReloadLink href="/contact">Book demo</HardReloadLink>
          <HardReloadLink href="/contact">Contact sales</HardReloadLink>
        </nav></div>
        <div className="site-footer-group"><h3>E-commerce workflows</h3><nav>
          <HardReloadLink href="/live-sales-credits">Live shopping</HardReloadLink>
          <HardReloadLink href="/ai-product-video-generator">Product demos</HardReloadLink>
          <HardReloadLink href="/contact">Customer support</HardReloadLink>
          <HardReloadLink href="/categories">Interactive catalogs</HardReloadLink>
        </nav></div>
        <div className="site-footer-group"><h3>Core production</h3><nav>
          <HardReloadLink href="/ai-agents">AI Agents</HardReloadLink>
          <HardReloadLink href="/live-sales-credits">Avatar studio</HardReloadLink>
          <HardReloadLink href="/ai-dubbing-voice">Voice synthesis</HardReloadLink>
          <HardReloadLink href="/free-tools/ai-prompt-generator">Script generator</HardReloadLink>
        </nav></div>
        <div className="site-footer-group"><h3>Compare tools</h3><nav>
          <HardReloadLink href="/alternatives">vs. competitors</HardReloadLink>
          <HardReloadLink href="/contact">vs. agencies</HardReloadLink>
          <HardReloadLink href="/contact">vs. in-house</HardReloadLink>
        </nav></div>
        <div className="site-footer-group"><h3>Company and legal</h3><nav>
          <HardReloadLink href="/">About Crelavo</HardReloadLink>
          <HardReloadLink href="/contact">Careers</HardReloadLink>
          <HardReloadLink href="/terms">Terms of Service</HardReloadLink>
          <HardReloadLink href="/privacy">Privacy Policy</HardReloadLink>
        </nav></div>
        <div className="site-footer-group footer-social-group"><h3>Social</h3><nav className="footer-social-links footer-social-text-links" aria-label="Crelavo social links">
          <a href="https://www.linkedin.com/company/crelavo/?viewAsMember=true" target="_blank" rel="noopener noreferrer"><SocialIcon name="linkedin"/><span>LinkedIn</span></a>
          <a href="https://x.com/crelavohq" target="_blank" rel="noopener noreferrer"><SocialIcon name="x"/><span>Twitter</span></a>
          <a href="https://www.instagram.com/crelavohq/" target="_blank" rel="noopener noreferrer"><SocialIcon name="instagram"/><span>Instagram</span></a>
          <a href="https://www.youtube.com/@crelavohq" target="_blank" rel="noopener noreferrer"><SocialIcon name="youtube"/><span>YouTube</span></a>
        </nav></div>
      </div>
      <div className="site-footer-brand footer-brand-bottom-copy">
        <p className="site-footer-description clean-footer-copy">Crelavo is an AI production studio providing live and autonomous agents for e-commerce growth.</p>
        <div className="site-footer-payment" aria-label="Accepted card payment methods"><span className="site-footer-payment-label">Secure checkout</span><span className="site-footer-payment-mark"><img src="/payment/visa.svg" alt="Visa"/></span><span className="site-footer-payment-mark"><img src="/payment/mastercard.svg" alt="Mastercard"/></span><span className="site-footer-payment-mark"><img src="/payment/american-express.svg" alt="American Express"/></span></div>
      </div>
      <div className="site-footer-bottom"><HardReloadLink href="/" className="site-footer-brand-link"><strong>Crelavo</strong></HardReloadLink><span>© 2028 Crelavo. All rights reserved.</span></div>
    </footer>
  );
}