import { Suspense } from "react";
import AssistantWorkspaceRoute from "@/components/AssistantWorkspaceRoute";

export default function AssistantWorkspacePage() {
  return (
    <Suspense fallback={null}>
      <AssistantWorkspaceRoute />
    </Suspense>
  );
}
