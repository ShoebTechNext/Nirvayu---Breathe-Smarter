"use client";

import { motion } from "framer-motion";
import type { Pollutants } from "@/lib/types";

interface PollutantGridProps {
  pollutants: Pollutants;
  title: string;
}

export function PollutantGrid({ pollutants, title }: PollutantGridProps) {
  const items = [
    {
      key: "PM2.5",
      val: pollutants.pm25,
      unit: "µg/m³",
      safeLimit: 60,
      maxScale: 250,
    },
    {
      key: "PM10",
      val: pollutants.pm10,
      unit: "µg/m³",
      safeLimit: 100,
      maxScale: 400,
    },
    {
      key: "NO₂",
      val: pollutants.no2,
      unit: "µg/m³",
      safeLimit: 80,
      maxScale: 220,
    },
    {
      key: "O₃",
      val: pollutants.o3,
      unit: "µg/m³",
      safeLimit: 100,
      maxScale: 220,
    },
    {
      key: "CO",
      val: Number((pollutants.co / 1000).toFixed(2)),
      unit: "mg/m³",
      safeLimit: 2,
      maxScale: 10,
    },
    {
      key: "SO₂",
      val: pollutants.so2,
      unit: "µg/m³",
      safeLimit: 80,
      maxScale: 200,
    },
  ];

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {items.map((item, idx) => {
          const pct = Math.min(100, Math.round((item.val / item.maxScale) * 100));
          const isElevated = item.val > item.safeLimit;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              whileHover={{ y: -2 }}
              className="glass-card rounded-2xl p-3 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {item.key}
                </span>
                <span className="text-[10px] opacity-65">{item.unit}</span>
              </div>
              <div className="mt-1 text-lg font-extrabold tabular-nums">
                {item.val}
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, pct)}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.04 }}
                  className={`h-full rounded-full ${
                    isElevated ? "bg-orange-500" : "bg-teal-500"
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
