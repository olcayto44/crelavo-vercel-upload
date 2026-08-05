import { geocodeAddress } from "@/lib/providers/google-maps";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = String(url.searchParams.get("address") ?? "").trim();
  if (!address) return Response.json({ error: "address is required." }, { status: 400 });

  try {
    const result = await geocodeAddress(address);
    const first = result.results[0];
    const location = first?.geometry?.location;
    if (!first || !location) {
      return Response.json({ error: "No coordinates found for this address.", status: result.status, results: [] }, { status: 404 });
    }

    return Response.json({
      status: result.status,
      formattedAddress: first.formatted_address,
      placeId: first.place_id ?? "",
      latitude: location.lat,
      longitude: location.lng,
      coordinates: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coordinates could not be found.";
    return Response.json({ error: message }, { status: 500 });
  }
}
