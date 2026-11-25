import {categoryDetailMeta} from "@/lib/category-detail-meta";
import type { Metadata } from "next";
import { PhaseOneFeaturePageView } from "@/components/PhaseOneFeaturePage";
import { getPhaseOneFeature } from "@/lib/feature-phase-one";

const page = getPhaseOneFeature("crelavo-academy")!;

export const metadata: Metadata = categoryDetailMeta("crelavo_academy");

export default function CrelavoAcademyPage() {
  return <PhaseOneFeaturePageView page={page} />;
}
