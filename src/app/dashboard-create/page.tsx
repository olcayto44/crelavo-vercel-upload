import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const dynamic = "force-dynamic";

export default async function LegacyDashboardCreatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = first(params?.category) || "ecommerce";
  const idea = first(params?.idea) || first(params?.type) || (category === "ecommerce" ? "E-commerce store builder" : category);
  const query = new URLSearchParams({ mode: "project", category, idea });
  redirect(`/dashboard/assistant-workspace?${query.toString()}`);
}
