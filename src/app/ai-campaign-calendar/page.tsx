import {categoryDetailMeta} from "@/lib/category-detail-meta";
import type { Metadata } from "next";
import { PhaseOneFeaturePageView } from "@/components/PhaseOneFeaturePage";
import { getPhaseOneFeature } from "@/lib/feature-phase-one";

const page = getPhaseOneFeature("ai-campaign-calendar")!;

export const metadata: Metadata = categoryDetailMeta("campaign_calendar");

export default function AiCampaignCalendarPage() {
  return <PhaseOneFeaturePageView page={page} />;
}
