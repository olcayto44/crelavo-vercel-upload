import {categoryDetailMeta} from "@/lib/category-detail-meta";
import type { Metadata } from "next";
import { PhaseOneFeaturePageView } from "@/components/PhaseOneFeaturePage";
import { getPhaseOneFeature } from "@/lib/feature-phase-one";

const page = getPhaseOneFeature("ai-virtual-model-studio")!;

export const metadata: Metadata = categoryDetailMeta("virtual_model_studio");

export default function AiVirtualModelStudioPage() {
  return <PhaseOneFeaturePageView page={page} />;
}
