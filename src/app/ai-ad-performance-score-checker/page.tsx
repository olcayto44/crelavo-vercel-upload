import type { Metadata } from "next";
import { PhaseOneFeaturePageView } from "@/components/PhaseOneFeaturePage";
import { getPhaseOneFeature } from "@/lib/feature-phase-one";

const page = getPhaseOneFeature("ai-ad-performance-score-checker")!;

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  keywords: [page.primaryKeyword, ...page.keywords],
  alternates: { canonical: `/${page.slug}` },
  openGraph: { title: page.metaTitle, description: page.metaDescription, url: `/${page.slug}`, type: "website" },
  twitter: { card: "summary_large_image", title: page.metaTitle, description: page.metaDescription }
};

export default function AiAdPerformanceScoreCheckerPage() {
  return <PhaseOneFeaturePageView page={page} />;
}
