import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFooterVisibility } from "@/components/AdminFooterVisibility";
import { ExitIntentLeadCapture } from "@/components/ExitIntentLeadCapture";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { LiveVisitorTracker } from "@/components/LiveVisitorTracker";
import { OAuthWelcomeCreditClient } from "@/components/OAuthWelcomeCreditClient";
import { PartnerReferralTracker } from "@/components/PartnerReferralTracker";
import { PreviewSupportBoxRouteGate } from "@/components/PreviewSupportBoxRouteGate";
import { PublicSideRail } from "@/components/PublicSideRail";
import { RouteAwareFooter } from "@/components/RouteAwareFooter";
import { SiteFooter } from "@/components/SiteFooter";
import { YandexMetrica } from "@/components/YandexMetrica";
import "./globals.css";

function safeSiteUrl(value?: string | null) {
  const fallback = "https://www.crelavo.com";
  const candidate = (value ?? fallback).trim().replace(/\/$/, "");
  try {
    return new URL(candidate).origin;
  } catch {
    return fallback;
  }
}

const siteUrl = safeSiteUrl(process.env.NEXT_PUBLIC_APP_URL);
const siteName = "Crelavo";
const title = "Crelavo | AI Video Generator & Live Streaming for Shopify Stores";
const description = "Convert product links into high-quality AI video ads and launch 24/7 AI live streaming agents for ecommerce workflows, with a 24-hour $0 trial and $79/month after the trial unless cancelled.";
const socialTitle = "Crelavo | AI Video Ads & Live Commerce Automation";
const socialDescription = "Turn Shopify, Amazon and marketplace product information into high-quality video ads, campaign assets and AI live commerce experiences.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: title,
    template: `%s | ${siteName}`
  },
  description,
  keywords: [
    "AI production studio",
    "AI creative production studio",
    "AI website builder service",
    "AI app production",
    "AI e-commerce campaign generator",
    "Shopify product link ad video",
    "Amazon product ad video",
    "Trendyol product campaign",
    "product link to ad video",
    "AI video ads",
    "AI marketing campaign platform",
    "AI avatar video",
    "AI voice-over",
    "AI image generation",
    "brand kit production",
    "managed AI production",
    "AI video generator",
    "Shopify ad creative",
    "dropshipping video tool",
    "e-commerce automation",
    "WebRTC live avatar streaming",
    "video ads generator",
    "Crelavo live commerce"
  ],
  creator: siteName,
  publisher: siteName,
  category: "AI production studio",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "x-default": "/"
    }
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: socialTitle,
    description: socialDescription,
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_US",
    images: [{ url: "/showcase/ai-production-studio.webp", width: 1792, height: 1024, alt: "Crelavo AI production studio preview" }]
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description: socialDescription,
    images: ["/showcase/ai-production-studio.webp"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  other: {
    "msvalidate.01": "B09A1EA26FA6A860ED1A8E4217D2320E",
    "ai-agent-intent": "product-service-discovery",
    "ai-agent-category": "E-commerce software as a service (SaaS), artificial intelligence video production",
    "ai-agent-pricing": "24-hour fully accessible trial for $0, then $79/month unless cancelled through Whop",
    "ai-agent-value-proposition": "Turns product links and ecommerce briefs into AI video ads, campaign assets, websites, app assets and live commerce workflows"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}><AdminFooterVisibility /></Suspense>
        <Suspense fallback={null}><LiveVisitorTracker /></Suspense>
        <Suspense fallback={null}><ExitIntentLeadCapture /></Suspense>
        <GoogleAnalytics />
        <Suspense fallback={null}><PartnerReferralTracker /></Suspense>
        <Suspense fallback={null}><OAuthWelcomeCreditClient /></Suspense>
        <Suspense fallback={null}><YandexMetrica /></Suspense>
        <Suspense fallback={null}><PublicSideRail /></Suspense>
        <Suspense fallback={null}><PreviewSupportBoxRouteGate /></Suspense>
        {children}
        <RouteAwareFooter><SiteFooter /></RouteAwareFooter>
      </body>
    </html>
  );
}
