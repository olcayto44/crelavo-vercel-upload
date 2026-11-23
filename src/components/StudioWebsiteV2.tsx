"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { WebsiteBuilderForm } from "@/components/WebsiteBuilderForm";

const steps = [
  ["01", "Brief", "Marka, hedef kitle, sayfalar"],
  ["02", "Production", "Gerçek HTML / CSS / JS"],
  ["03", "Preview", "Sayfaları kontrol et"],
  ["04", "Delivery", "Kaynak ZIP ve revizyon"]
] as const;

export function StudioWebsiteV2() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"build" | "guide">("build");
  const uiLang = params.get("uiLang") || "tr";
  const tr = uiLang !== "en";
  return (
    <main className="crelavo-v2">
      <style>{`
        .crelavo-v2{min-height:100vh;background:#0b0912;color:#f5f0ff;font:14px/1.5 Inter,system-ui,sans-serif;--panel:#171222;--stroke:#31243d;--accent:#be70fe}
        .crelavo-v2 *{box-sizing:border-box}
        .crelavo-v2 a{color:inherit;text-decoration:none}
        .crelavo-v2 button{cursor:pointer}
        .cv2-top{min-height:64px;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-bottom:1px solid var(--stroke);gap:16px;background:#120e1a}
        .cv2-logo{font-size:20px;font-weight:800;letter-spacing:-.6px}.cv2-logo span{color:var(--accent)}.cv2-topright{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
        .cv2-pill{border:1px solid #4a365b;border-radius:99px;padding:6px 12px;color:#ddd1e8;font-size:12px}
        .cv2-layout{display:grid;grid-template-columns:210px minmax(0,1fr) 270px;min-height:calc(100vh - 64px)}
        .cv2-left,.cv2-right{padding:22px 16px;background:#120e1b}.cv2-left{border-right:1px solid var(--stroke)}.cv2-right{border-left:1px solid var(--stroke)}
        .cv2-sidebar-title{font-weight:700;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#9586a6;margin-bottom:16px}
        .cv2-nav{display:flex;flex-direction:column;gap:8px}
        .cv2-nav a,.cv2-nav .active{display:block;padding:12px 14px;border:1px solid transparent;border-radius:10px;color:#d0c4df;font-size:13px}
        .cv2-nav .active{background:#352046;border-color:#704289;color:#fff;font-weight:700}
        .cv2-nav a:hover{background:#21172e;border-color:#49335a}
        .cv2-main{min-width:0;padding:24px 28px 60px;background:radial-gradient(ellipse at 20% 0%,#24112f 0%,#100d18 40%,#0b0912 100%)}
        .cv2-kicker{color:#c58afd;text-transform:uppercase;letter-spacing:2px;font-size:11px;font-weight:700}
        .cv2-main h1{font-weight:750;font-size:clamp(24px,3vw,35px);letter-spacing:-.8px;margin:7px 0}
        .cv2-subtitle{color:#b6a9c5;max-width:720px;margin-bottom:22px}
        .cv2-tabs{display:flex;gap:8px;margin:20px 0 16px}
        .cv2-tabs button{border:1px solid var(--stroke);border-radius:9px;padding:10px 16px;background:#1c1626;color:#d5c9e2;font-weight:700}
        .cv2-tabs button[aria-selected=true]{background:#5c2877;border-color:#b36ce8;color:#fff}
        .cv2-content{border:1px solid #483152;border-radius:16px;padding:18px;background:#151020;box-shadow:0 20px 70px #0005;min-height:300px}
        .cv2-content input,.cv2-content textarea,.cv2-content select{max-width:100%}
        .cv2-section{border:1px solid var(--stroke);border-radius:12px;padding:16px;background:#1c1527;margin-bottom:16px}
        .cv2-section h3{margin:0 0 9px;font-size:14px}.cv2-section p{margin:0;font-size:12px;color:#b2a5c1}
        .cv2-step{display:flex;gap:12px;padding:13px 0;border-top:1px solid #32243d}
        .cv2-num{font-size:11px;color:#d59cff;border:1px solid #754c87;border-radius:6px;padding:3px 5px;align-self:flex-start}
        .cv2-step strong{display:block;font-size:12px}.cv2-step small{color:#a99cb7}
        .cv2-guide{padding:18px;color:#d3c4df}.cv2-guide h2{color:#fff}
        @media(max-width:1100px){.cv2-layout{grid-template-columns:180px minmax(0,1fr)}.cv2-right{display:none}}
        @media(max-width:700px){.cv2-layout{display:block}.cv2-left{border-bottom:1px solid var(--stroke);border-right:0;padding:10px}.cv2-nav{flex-direction:row;flex-wrap:wrap}.cv2-nav a,.cv2-nav .active{padding:8px 10px}.cv2-main{padding:18px 12px}.cv2-content{padding:10px}.cv2-top{padding:10px 14px}.cv2-logo{font-size:17px}}
      `}</style>
      <header className="cv2-top">
        <Link href="/" className="cv2-logo">CRELAVO<span> STUDIO V2</span></Link>
        <div className="cv2-topright">
          <span className="cv2-pill">{tr ? "Website üretim çalışma alanı" : "Website production workspace"}</span>
          <Link href="/dashboard" className="cv2-pill">{tr ? "Panelim" : "Dashboard"}</Link>
        </div>
      </header>
      <div className="cv2-layout">
        <aside className="cv2-left">
          <div className="cv2-sidebar-title">{tr ? "Üretim araçları" : "Production tools"}</div>
          <nav className="cv2-nav" aria-label="Studio categories">
            <span className="active">✦ AI Website Builder</span>
            <Link href="/dashboard/assistant-workspace?category=saas">SaaS Builder</Link>
            <Link href="/dashboard/assistant-workspace?category=mobile_app">App Builder</Link>
            <Link href="/dashboard/assistant-workspace?category=video">AI Video</Link>
            <Link href="/dashboard/assistant-workspace?category=image">AI Image</Link>
            <Link href="/dashboard/assistant-workspace">All categories</Link>
          </nav>
        </aside>
        <section className="cv2-main">
          <span className="cv2-kicker">Crelavo / AI Website Builder</span>
          <h1>{tr ? "Web siteni burada oluştur" : "Build your website here"}</h1>
          <p className="cv2-subtitle">{tr ? "Gerçek işletme bilgilerini gir, sayfalarını oluştur, önizle, düzenle ve kaynak ZIP dosyanı al." : "Enter your real business brief, generate pages, preview, revise, and receive your source ZIP."}</p>
          <div className="cv2-tabs" role="tablist">
            <button role="tab" aria-selected={tab==="build"} onClick={()=>setTab("build")}>{tr ? "Website Builder" : "Website Builder"}</button>
            <button role="tab" aria-selected={tab==="guide"} onClick={()=>setTab("guide")}>{tr ? "Üretim rehberi" : "Production guide"}</button>
          </div>
          <div className="cv2-content">
            {tab==="build" ? <WebsiteBuilderForm /> :
            <div className="cv2-guide">
              <h2>{tr ? "Website üretim adımları" : "Website production steps"}</h2>
              <p>{tr ? "Markanı, işini ve hedef kitleni açıklayarak başla. Sayfalarını seç, oluşturulan sonucu önizle ve gerekirse revize et." : "Start with your brand and target audience. Choose pages, inspect your preview, and revise if needed."}</p>
              <p>{tr ? "Bu sayfa çalışan Website Builder üretim ve teslimat arayüzünü kullanır. Kredi tahsilatı ayrı kontrollü aşamadır." : "This workspace uses the existing Website Builder and delivery flow. Paid credit charging is a separate gated release."}</p>
            </div>}
          </div>
        </section>
        <aside className="cv2-right">
          <div className="cv2-sidebar-title">{tr ? "Üretim aşamaları" : "Production flow"}</div>
          <div className="cv2-section">
            <h3>{tr ? "Website çalışma alanı" : "Website workspace"}</h3>
            <p>{tr ? "Üretim, önizleme ve dosya teslimatı tek ekranda." : "Generation, preview, and delivery in one place."}</p>
          </div>
          {steps.map(([num,name,desc])=><div className="cv2-step" key={num}><span className="cv2-num">{num}</span><div><strong>{name}</strong><small>{desc}</small></div></div>)}
        </aside>
      </div>
    </main>
  );
}
