"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AQI_META } from "@/lib/aqi";
import { MAJOR_INDIAN_CITIES } from "@/lib/cities";
import { TRANSLATIONS } from "@/lib/i18n";
import type { AqiLocationData, Language } from "@/lib/types";
import { VayuMascot } from "./VayuMascot";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialCityId?: string;
}

export function CompareModal({
  isOpen,
  onClose,
  language,
  initialCityId = "delhi",
}: CompareModalProps) {
  const t = TRANSLATIONS[language];
  const [cityAId, setCityAId] = useState(initialCityId);
  const [cityBId, setCityBId] = useState(
    initialCityId === "bhopal" ? "delhi" : "bhopal"
  );
  const [dataA, setDataA] = useState<AqiLocationData | null>(null);
  const [dataB, setDataB] = useState<AqiLocationData | null>(null);
  const [loadedPairKey, setLoadedPairKey] = useState<string | null>(null);
  const pairKey = `${cityAId}:${cityBId}`;
  const loading = isOpen && loadedPairKey !== pairKey;

  useEffect(() => {
    if (!isOpen) return;
    const cityA = MAJOR_INDIAN_CITIES.find((c) => c.id === cityAId);
    const cityB = MAJOR_INDIAN_CITIES.find((c) => c.id === cityBId);
    if (!cityA || !cityB) return;

    let cancelled = false;

    Promise.all([
      fetch(
        `/api/aqi?lat=${cityA.lat}&lon=${cityA.lon}&name=${encodeURIComponent(cityA.name)}`
      ).then((r) => r.json() as Promise<AqiLocationData>),
      fetch(
        `/api/aqi?lat=${cityB.lat}&lon=${cityB.lon}&name=${encodeURIComponent(cityB.name)}`
      ).then((r) => r.json() as Promise<AqiLocationData>),
    ])
      .then(([resA, resB]) => {
        if (!cancelled) {
          setDataA(resA);
          setDataB(resB);
          setLoadedPairKey(`${cityAId}:${cityBId}`);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadedPairKey(`${cityAId}:${cityBId}`);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, cityAId, cityBId]);

  if (!isOpen) return null;

  const chartData =
    dataA && dataB
      ? [
          {
            metric: "Indian AQI",
            [dataA.placeName]: dataA.indianAqi,
            [dataB.placeName]: dataB.indianAqi,
          },
          {
            metric: "PM2.5",
            [dataA.placeName]: dataA.pollutants.pm25,
            [dataB.placeName]: dataB.pollutants.pm25,
          },
          {
            metric: "PM10",
            [dataA.placeName]: dataA.pollutants.pm10,
            [dataB.placeName]: dataB.pollutants.pm10,
          },
          {
            metric: "NO2",
            [dataA.placeName]: dataA.pollutants.no2,
            [dataB.placeName]: dataB.pollutants.no2,
          },
        ]
      : [];

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>{t.compareTitle}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* City selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs font-bold block">
            {t.cityA}
            <select
              value={cityAId}
              onChange={(e) => setCityAId(e.target.value)}
              className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-white/85 dark:bg-slate-900/85 border border-slate-300 dark:border-slate-700 text-sm"
            >
              {MAJOR_INDIAN_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === "hi" ? c.nameHi : c.name} ({c.state})
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold block">
            {t.cityB}
            <select
              value={cityBId}
              onChange={(e) => setCityBId(e.target.value)}
              className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-white/85 dark:bg-slate-900/85 border border-slate-300 dark:border-slate-700 text-sm"
            >
              {MAJOR_INDIAN_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === "hi" ? c.nameHi : c.name} ({c.state})
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && (
          <div className="text-xs text-center py-6 opacity-70">
            Loading live comparison...
          </div>
        )}

        {!loading && dataA && dataB && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[dataA, dataB].map((d, i) => {
                const meta = AQI_META[d.category];
                return (
                  <div
                    key={`${d.placeName}-${i}`}
                    className="p-4 rounded-2xl border bg-white/60 dark:bg-slate-900/60 space-y-3"
                    style={{ borderColor: meta.border }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-base">
                          {language === "hi" && d.placeNameHi
                            ? d.placeNameHi
                            : d.placeName}
                        </div>
                        <div className="text-[11px] opacity-65">
                          {t.dominantLabel}: {d.dominantPollutant}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold ${meta.badgeBg}`}
                      >
                        AQI {d.indianAqi} · {t.categories[d.category]}
                      </span>
                    </div>

                    <VayuMascot category={d.category} size="sm" />

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/70">
                        <div className="opacity-65">PM2.5</div>
                        <div className="font-bold">{d.pollutants.pm25}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/70">
                        <div className="opacity-65">PM10</div>
                        <div className="font-bold">{d.pollutants.pm10}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/70">
                        <div className="opacity-65">Best Hr</div>
                        <div className="font-bold">{d.bestWindow.startHour}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-56 w-full rounded-2xl p-3 bg-white/60 dark:bg-slate-900/55">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey={dataA.placeName}
                    fill="#0F766E"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey={dataB.placeName}
                    fill="#0284C7"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
