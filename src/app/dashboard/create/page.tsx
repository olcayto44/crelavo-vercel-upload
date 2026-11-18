import { redirect } from "next/navigation";

/** Preserve the selected category and brief when following legacy production links. */
export default async function CreatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const source = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) value.forEach(item=>query.append(key,item));
    else if (value !== undefined) query.set(key,value);
  }
  redirect("/dashboard/assistant-workspace" + (query.size ? "?" + query.toString() : ""));
}
