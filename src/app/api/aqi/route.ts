import {
  calculateIndianAqi,
  computeBestWindow,
  getAqiCategory,
} from "@/lib/aqi";
import { findNearestIndianCity } from "@/lib/cities";
import {
  enforceSameOrigin,
  fetchJsonWithTimeout,
  jsonError,
  jsonOk,
  rateLimitGuard,
} from "@/lib/server-utils";
import type {
  AqiLocationData,
  DailyPoint,
  HourlyPoint,
  Pollutants,
} from "@/lib/types";
import { CoordsQuerySchema, sanitizePlainText } from "@/lib/validation";

export const dynamic = "force-dynamic";

interface OpenMeteoForecastResponse {
  current?: {
    time?: string;
    pm10?: number;
    pm2_5?: number;
    carbon_monoxide?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    us_aqi?: number;
  };
  hourly?: {
    time?: string[];
    pm10?: (number | null)[];
    pm2_5?: (number | null)[];
    carbon_monoxide?: (number | null)[];
    nitrogen_dioxide?: (number | null)[];
    sulphur_dioxide?: (number | null)[];
    ozone?: (number | null)[];
    us_aqi?: (number | null)[];
  };
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const aqiCache = new Map<string, { data: AqiLocationData; expiresAt: number }>();

function formatHourLabel(iso: string): string {
  const parts = iso.split("T");
  if (parts[1]) {
    return parts[1].slice(0, 5);
  }
  return iso.slice(0, 5);
}

function buildFallbackAqiData(
  lat: number,
  lon: number,
  placeName: string
): AqiLocationData {
  const nearest = findNearestIndianCity(lat, lon);
  const now = new Date();
  const basePm25 = nearest.id === "delhi" ? 138 : 68;
  const pollutants: Pollutants = {
    pm25: basePm25,
    pm10: Math.round(basePm25 * 1.6),
    no2: 34,
    o3: 48,
    co: 780,
    so2: 12,
  };
  const { indianAqi, dominantPollutant } = calculateIndianAqi(pollutants);

  const hourly24: HourlyPoint[] = Array.from({ length: 24 }, (_, i) => {
    const dt = new Date(now.getTime() + i * 3600_000);
    const hr = dt.getHours();
    const diurnalFactor = hr >= 12 && hr <= 16 ? 0.72 : hr >= 6 && hr <= 9 ? 1.18 : 1.0;
    const pm25 = Number((basePm25 * diurnalFactor).toFixed(1));
    const pm10 = Number((pm25 * 1.6).toFixed(1));
    const hAqi = calculateIndianAqi({ ...pollutants, pm25, pm10 }).indianAqi;
    return {
      time: dt.toISOString(),
      hourLabel: `${String(hr).padStart(2, "0")}:00`,
      pm25,
      pm10,
      indianAqi: hAqi,
      usAqi: Math.round(hAqi * 0.85),
    };
  });

  const daily3: DailyPoint[] = [0, 1, 2].map((d) => {
    const dt = new Date(now.getTime() + d * 86_400_000);
    const label = dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
    return {
      date: dt.toISOString().slice(0, 10),
      dayLabel: label,
      avgAqi: indianAqi,
      maxAqi: Math.round(indianAqi * 1.18),
      minAqi: Math.round(indianAqi * 0.74),
      avgPm25: basePm25,
    };
  });

  return {
    placeName,
    state: nearest.state,
    lat,
    lon,
    indianAqi,
    usAqi: Math.round(indianAqi * 0.85),
    category: getAqiCategory(indianAqi),
    dominantPollutant,
    pollutants,
    updatedAt: now.toISOString(),
    hourly24,
    daily3,
    bestWindow: computeBestWindow(hourly24),
    fallback: true,
  };
}

export async function GET(request: Request) {
  const originErr = enforceSameOrigin(request);
  if (originErr) return originErr;

  const limitErr = rateLimitGuard(request, "aqi", 60);
  if (limitErr) return limitErr;

  const { searchParams } = new URL(request.url);
  const rawLat = Number(searchParams.get("lat"));
  const rawLon = Number(searchParams.get("lon"));
  const rawName = searchParams.get("name")?.trim();

  const parsed = CoordsQuerySchema.safeParse({
    lat: rawLat,
    lon: rawLon,
    name: rawName ? sanitizePlainText(rawName) : undefined,
  });

  if (!parsed.success) {
    return jsonError(
      "Invalid coordinates. Please select a location within India.",
      400
    );
  }

  const { lat, lon, name } = parsed.data;
  const nearest = findNearestIndianCity(lat, lon);
  const placeName = name || nearest.name;
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}:${placeName}`;
  const nowMs = Date.now();

  const cached = aqiCache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs && !cached.data.fallback) {
    return jsonOk(cached.data, { cacheControl: "public, max-age=120" });
  }

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&forecast_days=3&timezone=Asia%2FKolkata`;
    const raw = await fetchJsonWithTimeout<OpenMeteoForecastResponse>(
      url,
      undefined,
      10_000
    );

