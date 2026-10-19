import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import { assistantWorkspaceHref } from "@/lib/assistant-links";
import { getLocalizedEuropePage, localizedEuropePages, localizedLanguageAlternates } from "@/lib/localized-europe-pages";
import { localizedSeoNavLinks } from "@/lib/site-content-config";
import { productionSiteUrl, serializeProductionJsonLd } from "@/lib/production-seo";

const page = getLocalizedEuropePage("zh", "ai-video-generator")!;
const siteUrl = productionSiteUrl();
const url = siteUrl + page.path;
const previewTerms = "需要绑定支付卡。Pro 提供 24 小时预览，可制作 1 个项目，预览期间不可下载。预览结束后每月 9.99 美元，除非提前取消。付费订阅开始后开放下载，制作点数另行购买。";

export const metadata: Metadata = {
  title: { absolute: page.title }, description: page.description, keywords: page.keywords,
  alternates: { canonical: url, languages: { "en-US": "/ai-video-generator", ...localizedLanguageAlternates(), "x-default": "/ai-video-generator" } },
  openGraph: { title: page.title, description: page.description, url, type: "website", locale: "zh_CN", siteName: "Crelavo",
    images: [{ url: siteUrl + "/showcase/ai-production-studio.webp", alt: "Crelavo AI 视频制作工作室" }] },
  twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [siteUrl + "/showcase/ai-production-studio.webp"] },
  robots: { index: true, follow: true }
};

const related = [
  { href: "/tools/product-url-to-video-ai", label: "产品链接转视频" },
  { href: "/tools/ai-movies-generator", label: "AI 电影与概念短片" },
  { href: "/tools/ai-series-creator", label: "AI 系列内容制作" },
  { href: "/tools/ai-music-video-generator", label: "AI 音乐视频" },
  { href: "/tools/talking-avatars-for-ads", label: "数字人广告视频" }
];

export default function ChineseVideoGeneratorPage() {
  const schema = { "@context": "https://schema.org", "@type": "WebPage", "@id": url + "#webpage", url,
    name: page.title, description: page.description, inLanguage: page.hreflang,
    isPartOf: { "@type": "WebSite", name: "Crelavo", url: siteUrl } };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeProductionJsonLd(schema) }} />
    <Header navLinks={localizedSeoNavLinks} languageOverride="zh" /><InnerMobileNav />
    <main lang="zh-Hans" className="public-funnel-page localized-europe-page">
      <section className="container section clean-feed-section localized-hero">
        <nav className="localized-language-switcher" aria-label="选择语言">
          <Link href="/ai-video-generator" hrefLang="en-US" lang="en">English</Link>
          {localizedEuropePages.map(item => <Link href={item.path} hrefLang={item.hreflang} lang={item.hreflang} className={item.locale === "zh" ? "active" : undefined} aria-current={item.locale === "zh" ? "page" : undefined} key={item.path}>{item.languageName}</Link>)}
        </nav>
        <span className="badge">{page.eyebrow}</span><h1 style={{ lineHeight: 1.25, letterSpacing: "normal" }}>{page.h1}</h1>
        <p className="section-lead">{page.lead}</p><p className="localized-market-note">{page.marketNote}</p>
        <div className="sample-detail-actions"><Link className="btn" href={assistantWorkspaceHref("为产品制作视频广告", "social", "campaign")}>{page.primaryCta}</Link><Link className="btn secondary" href="/pricing">{page.secondaryCta}</Link></div>
        <p>{previewTerms}</p>
      </section>
      <section className="container section home-section-tight clean-feed-section"><div className="admin-category-grid">{page.sections.map(section => <article className="card admin-category-card" key={section.title}><h2>{section.title}</h2><p>{section.body}</p></article>)}</div></section>
      <section className="container section home-section-tight clean-feed-section"><h2>适合哪些制作需求？</h2><div className="showcase-pill-row">{page.useCases.map(item => <span key={item}>{item}</span>)}</div></section>
      <section className="container section home-section-tight clean-feed-section"><h2>继续了解制作流程</h2><p>以下工具说明页面目前为英文。</p><ul>{related.map(item => <li key={item.href}><Link href={item.href} hrefLang="en">{item.label}</Link></li>)}</ul></section>
    </main>
  </>;
}
