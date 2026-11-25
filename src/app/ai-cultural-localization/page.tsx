import {categoryDetailMeta} from "@/lib/category-detail-meta";
import type { Metadata } from "next";
import { PhaseOneFeaturePageView } from "@/components/PhaseOneFeaturePage";
import { getPhaseOneFeature } from "@/lib/feature-phase-one";

const page = getPhaseOneFeature("ai-cultural-localization")!;

export const metadata: Metadata = categoryDetailMeta("cultural_localization");

export default function AiCulturalLocalizationPage() {
  return <PhaseOneFeaturePageView page={page} />;
}
