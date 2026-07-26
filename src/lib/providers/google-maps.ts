import { requireProviderEnv } from "./env";

type GoogleMapsApiResponse<T> = {
  status: string;
  error_message?: string;
  results?: T[];
  result?: T;
};

function baseUrl() {
  return process.env.GOOGLE_MAPS_BASE_URL || "https://maps.googleapis.com/maps/api";
}

async function googleMapsJson<T>(endpoint: string, params: Record<string, string>) {
  const apiKey = requireProviderEnv("googleMaps");
  const url = new URL(`${baseUrl()}${endpoint}`);
  url.searchParams.set("key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Google Maps request failed: ${response.status} ${await response.text()}`);

  const data = await response.json() as GoogleMapsApiResponse<T>;
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Google Maps status: ${data.status}`);
  }
  return data;
}

export async function geocodeAddress(address: string) {
  const data = await googleMapsJson<{ formatted_address: string; geometry?: { location?: { lat: number; lng: number } }; place_id?: string }>("/geocode/json", { address });
  return {
    status: data.status,
    results: data.results ?? []
  };
}

export async function searchPlaces(query: string) {
  const data = await googleMapsJson<{ name: string; formatted_address?: string; place_id?: string; rating?: number }>("/place/textsearch/json", { query });
  return {
    status: data.status,
    results: data.results ?? []
  };
}

export async function getPlaceDetails(placeId: string, fields = "name,formatted_address,geometry,website,formatted_phone_number,rating,user_ratings_total") {
  const data = await googleMapsJson<{ name: string; formatted_address?: string; website?: string; formatted_phone_number?: string; rating?: number; user_ratings_total?: number }>("/place/details/json", { place_id: placeId, fields });
  return {
    status: data.status,
    result: data.result ?? null
  };
}
