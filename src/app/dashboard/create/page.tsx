import { Suspense } from "react";
import CreateProductionGate from "@/components/assistant-work/CreateProductionGate";
import { RequireFreeAccount } from "@/components/auth/RequireFreeAccount";

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <RequireFreeAccount><CreateProductionGate /></RequireFreeAccount>
    </Suspense>
  );
}
