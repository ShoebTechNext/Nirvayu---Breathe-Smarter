import { findNearestIndianCity, isWithinIndiaBounds } from "@/lib/cities";
import {
  enforceSameOrigin,
  fetchJsonWithTimeout,
  jsonError,
  jsonOk,
  rateLimitGuard,
} from "@/lib/server-utils";
import type { GeoResult } from "@/lib/types";
import {
  CoordsQuerySchema,
  GeocodeSearchSchema,
  sanitizePlainText,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

interface OpenMeteoGeoResponse {
  results?: {
    name?: string;
    admin1?: string;
    country_code?: string;
    latitude?: number;
    longitude?: number;
  }[];
}

interface NominatimReverseResponse {
  name?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country_code?: string;
  };
}

export async function GET(request: Request) {
  const originErr = enforceSameOrigin(request);
  if (originErr) return originErr;

  const limitErr = rateLimitGuard(request, "geocode", 60);
  if (limitErr) return limitErr;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  // Mode 1: Forward search restricted to India
  if (query !== null) {
    const parsed = GeocodeSearchSchema.safeParse({
      q: sanitizePlainText(query),
    });
    if (!parsed.success) {
      return jsonError("Please enter a valid Indian city or town name.", 400);
    }

    try {
      const encoded = encodeURIComponent(parsed.data.q);
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=8&language=en&format=json&countryCode=IN`;
      const raw = await fetchJsonWithTimeout<OpenMeteoGeoResponse>(
        url,
        undefined,
        8_000
      );

      const results: GeoResult[] = (raw.results ?? [])
        .filter(
          (item) =>
            item.country_code === "IN" &&
            typeof item.latitude === "number" &&
            typeof item.longitude === "number" &&
            isWithinIndiaBounds(item.latitude, item.longitude) &&
            typeof item.name === "string"
        )
        .map((item) => ({
          name: item.name!,
          admin1: item.admin1,
          countryCode: "IN",
          lat: item.latitude!,
          lon: item.longitude!,
        }));

      return jsonOk({ results });
    } catch (err) {
      console.error("[/api/geocode] Forward geocoding failed:", err);
      return jsonError("Location search service is temporarily unavailable.", 502);
    }
  }

  // Mode 2: Reverse geocoding inside India bounds
  if (latParam !== null && lonParam !== null) {
    const parsed = CoordsQuerySchema.safeParse({
      lat: Number(latParam),
      lon: Number(lonParam),
    });
    if (!parsed.success) {
      return jsonError(
        "Coordinates must fall within India bounds.",
        400
      );
    }

    const { lat, lon } = parsed.data;
    const nearest = findNearestIndianCity(lat, lon);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=12&accept-language=en`;
      const raw = await fetchJsonWithTimeout<NominatimReverseResponse>(
        url,
        {
          headers: {
            "User-Agent": "NirvayuCleanAirAssistant/1.0 (https://nirvayu.vercel.app)",
          },
        },
        6_000
      );

      const addr = raw.address;
      const resolvedName =
        addr?.city ||
        addr?.town ||
        addr?.village ||
        addr?.suburb ||
        addr?.state_district ||
        addr?.county ||
        raw.name ||
        nearest.name;

      return jsonOk({
        name: sanitizePlainText(resolvedName).slice(0, 80) || nearest.name,
        admin1: addr?.state ? sanitizePlainText(addr.state).slice(0, 60) : nearest.state,
        lat,
        lon,
        fallback: false,
      });
    } catch (err) {
      console.error("[/api/geocode] Reverse geocode fallback to nearest city:", err);
      return jsonOk({
        name: `Near ${nearest.name}`,
        admin1: nearest.state,
        lat,
        lon,
        fallback: true,
      });
    }
  }

  return jsonError("Provide either 'q' or 'lat' and 'lon' query parameters.", 400);
}
