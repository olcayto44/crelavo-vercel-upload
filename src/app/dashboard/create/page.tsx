import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CreateProductionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const assistantParams = new URLSearchParams();

  for (const key of ["type", "category", "mode", "idea", "requestType", "providerTest"]) {
    const value = firstParam(params?.[key]);
    if (value) assistantParams.set(key, value);
  }

  redirect(`/dashboard/assistant-workspace${assistantParams.toString() ? `?${assistantParams.toString()}` : ""}`);
}
