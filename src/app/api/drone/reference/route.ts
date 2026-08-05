import { geocodeAddress } from "@/lib/providers/google-maps";

function normalizeAddress(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ı/g, "i").replace(/[^a-z0-9]+/g, " ").trim();
}

function hasConfidentAddressMatch(query: string, formattedAddress: string) {
  const source = normalizeAddress(query);
  const result = normalizeAddress(formattedAddress);
  const checks = [
    { token: "guzelbahce", matches: ["guzelbahce"] },
    { token: "maltepe", matches: ["maltepe"] },
    { token: "dumanca", matches: ["dumanca"] },
    { token: "trio", matches: ["trio"] }
  ];
  return checks.every(({ token, matches }) => !source.includes(token) || matches.some((candidate) => result.includes(candidate)));
}

function coordinatesFromQuery(value: string) {
  const match = value.match(/(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/);
  return match ? { lat: Number(match[1]), lng: Number(match[2]) } : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = String(url.searchParams.get("address") ?? "").trim();
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_API_KEY;
  if (!address) return Response.json({ error: "address is required." }, { status: 400 });
  if (!key) return Response.json({ error: "Google Maps reference provider is not configured." }, { status: 503 });

  try {
    let coordinates = coordinatesFromQuery(address);
    let formattedAddress = address;
    if (!coordinates) {
      const result = await geocodeAddress(address);
      const first = result.results[0];
      const location = first?.geometry?.location;
      if (!first || !location) return Response.json({ error: "No coordinates found for this drone address." }, { status: 404 });
      if (!hasConfidentAddressMatch(address, first.formatted_address)) {
        return Response.json({ error: "The map provider returned a different nearby address. Keep the original address or add confirmed coordinates before starting." }, { status: 422 });
      }
      coordinates = { lat: location.lat, lng: location.lng };
      formattedAddress = first.formatted_address;
    }

    const mapUrl = new URL("https://maps.googleapis.com/maps/api/staticmap");
    mapUrl.searchParams.set("center", `${coordinates.lat},${coordinates.lng}`);
    mapUrl.searchParams.set("zoom", "18");
    mapUrl.searchParams.set("size", "640x640");
    mapUrl.searchParams.set("scale", "2");
    mapUrl.searchParams.set("maptype", "satellite");
    mapUrl.searchParams.set("markers", `color:red|${coordinates.lat},${coordinates.lng}`);
    mapUrl.searchParams.set("key", key);

    const imageResponse = await fetch(mapUrl, { cache: "no-store" });
    if (!imageResponse.ok) return Response.json({ error: `Satellite reference could not be generated: ${imageResponse.status}` }, { status: 502 });
    const contentType = imageResponse.headers.get("content-type") || "image/png";
    return new Response(await imageResponse.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "X-Drone-Reference-Address": formattedAddress
      }
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Satellite reference could not be generated." }, { status: 500 });
  }
}
