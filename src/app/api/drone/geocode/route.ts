import { geocodeAddress } from "@/lib/providers/google-maps";

function normalizeAddress(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ı/g, "i").replace(/[^a-z0-9]+/g, " ").trim();
}

function hasConfidentAddressMatch(query: string, formattedAddress: string) {
  const source = normalizeAddress(query);
  const result = normalizeAddress(formattedAddress);
  const localityChecks = [
    { queryToken: "guzelbahce", resultTokens: ["guzelbahce"] },
    { queryToken: "maltepe", resultTokens: ["maltepe"] },
    { queryToken: "dumanca", resultTokens: ["dumanca"] },
    { queryToken: "trio", resultTokens: ["trio"] }
  ];
  return localityChecks.every(({ queryToken, resultTokens }) => !source.includes(queryToken) || resultTokens.some((token) => result.includes(token)));
}

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
    if (!hasConfidentAddressMatch(address, first.formatted_address)) {
      return Response.json({
        error: "The map provider returned a different nearby address. Keep the original address or refine it before using coordinates.",
        status: "MISMATCHED_RESULT",
        originalAddress: address,
        formattedAddress: first.formatted_address,
        coordinates: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        requiresManualConfirmation: true
      }, { status: 422 });
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
