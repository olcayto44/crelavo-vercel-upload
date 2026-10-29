"use client";

import AssistantPage from "./AssistantPage";
import AssistantWorkspaceRoute from "@/components/AssistantWorkspaceRoute";

/**
 * Keep the existing production scene as the default until the new manager workspace has
 * passed Preview testing. Enable only on a Vercel Preview deployment with
 * NEXT_PUBLIC_CRELAVO_ASSISTANT_V2=1; production can be switched back by unsetting it.
 */
export default function CreateProductionGate() {
  const useAssistantV2 = process.env.NEXT_PUBLIC_CRELAVO_ASSISTANT_V2 === "1" || process.env.NEXT_PUBLIC_CRELAVO_ASSISTANT_V2 === "true";
  return useAssistantV2 ? <AssistantWorkspaceRoute /> : <AssistantPage />;
}
