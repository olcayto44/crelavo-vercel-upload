export function DashboardFooter() {
  return (
    <>
      <style id="cdx-dashboard-footer-css">{`
.cdx-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  flex-wrap: wrap;
  max-width: 1120px;
  margin: 48px auto 0;
  padding: 18px 20px 28px;
  border-top: 1px solid rgba(215, 227, 245, 0.12);
  color: rgb(154, 168, 192);
  font-size: 13px;
  line-height: 1.4;
}
.cdx-foot-copy { margin: 0; }
.cdx-foot-links { display: flex; gap: 16px; flex-wrap: wrap; }
.cdx-foot-links a {
  color: rgb(174, 184, 204);
  text-decoration: none;
}
.cdx-foot-links a:hover { color: rgb(215, 251, 255); }

/* Kit 12 — dashboard background only. */
html:has(.cdx),
body:has(.cdx),
#__next:has(.cdx),
#root:has(.cdx),
#app:has(.cdx) {
  background: #020617 !important;
  background-color: #020617 !important;
  color-scheme: dark;
}
.cdx {
  background: #020617 !important;
  background-color: #020617 !important;
  min-height: 100vh;
}
`}</style>
      <footer className="cdx-foot" role="contentinfo">
        <p className="cdx-foot-copy">© {new Date().getFullYear()} Crelavo. All rights reserved.</p>
        <nav className="cdx-foot-links" aria-label="Legal">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/refund-policy">Refunds</a>
          <a href="/dashboard/contact">Contact</a>
        </nav>
      </footer>
    </>
  );
}
