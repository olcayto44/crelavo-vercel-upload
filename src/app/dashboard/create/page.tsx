import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { ProductionStudio } from "@/components/ProductionStudio";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CreateProductionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialIdea = firstParam(params?.idea);
  const initialType = firstParam(params?.type) || firstParam(params?.category) || "AI Video";
  const advancedMode = firstParam(params?.advanced) === "1" || firstParam(params?.mode) === "advanced";
  if (!advancedMode) {
    const query = new URLSearchParams();
    if (initialIdea) query.set("idea", initialIdea);
    if (initialType) query.set("category", initialType);
    redirect(`/dashboard/assistant-workspace${query.toString() ? `?${query.toString()}` : ""}`);
  }

  return (
    <DashboardShell className="dashboard-postlaunch-shell production-create-shell">
      <ProductionStudio initialIdea={initialIdea} initialType={initialType} />
    </DashboardShell>
  );
}
