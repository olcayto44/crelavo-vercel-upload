const LIVE_SALES_AGENT_CSS = `
.cdx-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 18px 16px 8px;
}
.cdx-nav a {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font: 600 13px/1 Inter, system-ui, sans-serif;
  color: #d7e3f5;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-decoration: none;
  white-space: nowrap;
}
.cdx-nav a.is-active {
  background: #7af0ff;
  color: #082032;
  border-color: transparent;
}
.cdx-sub {
  width: min(1240px, calc(100% - 32px));
  margin: 8px auto 0;
}
.cdx-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font: 600 12px/1 Inter, system-ui, sans-serif;
  color: #d7e3f5;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.cdx-chip.is-active {
  color: #d7e3f5;
}
.cdx-head {
  width: min(1240px, calc(100% - 32px));
  margin: 12px auto 18px;
}
.cdx-head h1 {
  margin: 0 0 8px;
  font: 800 40px/1.1 Inter, system-ui, sans-serif;
  color: #f8fbff;
}
.cdx-head p {
  margin: 0;
  max-width: 52rem;
  font: 400 15px/1.45 Inter, system-ui, sans-serif;
  color: #aeb8cc;
}
.cdx-lsa-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr) minmax(0, 1.15fr);
  gap: 16px;
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto 48px;
  align-items: start;
}
.cdx-lsa-grid > * {
  min-width: 0;
}
.cdx-kv {
  display: grid;
  grid-template-columns: minmax(108px, auto) minmax(0, 1fr);
  gap: 6px 10px;
  align-items: start;
}
.cdx-kv .k {
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #aeb8cc;
}
.cdx-kv .v {
  min-width: 0;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #f8fbff;
  overflow-wrap: anywhere;
}
.cdx-embed-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.35;
  word-break: break-all;
  overflow-wrap: anywhere;
  text-align: right;
}
.cdx-plan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #d7e3f5;
  font: 600 13px/1.3 Inter, system-ui, sans-serif;
}
.cdx-plan a {
  color: #7af0ff;
  text-decoration: none;
}
.cdx-guest-only { display: block; }
.cdx-user-only { display: none; }
.cdx-lsa.is-signed-in .cdx-guest-only { display: none; }
.cdx-lsa.is-signed-in .cdx-user-only { display: block; }
@media (max-width: 1100px) {
  .cdx-lsa-grid { grid-template-columns: 1fr; }
}

/* Kit 6 — live sales leftovers only */
.cdx .cdx-kv {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  column-gap: 8px;
  row-gap: 2px;
  min-width: 0;
}
.cdx .cdx-kv-label {
  white-space: nowrap;
  flex: 0 0 auto;
}
.cdx .cdx-kv-val {
  white-space: nowrap;
  margin-left: auto;
  text-align: right;
  min-width: 0;
}

.cdx .cdx-hours {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}
.cdx .cdx-hours a {
  color: inherit;
  text-decoration: underline;
}
.cdx .cdx-hours .cdx-hours-extra {
  display: none;
}

.cdx .cdx-lsa-log:empty,
.cdx .cdx-lsa-log.is-empty {
  display: none !important;
  min-height: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: none !important;
}
.cdx .cdx-lsa-hint {
  margin: 8px 0 12px;
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.8;
}
`;

export function LiveSalesAgentStyles() {
  return <style>{LIVE_SALES_AGENT_CSS}</style>;
}
