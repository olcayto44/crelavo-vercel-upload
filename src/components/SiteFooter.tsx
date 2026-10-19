import { FooterStartLinks } from "@/components/auth/FooterStartLinks";
import { SiteBrandLogo } from "@/components/SiteBrandLogo";
import { footerSeoGroups } from "@/lib/footer-seo-links";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer id="cl-site-footer" className={"container footer clean-feed-section site-footer " + styles.footer} lang="en" data-no-translate>
      <div className={styles.brandRow}>
        <a className={styles.brandLink} href="/" aria-label="Crelavo home"><SiteBrandLogo /></a>
        <p className={styles.description}>Crelavo is an AI production studio providing live and autonomous agents for e-commerce growth.</p>
      </div>
      <div className={styles.columns} data-footer-seo-columns>
        {footerSeoGroups.map((group, index) => <section className={styles.group} aria-labelledby={"footer-seo-heading-" + index} key={group.title}>
          <h2 id={"footer-seo-heading-" + index}>{group.title}</h2>
          <nav aria-label={group.title}><ul>{group.links.map(link => <li key={link.href}><a href={link.href} hrefLang={link.hreflang} lang={link.hreflang}>{link.label}</a></li>)}</ul></nav>
        </section>)}
      </div>
      <div className={styles.utilityRow}>
        <details className={styles.more}>
          <summary>More from Crelavo</summary>
          <nav className={styles.moreLinks} aria-label="More Crelavo services and account links">
            <FooterStartLinks />
            <a href="/categories">Categories</a><a href="/tools">Tools catalog</a><a href="/blog">Blog</a><a href="/alternatives">Alternatives</a><a href="/free-tools">Free tools</a><a href="/contact">Contact</a>
            <a href="/live-sales-credits">Live Sales</a><a href="/drone-credits">Drone</a><a href="/growth-intelligence">Growth Intelligence</a><a href="/affiliate">Affiliate</a>
          </nav>
        </details>
        <div className="site-footer-payment" aria-label="Accepted card payment methods">
          <span className="site-footer-payment-label">Secure checkout</span>
          <span className="site-footer-payment-mark"><img src="/payment/visa.svg" alt="Visa"/></span>
          <span className="site-footer-payment-mark"><img src="/payment/mastercard.svg" alt="Mastercard"/></span>
          <span className="site-footer-payment-mark"><img src="/payment/american-express.svg" alt="American Express"/></span>
        </div>
      </div>
      <div className={styles.socialRow}><nav className={styles.socialLinks} aria-label="Crelavo social links">
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
                             <a href="https://tr.pinterest.com/crelavoai/" target="_blank" rel="noopener noreferrer">
                 <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5a9.5 9.5 0 0 0-3.46 18.35c-.08-1.56-.01-3.44.39-5.22l1.05-4.44s-.27-.54-.27-1.34c0-1.25.73-2.18 1.64-2.18.77 0 1.14.58 1.14 1.27 0 .77-.49 1.92-.74 2.99-.21.89.45 1.62 1.33 1.62 1.6 0 2.83-1.69 2.83-4.13 0-2.16-1.55-3.67-3.76-3.67-2.56 0-4.06 1.92-4.06 3.91 0 .78.3 1.62.67 2.08.07.08.08.16.06.25l-.25 1.03c-.04.17-.14.21-.32.13-1.18-.55-1.91-2.27-1.91-3.65 0-2.97 2.16-5.7 6.23-5.7 3.27 0 5.81 2.33 5.81 5.44 0 3.25-2.05 5.86-4.9 5.86-.96 0-1.87-.5-2.18-1.09l-.59 2.25c-.21.82-.78 1.84-1.16 2.46.87.27 1.79.42 2.74.42a9.5 9.5 0 1 0 0-19z"></path></svg><span>Pinterest</span></a>
<a href="https://www.reddit.com/user/crelavo/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7.2" fill="none" stroke="currentColor" strokeWidth="2"></circle><circle cx="9.2" cy="12.8" r="1.15" fill="currentColor"></circle><circle cx="14.8" cy="12.8" r="1.15" fill="currentColor"></circle><path d="M8.6 16.1c1 .9 2.1 1.35 3.4 1.35s2.4-.45 3.4-1.35" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path><circle cx="17.4" cy="8.2" r="1.2" fill="currentColor"></circle><path d="M14.1 6.7 15.3 3.4 18.8 4.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path></svg><span>Reddit</span></a>
            </nav></div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Crelavo. All rights reserved.</span>
        <nav className={styles.legalLinks} aria-label="Legal policies"><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a><a href="/refund-policy">Refund Policy</a><a href="/cookie-policy">Cookie Policy</a></nav>
      </div>
    </footer>
  );
}
