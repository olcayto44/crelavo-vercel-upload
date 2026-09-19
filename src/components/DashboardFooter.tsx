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

/* Kit 12 — dashboard layered background only. */
html:has(.cdx),
html:has(.cdx) body,
html:has(.cdx) #__next,
html:has(.cdx) #root,
html:has(.cdx) #app {
  background-color: #020617 !important;
  color-scheme: dark;
}
.cdx {
  min-height: 100vh;
  color-scheme: dark;
  background-color: #020617 !important;
  background-image:
    radial-gradient(900px 520px at 12% -8%, rgba(56, 189, 248, 0.22), transparent 58%),
    radial-gradient(820px 480px at 88% -12%, rgba(129, 90, 255, 0.20), transparent 55%),
    radial-gradient(70% 45% at 50% 100%, rgba(12, 74, 110, 0.28), transparent 70%);
  background-repeat: no-repeat;
}
/* Kit 13 — siyah sütun. Kit 12 glow kalsın. */
.cdx-shell {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  max-width: none !important;
  width: 100% !important;
  min-height: 0 !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
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
