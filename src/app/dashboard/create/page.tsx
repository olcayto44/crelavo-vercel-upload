import { Suspense } from "react";
import CreateProductionGate from "@/components/assistant-work/CreateProductionGate";

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreateProductionGate />
    </Suspense>
  );
}
