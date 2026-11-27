"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint, HourlyPoint } from "@/lib/types";

interface ForecastChartProps {
  hourly24: HourlyPoint[];
  daily3: DailyPoint[];
  title: string;
  tab24h: string;
  tab3d: string;
}

export default function ForecastChart({
  hourly24,
  daily3,
  title,
  tab24h,
  tab3d,
}: ForecastChartProps) {
  const [tab, setTab] = useState<"24h" | "3d">("24h");

  return (
    <div className="glass-card rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {title}
        </h3>
        <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800/80 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("24h")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === "24h"
                ? "bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-300"
                : "opacity-70"
            }`}
          >
            {tab24h}
          </button>
          <button
            type="button"
            onClick={() => setTab("3d")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === "3d"
                ? "bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-300"
                : "opacity-70"
            }`}
          >
            {tab3d}
          </button>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {tab === "24h" ? (
            <AreaChart
              data={hourly24}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="aqiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
              <XAxis
                dataKey="hourLabel"
                tick={{ fontSize: 10 }}
                interval={3}
                strokeOpacity={0.4}
              />
              <YAxis tick={{ fontSize: 10 }} strokeOpacity={0.4} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(15,118,110,0.25)",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="indianAqi"
                name="Indian AQI"
                stroke="#0F766E"
                strokeWidth={2.5}
                fill="url(#aqiAreaGrad)"
              />
              <Area
                type="monotone"
                dataKey="pm25"
                name="PM2.5 (µg/m³)"
                stroke="#0284C7"
                strokeWidth={1.8}
                fillOpacity={0}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={daily3}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.18} />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11 }}
                strokeOpacity={0.4}
              />
              <YAxis tick={{ fontSize: 10 }} strokeOpacity={0.4} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(15,118,110,0.25)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="minAqi"
                name="Min AQI"
                fill="#14B8A6"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="avgAqi"
                name="Avg AQI"
                fill="#0F766E"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="maxAqi"
                name="Peak AQI"
                fill="#EA580C"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
