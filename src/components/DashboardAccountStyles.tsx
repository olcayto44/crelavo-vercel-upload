const DASHBOARD_ACCOUNT_CSS = `
.cdx {
  --cdx-cyan: #22d3ee;
  --cdx-ink: #082032;
  --cdx-muted: #aeb8cc;
  --cdx-card: rgba(8, 18, 40, 0.72);
  --cdx-line: rgba(255, 255, 255, 0.08);
  font-family: Inter, system-ui, sans-serif;
  color: #f8fbff;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  box-sizing: border-box;
}
.cdx .cdx-shell-inner {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  padding: 24px 20px 72px;
}
.cdx *,
.cdx *::before,
.cdx *::after { box-sizing: border-box; }
.cdx a { color: inherit; text-decoration: none; }
.cdx-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 0 0 28px;
}
.cdx-pills a {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #d7e3f5;
  font-size: 13px;
  font-weight: 500;
}
.cdx-pills a:hover { background: rgba(255, 255, 255, 0.08); }
.cdx-pills a.is-active {
  background: var(--cdx-cyan);
  border-color: var(--cdx-cyan);
  color: var(--cdx-ink);
}
.cdx-account {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: -12px 0 22px;
}
.cdx-account a {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: #d7e3f5;
  font-size: 12px;
  font-weight: 500;
}
.cdx-account a.is-active {
  background: var(--cdx-cyan);
  border-color: var(--cdx-cyan);
  color: var(--cdx-ink);
}
.cdx-chip {
  display: inline-flex;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #c9d6ea;
  font-size: 12px;
  font-weight: 500;
  margin: 0 0 12px;
}
.cdx h1 {
  margin: 0 0 8px;
  font-size: 40px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.cdx-lead {
  margin: 0 0 28px;
  max-width: 640px;
  color: var(--cdx-muted);
  font-size: 15px;
  line-height: 1.5;
}
.cdx-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.cdx-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.cdx-card {
  background: var(--cdx-card);
  border: 1px solid var(--cdx-line);
  border-radius: 20px;
  padding: 20px 20px 18px;
}
.cdx-card h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 650;
}
.cdx-card p {
  margin: 0 0 16px;
  color: var(--cdx-muted);
  font-size: 14px;
  line-height: 1.45;
}
.cdx-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  border-radius: 999px;
  background: var(--cdx-cyan);
  color: var(--cdx-ink);
  font-size: 14px;
  font-weight: 650;
  border: 0;
}
.cdx-btn:hover { filter: brightness(1.06); }
.cdx-note {
  margin-top: 16px;
  background: var(--cdx-card);
  border: 1px solid var(--cdx-line);
  border-radius: 20px;
  padding: 20px;
}
.cdx-note h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 650;
}
.cdx-note p {
  margin: 0;
  color: var(--cdx-muted);
  font-size: 14px;
  line-height: 1.5;
}
.cdx-note ul {
  margin: 10px 0 0;
  padding: 0 0 0 18px;
  color: var(--cdx-muted);
  font-size: 14px;
  line-height: 1.55;
}
.cdx-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 8px;
}
.cdx-split h3 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 650;
}
.cdx-split p {
  margin: 0;
  color: var(--cdx-muted);
  font-size: 14px;
  line-height: 1.45;
}
@media (max-width: 860px) {
  .cdx h1 { font-size: 32px; }
  .cdx-grid,
  .cdx-grid-3,
  .cdx-split { grid-template-columns: 1fr; }
}
`;

export function DashboardAccountStyles() {
  return <style>{DASHBOARD_ACCOUNT_CSS}</style>;
}
