"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AQI_META } from "@/lib/aqi";
import type { AqiCategoryKey } from "@/lib/types";

interface AqiGaugeProps {
  value: number;
  category: AqiCategoryKey;
  categoryLabel: string;
  aqiLabel: string;
}

export function AqiGauge({
  value,
  category,
  categoryLabel,
  aqiLabel,
}: AqiGaugeProps) {
  const [displayVal, setDisplayVal] = useState(value);
  const meta = AQI_META[category];

  useEffect(() => {
    const start = displayVal;
    const diff = value - start;
    if (diff === 0) return;

    let frame = 0;
    const totalFrames = 24;
    let rafId = 0;

    const tick = () => {
      frame += 1;
      const progress = Math.min(1, frame / totalFrames);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.round(start + diff * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clampedRatio = Math.min(1, Math.max(0, value / 500));
  const needleAngle = -90 + clampedRatio * 180; // -90deg (left) to +90deg (right)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-52 h-28 overflow-hidden">
        <svg viewBox="0 0 220 120" className="w-full h-full" aria-hidden="true">
          <defs>
            <linearGradient id="cpcbArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16A34A" />
              <stop offset="20%" stopColor="#65A30D" />
              <stop offset="40%" stopColor="#D97706" />
              <stop offset="60%" stopColor="#EA580C" />
              <stop offset="80%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d="M 22 106 A 88 88 0 0 1 198 106"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* CPCB spectrum arc */}
          <path
            d="M 22 106 A 88 88 0 0 1 198 106"
            fill="none"
            stroke="url(#cpcbArcGrad)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Animated Needle */}
          <motion.g
            style={{ originX: "110px", originY: "106px" }}
            animate={{ rotate: needleAngle }}
            transition={{ type: "spring", stiffness: 110, damping: 16 }}
          >
            <line
              x1="110"
              y1="106"
              x2="110"
              y2="28"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="110" cy="106" r="7" fill={meta.color} />
            <circle cx="110" cy="106" r="3" fill="#FFFFFF" />
          </motion.g>
        </svg>
      </div>

      <div className="-mt-2 text-center">
        <div
          className="text-4xl font-extrabold tracking-tight tabular-nums transition-colors duration-500"
          style={{ color: meta.color }}
        >
          {displayVal}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
          {aqiLabel}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${meta.badgeBg}`}
        >
          {categoryLabel}
        </span>
      </div>
    </div>
  );
}
