import { calculateIndianAqi, getAqiCategory } from "@/lib/aqi";
import { MAJOR_INDIAN_CITIES } from "@/lib/cities";
import {
  enforceSameOrigin,
  fetchJsonWithTimeout,
  jsonOk,
  rateLimitGuard,
} from "@/lib/server-utils";
import type { CitySnapshot, Pollutants } from "@/lib/types";

export const dynamic = "force-dynamic";

interface OpenMeteoCurrentBlock {
  time?: string;
  pm10?: number;
  pm2_5?: number;
  carbon_monoxide?: number;
  nitrogen_dioxide?: number;
  sulphur_dioxide?: number;
  ozone?: number;
  us_aqi?: number;
}

interface OpenMeteoBatchItem {
  latitude?: number;
  longitude?: number;
  current?: OpenMeteoCurrentBlock;
}

interface CachedCitiesPayload {
  cities: CitySnapshot[];
  cachedAt: string;
  expiresAt: number;
  fallback: boolean;
}

const TEN_MINUTES_MS = 10 * 60 * 1000;
let citiesCache: CachedCitiesPayload | null = null;

function buildFallbackSnapshots(): CitySnapshot[] {
  const now = new Date().toISOString();
  // Deterministic winter baseline only used if live Open-Meteo API is unreachable
  const baselinePm25: Record<string, number> = {
    delhi: 148,
    kanpur: 122,
    patna: 118,
    lucknow: 112,
    varanasi: 108,
    amritsar: 102,
    jaipur: 84,
    kolkata: 76,
    bhopal: 64,
    raipur: 72,
    indore: 58,
    ahmedabad: 62,
    mumbai: 54,
    pune: 48,
    nagpur: 56,
    chandigarh: 68,
    ranchi: 65,
    guwahati: 52,
    bhubaneswar: 46,
    dehradun: 55,
    srinagar: 60,
    hyderabad: 44,
    bengaluru: 34,
    chennai: 32,
    kochi: 24,
    visakhapatnam: 38,
    surat: 51,
    thiruvananthapuram: 22,
  };

  return MAJOR_INDIAN_CITIES.map((city) => {
    const pm25 = baselinePm25[city.id] ?? 55;
    const pm10 = Math.round(pm25 * 1.65);
    const pollutants: Pollutants = {
      pm25,
      pm10,
      no2: Math.round(pm25 * 0.45),
      o3: 42,
      co: 850,
      so2: 14,
    };
    const { indianAqi } = calculateIndianAqi(pollutants);
    return {
      ...city,
      indianAqi,
      usAqi: Math.round(indianAqi * 0.85),
      category: getAqiCategory(indianAqi),
      pm25,
      pm10,
      updatedAt: now,
    };
  });
}

export async function GET(request: Request) {
  const originErr = enforceSameOrigin(request);
  if (originErr) return originErr;

  const limitErr = rateLimitGuard(request, "cities", 60);
  if (limitErr) return limitErr;

  const nowMs = Date.now();
  if (citiesCache && citiesCache.expiresAt > nowMs && !citiesCache.fallback) {
    return jsonOk(
      {
        cities: citiesCache.cities,
        cachedAt: citiesCache.cachedAt,
        fallback: false,
        count: citiesCache.cities.length,
      },
      { cacheControl: "public, max-age=120" }
    );
  }

  try {
    const latitudes = MAJOR_INDIAN_CITIES.map((c) => c.lat).join(",");
    const longitudes = MAJOR_INDIAN_CITIES.map((c) => c.lon).join(",");
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitudes}&longitude=${longitudes}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=Asia%2FKolkata`;

    const raw = await fetchJsonWithTimeout<
      OpenMeteoBatchItem[] | OpenMeteoBatchItem
    >(url, undefined, 10_000);
    const items = Array.isArray(raw) ? raw : [raw];
    const nowIso = new Date().toISOString();

    const snapshots: CitySnapshot[] = MAJOR_INDIAN_CITIES.map((city, idx) => {
      const curr = items[idx]?.current;
      const pollutants: Pollutants = {
        pm25: Number((curr?.pm2_5 ?? 30).toFixed(1)),
        pm10: Number((curr?.pm10 ?? 50).toFixed(1)),
        no2: Number((curr?.nitrogen_dioxide ?? 20).toFixed(1)),
        o3: Number((curr?.ozone ?? 35).toFixed(1)),
        co: Number((curr?.carbon_monoxide ?? 400).toFixed(0)),
        so2: Number((curr?.sulphur_dioxide ?? 10).toFixed(1)),
      };
      const { indianAqi } = calculateIndianAqi(pollutants);
      return {
        ...city,
        indianAqi,
        usAqi: Math.round(curr?.us_aqi ?? indianAqi * 0.85),
        category: getAqiCategory(indianAqi),
        pm25: pollutants.pm25,
        pm10: pollutants.pm10,
        updatedAt: curr?.time ?? nowIso,
      };
    });

    citiesCache = {
      cities: snapshots,
      cachedAt: nowIso,
      expiresAt: nowMs + TEN_MINUTES_MS,
      fallback: false,
    };

    return jsonOk(
      {
        cities: snapshots,
        cachedAt: nowIso,
        fallback: false,
        count: snapshots.length,
      },
      { cacheControl: "public, max-age=120" }
    );
  } catch (err) {
    console.error("[/api/cities] Live Open-Meteo fetch failed:", err);
    if (citiesCache) {
      return jsonOk({
        cities: citiesCache.cities,
        cachedAt: citiesCache.cachedAt,
        fallback: true,
        count: citiesCache.cities.length,
      });
    }
    const fallbackCities = buildFallbackSnapshots();
    return jsonOk({
      cities: fallbackCities,
      cachedAt: new Date().toISOString(),
      fallback: true,
      count: fallbackCities.length,
    });
  }
}
