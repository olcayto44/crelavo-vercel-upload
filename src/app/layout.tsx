import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFooterVisibility } from "@/components/AdminFooterVisibility";
import { LiveVisitorTracker } from "@/components/LiveVisitorTracker";
import { OAuthWelcomeCreditClient } from "@/components/OAuthWelcomeCreditClient";
import { PartnerReferralTracker } from "@/components/PartnerReferralTracker";
import { PublicSideRail } from "@/components/PublicSideRail";
import { RouteAwareFooter } from "@/components/RouteAwareFooter";
import { SiteFooter } from "@/components/SiteFooter";
import { YandexMetrica } from "@/components/YandexMetrica";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");
const siteName = "Crelavo";
const title = "AI Production Studio for Websites, Apps & E-Commerce | Crelavo";
const description = "Turn Shopify, Amazon, and Trendyol links into AI videos, mobile apps, and websites. Launch complete marketing campaigns in minutes with Crelavo AI Studio.";
const socialTitle = "Crelavo - Global AI Production Studio";
const socialDescription = "Launch websites, mobile apps, and product video campaigns from one single AI production studio.";

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
    "managed AI production"
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
    images: [{ url: "/showcase/ai-production-studio.webp", width: 1200, height: 630, alt: "Crelavo AI production studio preview" }]
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
    "msvalidate.01": "B09A1EA26FA6A860ED1A8E4217D2320E"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}><AdminFooterVisibility /></Suspense>
        <Suspense fallback={null}><LiveVisitorTracker /></Suspense>
        <Suspense fallback={null}><PartnerReferralTracker /></Suspense>
        <Suspense fallback={null}><OAuthWelcomeCreditClient /></Suspense>
        <Suspense fallback={null}><YandexMetrica /></Suspense>
        <Suspense fallback={null}><PublicSideRail /></Suspense>
        {children}
        <RouteAwareFooter><SiteFooter /></RouteAwareFooter>
      </body>
    </html>
  );
}
