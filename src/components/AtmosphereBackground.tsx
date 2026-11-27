"use client";

import { motion } from "framer-motion";
import type { AqiCategoryKey } from "@/lib/types";

interface AtmosphereBackgroundProps {
  category: AqiCategoryKey;
}

const SKY_GRADIENTS: Record<AqiCategoryKey, string> = {
  good: "from-sky-200/70 via-teal-100/50 to-emerald-50/40 dark:from-sky-950/80 dark:via-teal-950/60 dark:to-slate-950",
  satisfactory:
    "from-teal-100/70 via-sky-100/50 to-lime-50/40 dark:from-teal-950/75 dark:via-slate-900 dark:to-slate-950",
  moderate:
    "from-amber-100/70 via-sky-100/40 to-orange-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-950",
  poor: "from-orange-200/65 via-amber-100/50 to-stone-200/50 dark:from-orange-950/50 dark:via-stone-900 dark:to-slate-950",
  very_poor:
    "from-rose-200/60 via-orange-100/45 to-stone-300/60 dark:from-rose-950/55 dark:via-stone-900 dark:to-slate-950",
  severe:
    "from-stone-400/55 via-rose-950/20 to-slate-300/70 dark:from-stone-950 dark:via-rose-950/40 dark:to-slate-950",
};

const PARTICLES = [
  { id: 1, left: "8%", top: "18%", size: 120, duration: 16 },
  { id: 2, left: "34%", top: "10%", size: 160, duration: 21 },
  { id: 3, left: "66%", top: "24%", size: 140, duration: 18 },
  { id: 4, left: "84%", top: "12%", size: 110, duration: 24 },
];

export function AtmosphereBackground({ category }: AtmosphereBackgroundProps) {
  const hazeOpacity =
    category === "good"
      ? 0.08
      : category === "satisfactory"
        ? 0.14
        : category === "moderate"
          ? 0.24
          : category === "poor"
            ? 0.36
            : 0.48;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-colors duration-700"
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${SKY_GRADIENTS[category]} transition-all duration-1000`}
      />

      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-3xl will-change-transform"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background:
              category === "good" || category === "satisfactory"
                ? "rgba(20, 184, 166, 0.25)"
                : category === "moderate"
                  ? "rgba(245, 158, 11, 0.28)"
                  : "rgba(180, 83, 9, 0.35)",
            opacity: hazeOpacity,
          }}
          animate={{
            x: [0, 22, -16, 0],
            y: [0, -14, 10, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
