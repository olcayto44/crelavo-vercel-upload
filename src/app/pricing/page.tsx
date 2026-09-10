import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "Crelavo Pricing",
  description: "Pricing page is being rebuilt."
};

export default async function PricingPage() {
  const siteContent = await getConfiguredSiteContentConfig();
  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section pricing-page">
        <h1>Pricing is being rebuilt</h1>
        <p>The new pricing layout will be added here.</p>
      </main>
    </>
  );
}