    const curr = raw.current;
    const pollutants: Pollutants = {
      pm25: Number((curr?.pm2_5 ?? 25).toFixed(1)),
      pm10: Number((curr?.pm10 ?? 45).toFixed(1)),
      no2: Number((curr?.nitrogen_dioxide ?? 18).toFixed(1)),
      o3: Number((curr?.ozone ?? 35).toFixed(1)),
      co: Number((curr?.carbon_monoxide ?? 350).toFixed(0)),
      so2: Number((curr?.sulphur_dioxide ?? 9).toFixed(1)),
    };

    const { indianAqi, dominantPollutant } = calculateIndianAqi(pollutants);

    const hTimes = raw.hourly?.time ?? [];
    const hPm25 = raw.hourly?.pm2_5 ?? [];
    const hPm10 = raw.hourly?.pm10 ?? [];
    const hNo2 = raw.hourly?.nitrogen_dioxide ?? [];
    const hO3 = raw.hourly?.ozone ?? [];
    const hCo = raw.hourly?.carbon_monoxide ?? [];
    const hSo2 = raw.hourly?.sulphur_dioxide ?? [];
    const hUsAqi = raw.hourly?.us_aqi ?? [];

    // Find starting index matching current time or 0
    const currentPrefix = curr?.time?.slice(0, 13) ?? "";
    let startIdx = hTimes.findIndex((t) => t.startsWith(currentPrefix));
    if (startIdx < 0) startIdx = 0;

    const hourlyPointsAll: HourlyPoint[] = hTimes.map((time, idx) => {
      const p: Pollutants = {
        pm25: Number(((hPm25[idx] ?? pollutants.pm25) || 0).toFixed(1)),
        pm10: Number(((hPm10[idx] ?? pollutants.pm10) || 0).toFixed(1)),
        no2: Number(((hNo2[idx] ?? pollutants.no2) || 0).toFixed(1)),
        o3: Number(((hO3[idx] ?? pollutants.o3) || 0).toFixed(1)),
        co: Number(((hCo[idx] ?? pollutants.co) || 0).toFixed(0)),
        so2: Number(((hSo2[idx] ?? pollutants.so2) || 0).toFixed(1)),
      };
      const calc = calculateIndianAqi(p);
      return {
        time,
        hourLabel: formatHourLabel(time),
        pm25: p.pm25,
        pm10: p.pm10,
        indianAqi: calc.indianAqi,
        usAqi: Math.round(hUsAqi[idx] ?? calc.indianAqi * 0.85),
      };
    });

    const hourly24 = hourlyPointsAll.slice(startIdx, startIdx + 24);

    // Aggregate 3-day daily points
    const byDate = new Map<string, HourlyPoint[]>();
    for (const pt of hourlyPointsAll) {
      const dateKey = pt.time.slice(0, 10);
      const list = byDate.get(dateKey) ?? [];
      list.push(pt);
      byDate.set(dateKey, list);
    }

    const daily3: DailyPoint[] = Array.from(byDate.entries())
      .slice(0, 3)
      .map(([date, pts]) => {
        const aqis = pts.map((x) => x.indianAqi);
        const pm25s = pts.map((x) => x.pm25);
        const dt = new Date(`${date}T12:00:00+05:30`);
        return {
          date,
          dayLabel: dt.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
          }),
          avgAqi: Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length),
          maxAqi: Math.max(...aqis),
          minAqi: Math.min(...aqis),
          avgPm25: Number(
            (pm25s.reduce((a, b) => a + b, 0) / pm25s.length).toFixed(1)
          ),
        };
      });

    const data: AqiLocationData = {
      placeName,
      placeNameHi:
        !name || placeName.toLowerCase() === nearest.name.toLowerCase()
          ? nearest.nameHi
          : undefined,
      state:
        !name || placeName.toLowerCase() === nearest.name.toLowerCase()
          ? nearest.state
          : undefined,
      lat,
      lon,
      indianAqi,
      usAqi: Math.round(curr?.us_aqi ?? indianAqi * 0.85),
      category: getAqiCategory(indianAqi),
      dominantPollutant,
      pollutants,
      updatedAt: curr?.time ?? new Date().toISOString(),
      hourly24,
      daily3,
      bestWindow: computeBestWindow(hourly24),
      fallback: false,
    };

    if (aqiCache.size > 400) {
      aqiCache.clear();
    }
    aqiCache.set(cacheKey, { data, expiresAt: nowMs + FIVE_MINUTES_MS });

    return jsonOk(data, { cacheControl: "public, max-age=120" });
  } catch (err) {
    console.error("[/api/aqi] Live Open-Meteo fetch failed:", err);
    return jsonOk(buildFallbackAqiData(lat, lon, placeName));
  }
}
