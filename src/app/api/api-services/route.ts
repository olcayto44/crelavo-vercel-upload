import { getConfiguredApiServiceGroups } from "@/lib/api-services-loader";

export async function GET() {
  const apiServiceGroups = await getConfiguredApiServiceGroups();
  return Response.json({ apiServiceGroups });
}
