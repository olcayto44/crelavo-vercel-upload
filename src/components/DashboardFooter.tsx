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

/* Kit 12 .cdx — transparent page + collapse extra viewport
   Dashboard only. Do not add to homepage or /pricing. */
html {
  background: transparent !important;
  background-color: transparent !important;
  min-height: 0 !important;
  height: auto !important;
}
body {
  background: transparent !important;
  background-color: transparent !important;
  min-height: 0 !important;
  height: auto !important;
}
#__next,
#root,
#app {
  background: transparent !important;
  background-color: transparent !important;
  min-height: 0 !important;
  height: auto !important;
}
.cdx {
  background: transparent !important;
  background-color: transparent !important;
  min-height: 0 !important;
  height: auto !important;
  display: flex;
  flex-direction: column;
}
.cdx.min-h-screen,
.cdx.h-screen,
.cdx.min-h-full,
.cdx.h-full,
.cdx.min-h-dvh,
.cdx.min-h-svh,
.cdx.min-h-\\[100vh\\],
.cdx.min-h-\\[100dvh\\] {
  min-height: 0 !important;
  height: auto !important;
}
.cdx > main,
.cdx main {
  flex: 0 0 auto !important;
  min-height: 0 !important;
  height: auto !important;
}
.cdx footer,
.cdx .cdx-foot {
  flex: 0 0 auto !important;
  margin-top: 2rem;
  margin-bottom: 1.25rem;
}
.cdx::before,
.cdx::after {
  display: none !important;
  content: none !important;
  min-height: 0 !important;
  height: 0 !important;
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
