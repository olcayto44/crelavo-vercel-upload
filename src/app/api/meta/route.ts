import { getMetaAdAccount, getMetaInsights, getMetaPages } from "@/lib/providers/meta";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "ad-account";

  try {
    if (action === "pages") {
      const result = await getMetaPages(url.searchParams.get("fields") || undefined);
      return Response.json({ action, result });
    }

    if (action === "insights") {
      const result = await getMetaInsights(url.searchParams.get("fields") || undefined, url.searchParams.get("date_preset") || undefined);
      return Response.json({ action, result });
    }

    const result = await getMetaAdAccount(url.searchParams.get("fields") || undefined);
    return Response.json({ action: "ad-account", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta Graph request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
