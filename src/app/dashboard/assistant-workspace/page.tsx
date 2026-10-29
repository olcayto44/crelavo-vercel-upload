import { Suspense } from "react";
import CreateProductionGate from "@/components/assistant-work/CreateProductionGate";

/** Share the same feature-flagged assistant entry point for consistent rollback behavior. */
export default function AssistantWorkspacePage() {
  return (
    <Suspense fallback={null}>
      <CreateProductionGate />
    </Suspense>
  );
}
