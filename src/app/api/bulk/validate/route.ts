import { bulkSummary, parseCsvProducts } from "@/lib/phase2/bulk";

export async function POST(request: Request) {
  const body = await request.json();
  const csv = String(body.csv ?? "");
  const items = parseCsvProducts(csv);
  return Response.json({ items, summary: bulkSummary(items) });
}
