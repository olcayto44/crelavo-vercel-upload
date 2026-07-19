"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const heroScenes = [
  {
    kicker: "Product link to video",
    title: "Create campaign-ready product videos from one brief.",
    text: "Turn Shopify, Amazon, Trendyol or direct product ideas into ad hooks, storyboard direction, visuals, voice and delivery-ready creative packages.",
    cta: "Create product video",
    href: "/ai-product-video-generator",
    tone: "cyan",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-20-06/video/1784501597287558067-1784501597267.mp4",
    tags: ["Product URL", "Ad score", "Storyboard", "Delivery"]
  },
  {
    kicker: "Global localization",
    title: "Adapt one campaign for multiple markets.",
    text: "Prepare country-specific hooks, claims, buyer psychology, CTA direction and localized video briefs before spending production credits.",
    cta: "Plan localization",
    href: "/ai-cultural-localization",
    tone: "purple",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-20-06/video/1784501600346691878-1784501600336.mp4",
    tags: ["Country fit", "Localized hooks", "Market proof", "Human QA"]
  },
  {
    kicker: "AI production workspace",
    title: "Videos, websites, apps and campaign assets in one system.",
    text: "Crelavo combines AI speed with human quality assurance for source handoff, preview links, final files, revisions and campaign-ready delivery.",
    cta: "Start with Assistant",
    href: "/dashboard/assistant-workspace",
    tone: "green",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-20-06/video/1784501593829539623-1784501593820.mp4",
    tags: ["Video", "Website", "Voiceover", "Final ZIP"]
  }
];

export function CrelavoPremiumHero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroScenes.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  const activeScene = heroScenes[activeIndex];

  return (
    <section className={`crelavo-premium-hero hero-tone-${activeScene.tone}`} aria-label="Crelavo premium production hero">
      <div className="crelavo-hero-bg" aria-hidden="true">
        {heroScenes.map((scene, index) => (
          <div className={`crelavo-hero-scene ${index === activeIndex ? "active" : ""} scene-${scene.tone}`} key={scene.title}>
            <video className="crelavo-hero-video" src={scene.videoUrl} muted loop playsInline autoPlay preload={index === 0 ? "metadata" : "none"} />
            <div className="crelavo-hero-video-overlay" />
          </div>
        ))}
      </div>

      <div className="container crelavo-premium-hero-inner">
        <div className="crelavo-hero-copy">
          <span className="badge"><Sparkles size={15} /> Crelavo Yapay Zeka Üretim Stüdyosu</span>
          <h1>Tek bir yapay zeka çalışma alanından videolar, web siteleri, reklamlar ve kampanya materyalleri oluşturun.</h1>
          <p>E-ticaret ekipleri, içerik oluşturucular ve işletmeler için yapay zeka hızı, insan kalite güvencesi, net kredi bilgisi ve teslimata hazır çıktılar.</p>
          <div className="crelavo-hero-actions">
            <Link className="btn" href="/dashboard/assistant-workspace">Asistan ile başlayın <ArrowRight size={16} /></Link>
            <Link className="btn secondary" href="/free-tools/ad-performance-score-checker">Reklamımı ücretsiz puanla</Link>
            <Link className="btn secondary" href="/pricing">Fiyatları görüntüle</Link>
          </div>
          <div className="crelavo-hero-model-strip" aria-label="Crelavo production capabilities">
            {["Ürün videoları", "Reklam puanlaması", "Sanal modeller", "Yerelleştirme", "Web siteleri", "Seslendirme", "Kampanya varlıkları"].map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className="crelavo-hero-dots" aria-label="Hero scenes">
            {heroScenes.map((scene, index) => (
              <button key={scene.title} type="button" className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show ${scene.kicker}`} />
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
