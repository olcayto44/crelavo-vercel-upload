import type { ReactNode } from "react";
import { CDX_GLOW } from "@/components/DashboardAccountStyles";
import { DashboardFooter } from "@/components/DashboardFooter";

const CDX_CSS = `
.cdx{font-family:Inter,system-ui,sans-serif;color:#e2e8f0;background:#020617;max-width:1120px;margin:0 auto;padding:20px 20px 72px}
.cdx.cdx-full-bleed{max-width:none;margin:0;padding:0}
.cdx.cdx-full-bleed .cdx-shell>.mx-auto{width:100%;max-width:72rem;margin:0 auto;padding:20px 20px 72px}
.cdx .cdx-top{display:flex;justify-content:flex-end;margin:0 0 16px}
.cdx .cdx-top a{color:#67e8f9;text-decoration:none;font-size:13px}
.cdx .pills{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:0 0 28px}
.cdx .pills a{display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;border:1px solid #1e293b;background:#0b1220;color:#94a3b8;text-decoration:none;font-size:13px;font-weight:500}
.cdx .pills a:hover{border-color:#22d3ee;color:#f8fafc}
.cdx .badge{display:inline-flex;padding:4px 10px;border-radius:999px;border:1px solid #164e63;color:#67e8f9;font-size:12px;margin:0 0 10px}
.cdx h1{font-size:28px;line-height:1.2;margin:0 0 8px;color:#f8fafc}
.cdx .lead{color:#94a3b8;margin:0 0 22px;font-size:15px}
.cdx .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.cdx .card{background:#0b1220;border:1px solid #1e293b;border-radius:16px;padding:20px}
.cdx .card h2,.cdx .card h3{margin:0 0 8px;font-size:16px;color:#f8fafc}
.cdx .card p{margin:0 0 14px;color:#94a3b8;font-size:14px}
.cdx label{display:block;font-size:13px;color:#cbd5e1;margin:12px 0 6px}
.cdx input,.cdx select,.cdx textarea{width:100%;box-sizing:border-box;background:#020617;border:1px solid #1e293b;border-radius:10px;color:#f8fafc;padding:10px 12px;font:inherit}
.cdx .row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.cdx .btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.cdx .btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:10px;background:#22d3ee;color:#082f49;font-weight:600;text-decoration:none;border:0;cursor:pointer;font:inherit}
.cdx .btn-out,.cdx .btn.secondary{background:transparent;border:1px solid #334155;color:#e2e8f0}
.cdx .btns + .card,.cdx .btns + div > .card{margin-top:20px}
.cdx .btn:disabled{opacity:.55;cursor:not-allowed}
.cdx textarea{min-height:120px;resize:vertical}
.cdx table{width:100%;border-collapse:collapse;font-size:13px}
.cdx th,.cdx td{padding:10px;border-bottom:1px solid #1e293b;text-align:left}
.cdx .note{font-size:13px;color:#64748b;margin-top:12px}
.cdx .list{margin:0;padding-left:18px;color:#94a3b8;font-size:14px}
.cdx .list li{margin:6px 0}
.cdx .wide{grid-column:1/-1}
.cdx .form-message{grid-column:1/-1;color:#67e8f9;margin:12px 0 0}
@media(max-width:800px){.cdx .grid,.cdx .row{grid-template-columns:1fr}}
`;

export function DashboardToolLayout({ id, children, fullBleed = false }: { id: string; children: ReactNode; fullBleed?: boolean }) {
  const content = (
    <>
      <div className="cdx-top"><a href="/?auth=login">Sign in</a></div>
      <nav className="pills" aria-label="Dashboard">
        <a href="/dashboard">Overview</a>
        <a href="/dashboard/credits">Credits</a>
        <a href="/dashboard/billing">Billing</a>
        <a href="/dashboard/productions">Productions</a>
        <a href="/dashboard/create?type=AI%20Video&category=video">Assistant</a>
        <a href="/dashboard/growth-intelligence">Growth Intelligence</a>
        <a href="/dashboard/partners">Partners</a>
        <a href="/pricing">Pricing</a>
      </nav>
      {children}
    </>
  );

  if (fullBleed) {
    return (
      <main className="cdx-full-page">
        <style>{CDX_CSS}</style>
        <div className="cdx cdx-full-bleed" id={id} style={CDX_GLOW}>
          <div className="cdx-shell w-full">
            <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">{content}</div>
          </div>
          <DashboardFooter />
        </div>
      </main>
    );
  }

  return (
    <main className="container section dashboard-postlaunch-shell">
      <style>{CDX_CSS}</style>
      <div className="cdx" id={id}>{content}</div>
    </main>
  );
}
