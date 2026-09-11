import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import { PricingPageBody } from "@/components/PricingPageBody";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = { title: "Crelavo Pricing", description: "Pricing for production, live sales and intelligence." };

export default async function PricingPage() {
  const siteContent = await getConfiguredSiteContentConfig();
  return <><Header navLinks={siteContent.navLinks} />
      <InnerMobileNav /><main><PricingPageBody /></main></>;
}