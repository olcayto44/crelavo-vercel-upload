"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Globe2, Play, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const heroScenes = [
  {
    kicker: "Product link to video",
    title: "Create campaign-ready product videos from one brief.",
    text: "Turn Shopify, Amazon, Trendyol or direct product ideas into ad hooks, storyboard direction, visuals, voice and delivery-ready creative packages.",
    cta: "Create product video",
    href: "/ai-product-video-generator",
    tone: "cyan",
    tags: ["Product URL", "Ad score", "Storyboard", "Delivery"]
  },
  {
    kicker: "Global localization",
    title: "Adapt one campaign for multiple markets.",
    text: "Prepare country-specific hooks, claims, buyer psychology, CTA direction and localized video briefs before spending production credits.",
    cta: "Plan localization",
    href: "/ai-cultural-localization",
    tone: "purple",
    tags: ["Country fit", "Localized hooks", "Market proof", "Human QA"]
  },
  {
    kicker: "AI production workspace",
    title: "Videos, websites, apps and campaign assets in one system.",
    text: "Crelavo combines AI speed with human quality assurance for source handoff, preview links, final files, revisions and campaign-ready delivery.",
    cta: "Start with Assistant",
    href: "/dashboard/assistant-workspace",
    tone: "green",
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
            <div className="crelavo-hero-orb hero-orb-main" />
            <div className="crelavo-hero-orb hero-orb-secondary" />
            <div className="crelavo-hero-interface">
              <div className="hero-interface-top">
                <span>{scene.kicker}</span>
                <small>AI + Human QA</small>
              </div>
              <div className="hero-interface-main">
                <div className="hero-preview-window">
                  <Play size={28} />
                  <strong>{scene.tags[0]}</strong>
                </div>
                <div className="hero-stack">
                  {scene.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <div className="hero-timeline"><i /><i /><i /><i /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="container crelavo-premium-hero-inner">
        <div className="crelavo-hero-copy">
          <span className="badge"><Sparkles size={15} /> Crelavo AI Production Studio</span>
          <h1>Create videos, websites, ads and campaign assets from one AI workspace.</h1>
          <p>Premium production paths for ecommerce teams, creators and businesses — with AI speed, human quality assurance, clear credits and delivery-ready outputs.</p>
          <div className="crelavo-hero-actions">
            <Link className="btn" href="/dashboard/assistant-workspace">Start with Assistant <ArrowRight size={16} /></Link>
            <Link className="btn secondary" href="/free-tools/ad-performance-score-checker">Score my ad free</Link>
            <Link className="btn secondary" href="/pricing">View pricing</Link>
          </div>
          <div className="crelavo-hero-model-strip" aria-label="Crelavo production capabilities">
            {["Product videos", "Ad scoring", "Virtual models", "Localization", "Websites", "Voiceover", "Campaign assets"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>

        <div className="crelavo-hero-live-card" aria-live="polite">
          <span><Globe2 size={15} /> {activeScene.kicker}</span>
          <h2>{activeScene.title}</h2>
          <p>{activeScene.text}</p>
          <div className="crelavo-hero-tags">
            {activeScene.tags.map((tag) => <small key={tag}><BadgeCheck size={13} /> {tag}</small>)}
          </div>
          <Link className="btn" href={activeScene.href}>{activeScene.cta}</Link>
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
