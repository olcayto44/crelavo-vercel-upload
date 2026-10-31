import { createWebsitePlan } from "@/lib/website-domain";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid JSON request." }, { status: 400 });

  const projectId = String(body.project_id ?? "").trim();
  if (!projectId) return Response.json({ error: "project_id is required." }, { status: 400 });

  const brief = body.brief && typeof body.brief === "object" ? body.brief as Parameters<typeof createWebsitePlan>[0] : {};
  const plan = createWebsitePlan(brief, projectId);
  return Response.json({ plan });
}
