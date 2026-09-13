export function SiteFooter() {
  return (
    <>
      <style id="cl-footer-css">{`
/* CL-FOOTER 6 */
.site-footer#cl-site-footer .balanced-footer-grid{grid-template-columns:repeat(6,minmax(0,1fr));gap:24px 22px}
@media (max-width:1100px){
  .site-footer#cl-site-footer .balanced-footer-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width:720px){
  .site-footer#cl-site-footer .balanced-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
.site-footer#cl-site-footer .footer-social-text-links{display:grid!important;gap:8px}
`}</style>
      <footer id="cl-site-footer" className="container footer clean-feed-section site-footer">
        <div className="site-footer-grid balanced-footer-grid">
          <div className="site-footer-group"><h3>Start here</h3><nav>
            <a href="/pricing">Pricing</a>
            <a href="/?auth=register">Sign up</a>
            <a href="/dashboard/assistant-workspace">Assistant</a>
            <a href="/dashboard">Dashboard</a>
          </nav></div>
          <div className="site-footer-group"><h3>Create</h3><nav>
            <a href="/categories">Categories</a>
            <a href="/tools">Tools</a>
            <a href="/ai-video-generator">Video</a>
            <a href="/ai-dubbing-voice">Voice</a>
          </nav></div>
          <div className="site-footer-group"><h3>Services</h3><nav>
            <a href="/live-sales-credits">Live Sales</a>
            <a href="/drone-credits">Drone</a>
            <a href="/growth-intelligence">Growth Intelligence</a>
            <a href="/affiliate">Affiliate</a>
          </nav></div>
          <div className="site-footer-group"><h3>Resources</h3><nav>
            <a href="/blog">Blog</a>
            <a href="/free-tools">Free tools</a>
            <a href="/alternatives">Alternatives</a>
            <a href="/contact">Contact</a>
          </nav></div>
          <div className="site-footer-group"><h3>Legal</h3><nav>
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/refund-policy">Refund Policy</a>
            <a href="/cookie-policy">Cookie Policy</a>
          </nav></div>
          <div className="site-footer-group footer-social-group"><h3>Social</h3>
            <nav className="footer-social-links footer-social-text-links" aria-label="Crelavo social links">
              <a href="https://www.youtube.com/@crelavohq/featured" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4" fill="currentColor"></rect><path d="m10 8.5 6 3.5-6 3.5z" fill="var(--surface, #07111f)"></path></svg><span>YouTube</span></a>
              <a href="https://www.instagram.com/crelavohq/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"></rect><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor"></circle></svg><span>Instagram</span></a>
              <a href="https://www.tiktok.com/@crelavo" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h2.2c.3 2.2 1.7 3.8 4 4.2v2.2c-1.5 0-2.8-.5-4-1.3V15a6 6 0 1 1-6-6c.2 0 .5 0 .8.1v2.3A3.8 3.8 0 1 0 14 15V3z"></path></svg><span>TikTok</span></a>
              <a href="https://www.linkedin.com/company/crelavo/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"></rect><circle cx="8" cy="8" r="1.3" fill="var(--surface, #07111f)"></circle><path d="M6.8 10h2.5v7H6.8zm4 0h2.4v1c.6-.8 1.5-1.3 2.7-1.3 2.6 0 3.3 1.7 3.3 4v3.3h-2.5V14c0-1.2 0-2.7-1.6-2.7s-1.8 1.3-1.8 2.6V17h-2.5z" fill="var(--surface, #07111f)"></path></svg><span>LinkedIn</span></a>
              <a href="https://x.com/crelavohq" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.2l4.1 5.5L16.9 4H20l-6.2 7.1L20.5 20h-3.2l-4.7-6.3L7.1 20H4l6.8-7.8z" fill="currentColor"></path></svg><span>X</span></a>
              <a href="https://www.reddit.com/user/crelavo/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7.2" fill="none" stroke="currentColor" strokeWidth="2"></circle><circle cx="9.2" cy="12.8" r="1.15" fill="currentColor"></circle><circle cx="14.8" cy="12.8" r="1.15" fill="currentColor"></circle><path d="M8.6 16.1c1 .9 2.1 1.35 3.4 1.35s2.4-.45 3.4-1.35" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path><circle cx="17.4" cy="8.2" r="1.2" fill="currentColor"></circle><path d="M14.1 6.7 15.3 3.4 18.8 4.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path></svg><span>Reddit</span></a>
            </nav>
          </div>
        </div>
        <div className="site-footer-brand footer-brand-bottom-copy">
          <p className="site-footer-description clean-footer-copy">Crelavo is an AI production studio providing live and autonomous agents for e-commerce growth.</p>
          <div className="site-footer-payment" aria-label="Accepted card payment methods">
            <span className="site-footer-payment-label">Secure checkout</span>
            <span className="site-footer-payment-mark"><img src="/payment/visa.svg" alt="Visa"/></span>
            <span className="site-footer-payment-mark"><img src="/payment/mastercard.svg" alt="Mastercard"/></span>
            <span className="site-footer-payment-mark"><img src="/payment/american-express.svg" alt="American Express"/></span>
          </div>
        </div>
        <div className="site-footer-bottom">
          <a className="site-footer-brand-link" href="/"><strong>Crelavo</strong></a>
          <span>{"\u00A9 2028 Crelavo. All rights reserved."}</span>
        </div>
      </footer>
    </>
  );
}
