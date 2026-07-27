import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getPlaceDetails, geocodeAddress, searchPlaces } from "@/lib/providers/google-maps";

function assertSeoProviderAccess(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();
  return null;
}

export async function GET(request: Request) {
  const accessError = assertSeoProviderAccess(request);
  if (accessError) return accessError;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "search";
  const query = url.searchParams.get("query") || url.searchParams.get("address") || "";
  const placeId = url.searchParams.get("place_id") || "";

  try {
    if (action === "geocode") {
      if (!query) return Response.json({ error: "query or address is required." }, { status: 400 });
      const result = await geocodeAddress(query);
      return Response.json({ action, ...result });
    }

    if (action === "details") {
      if (!placeId) return Response.json({ error: "place_id is required." }, { status: 400 });
      const result = await getPlaceDetails(placeId);
      return Response.json({ action, ...result });
    }

    if (!query) return Response.json({ error: "query is required." }, { status: 400 });
    const result = await searchPlaces(query);
    return Response.json({ action: "search", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Maps request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
