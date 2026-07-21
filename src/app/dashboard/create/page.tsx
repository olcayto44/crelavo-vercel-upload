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

  return (
    <DashboardShell className="dashboard-postlaunch-shell production-create-shell">
      <ProductionStudio initialIdea={initialIdea} initialType={initialType} />
    </DashboardShell>
  );
}
