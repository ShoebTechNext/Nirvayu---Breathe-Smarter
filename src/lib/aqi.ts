import type { AqiCategoryKey, HourlyPoint, Pollutants } from "./types";

interface Breakpoint {
  bpLow: number;
  bpHigh: number;
  iLow: number;
  iHigh: number;
}

// Official Indian CPCB NAQI Breakpoints
const PM25_BREAKPOINTS: Breakpoint[] = [
  { bpLow: 0, bpHigh: 30, iLow: 0, iHigh: 50 },
  { bpLow: 30, bpHigh: 60, iLow: 51, iHigh: 100 },
  { bpLow: 60, bpHigh: 90, iLow: 101, iHigh: 200 },
  { bpLow: 90, bpHigh: 120, iLow: 201, iHigh: 300 },
  { bpLow: 120, bpHigh: 250, iLow: 301, iHigh: 400 },
  { bpLow: 250, bpHigh: 500, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { bpLow: 0, bpHigh: 50, iLow: 0, iHigh: 50 },
  { bpLow: 50, bpHigh: 100, iLow: 51, iHigh: 100 },
  { bpLow: 100, bpHigh: 250, iLow: 101, iHigh: 200 },
  { bpLow: 250, bpHigh: 350, iLow: 201, iHigh: 300 },
  { bpLow: 350, bpHigh: 430, iLow: 301, iHigh: 400 },
  { bpLow: 430, bpHigh: 600, iLow: 401, iHigh: 500 },
];

const NO2_BREAKPOINTS: Breakpoint[] = [
  { bpLow: 0, bpHigh: 40, iLow: 0, iHigh: 50 },
  { bpLow: 40, bpHigh: 80, iLow: 51, iHigh: 100 },
  { bpLow: 80, bpHigh: 180, iLow: 101, iHigh: 200 },
  { bpLow: 180, bpHigh: 280, iLow: 201, iHigh: 300 },
  { bpLow: 280, bpHigh: 400, iLow: 301, iHigh: 400 },
  { bpLow: 400, bpHigh: 800, iLow: 401, iHigh: 500 },
];

const O3_BREAKPOINTS: Breakpoint[] = [
  { bpLow: 0, bpHigh: 50, iLow: 0, iHigh: 50 },
  { bpLow: 50, bpHigh: 100, iLow: 51, iHigh: 100 },
  { bpLow: 100, bpHigh: 168, iLow: 101, iHigh: 200 },
  { bpLow: 168, bpHigh: 208, iLow: 201, iHigh: 300 },
  { bpLow: 208, bpHigh: 748, iLow: 301, iHigh: 400 },
  { bpLow: 748, bpHigh: 1000, iLow: 401, iHigh: 500 },
];

// CO in mg/m3 for CPCB
const CO_MG_BREAKPOINTS: Breakpoint[] = [
  { bpLow: 0, bpHigh: 1.0, iLow: 0, iHigh: 50 },
  { bpLow: 1.0, bpHigh: 2.0, iLow: 51, iHigh: 100 },
  { bpLow: 2.0, bpHigh: 10.0, iLow: 101, iHigh: 200 },
  { bpLow: 10.0, bpHigh: 17.0, iLow: 201, iHigh: 300 },
  { bpLow: 17.0, bpHigh: 34.0, iLow: 301, iHigh: 400 },
  { bpLow: 34.0, bpHigh: 50.0, iLow: 401, iHigh: 500 },
];

const SO2_BREAKPOINTS: Breakpoint[] = [
  { bpLow: 0, bpHigh: 40, iLow: 0, iHigh: 50 },
  { bpLow: 40, bpHigh: 80, iLow: 51, iHigh: 100 },
  { bpLow: 80, bpHigh: 380, iLow: 101, iHigh: 200 },
  { bpLow: 380, bpHigh: 800, iLow: 201, iHigh: 300 },
  { bpLow: 800, bpHigh: 1600, iLow: 301, iHigh: 400 },
  { bpLow: 1600, bpHigh: 2500, iLow: 401, iHigh: 500 },
];

export function computeSubIndex(value: number, table: Breakpoint[]): number {
  const safeVal = Math.max(0, Number.isFinite(value) ? value : 0);
  for (const row of table) {
    if (safeVal <= row.bpHigh) {
      const span = row.bpHigh - row.bpLow || 1;
      const ratio = (safeVal - row.bpLow) / span;
      return Math.round(row.iLow + ratio * (row.iHigh - row.iLow));
    }
  }
  // Above highest defined breakpoint, scale gently beyond 500 capped at 500 for CPCB display
  const last = table[table.length - 1];
  const extra = ((safeVal - last.bpHigh) / (last.bpHigh || 1)) * 100;
  return Math.min(600, Math.round(500 + extra));
}

export function calculateIndianAqi(pollutants: Pollutants): {
  indianAqi: number;
  dominantPollutant: "PM2.5" | "PM10" | "NO2" | "O3" | "CO" | "SO2";
  subIndices: Record<string, number>;
} {
  const subIndices: { key: "PM2.5" | "PM10" | "NO2" | "O3" | "CO" | "SO2"; val: number }[] = [
    { key: "PM2.5", val: computeSubIndex(pollutants.pm25, PM25_BREAKPOINTS) },
    { key: "PM10", val: computeSubIndex(pollutants.pm10, PM10_BREAKPOINTS) },
    { key: "NO2", val: computeSubIndex(pollutants.no2, NO2_BREAKPOINTS) },
    { key: "O3", val: computeSubIndex(pollutants.o3, O3_BREAKPOINTS) },
    { key: "CO", val: computeSubIndex(pollutants.co / 1000, CO_MG_BREAKPOINTS) },
    { key: "SO2", val: computeSubIndex(pollutants.so2, SO2_BREAKPOINTS) },
  ];

  let maxItem = subIndices[0];
  for (const item of subIndices) {
    if (item.val > maxItem.val) {
      maxItem = item;
    }
  }

  return {
    indianAqi: maxItem.val,
    dominantPollutant: maxItem.key,
    subIndices: Object.fromEntries(subIndices.map((s) => [s.key, s.val])),
  };
}

export function getAqiCategory(aqi: number): AqiCategoryKey {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "satisfactory";
  if (aqi <= 200) return "moderate";
  if (aqi <= 300) return "poor";
  if (aqi <= 400) return "very_poor";
  return "severe";
}

export interface AqiStyleMeta {
  key: AqiCategoryKey;
  color: string;
  bgSoft: string;
  border: string;
  textClass: string;
  badgeBg: string;
  ringColor: string;
  range: string;
}

export const AQI_META: Record<AqiCategoryKey, AqiStyleMeta> = {
  good: {
    key: "good",
    color: "#16A34A",
    bgSoft: "rgba(22, 163, 74, 0.12)",
    border: "rgba(22, 163, 74, 0.35)",
    textClass: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-600 text-white",
    ringColor: "#16A34A",
    range: "0–50",
  },
  satisfactory: {
    key: "satisfactory",
    color: "#65A30D",
    bgSoft: "rgba(101, 163, 13, 0.14)",
    border: "rgba(101, 163, 13, 0.38)",
    textClass: "text-lime-700 dark:text-lime-300",
    badgeBg: "bg-lime-600 text-white",
    ringColor: "#65A30D",
    range: "51–100",
  },
  moderate: {
    key: "moderate",
    color: "#D97706",
    bgSoft: "rgba(217, 119, 6, 0.14)",
    border: "rgba(217, 119, 6, 0.4)",
    textClass: "text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-600 text-white",
    ringColor: "#D97706",
    range: "101–200",
  },
  poor: {
    key: "poor",
    color: "#EA580C",
    bgSoft: "rgba(234, 88, 12, 0.14)",
    border: "rgba(234, 88, 12, 0.42)",
    textClass: "text-orange-700 dark:text-orange-300",
    badgeBg: "bg-orange-600 text-white",
    ringColor: "#EA580C",
    range: "201–300",
  },
  very_poor: {
    key: "very_poor",
    color: "#DC2626",
    bgSoft: "rgba(220, 38, 38, 0.14)",
    border: "rgba(220, 38, 38, 0.45)",
    textClass: "text-red-700 dark:text-red-300",
    badgeBg: "bg-red-600 text-white",
    ringColor: "#DC2626",
    range: "301–400",
  },
  severe: {
    key: "severe",
    color: "#881337",
    bgSoft: "rgba(136, 19, 55, 0.18)",
    border: "rgba(159, 18, 57, 0.5)",
    textClass: "text-rose-900 dark:text-rose-200",
    badgeBg: "bg-rose-900 text-white",
    ringColor: "#9F1239",
    range: "401–500+",
  },
};

export function computeBestWindow(hourly24: HourlyPoint[]): {
  startHour: string;
  endHour: string;
  expectedAqi: number;
} {
  if (hourly24.length < 2) {
    return {
      startHour: "13:00",
      endHour: "15:00",
      expectedAqi: hourly24[0]?.indianAqi ?? 100,
    };
  }

  let bestIndex = 0;
  let bestAvg = Infinity;

  for (let i = 0; i < hourly24.length - 1; i++) {
    const hourNum = new Date(hourly24[i].time).getHours();
    // Prefer daytime windows (06:00 to 20:00)
    const daytimePenalty = hourNum >= 6 && hourNum <= 20 ? 0 : 80;
    const avg = (hourly24[i].indianAqi + hourly24[i + 1].indianAqi) / 2 + daytimePenalty;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestIndex = i;
    }
  }

  const start = hourly24[bestIndex];
  const end = hourly24[bestIndex + 1] ?? start;
  return {
    startHour: start.hourLabel,
    endHour: end.hourLabel,
    expectedAqi: Math.round((start.indianAqi + end.indianAqi) / 2),
  };
}
