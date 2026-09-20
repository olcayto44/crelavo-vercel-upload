import { Suspense } from "react";
import AssistantPage from "@/components/assistant-work/AssistantPage";

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <AssistantPage />
    </Suspense>
  );
}
