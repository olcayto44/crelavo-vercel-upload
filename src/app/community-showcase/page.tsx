import {categoryDetailMeta} from "@/lib/category-detail-meta";
import type { Metadata } from "next";
import { PhaseOneFeaturePageView } from "@/components/PhaseOneFeaturePage";
import { getPhaseOneFeature } from "@/lib/feature-phase-one";

const page = getPhaseOneFeature("community-showcase")!;

export const metadata: Metadata = categoryDetailMeta("community_showcase");

export default function CommunityShowcasePage() {
  return <PhaseOneFeaturePageView page={page} />;
}
