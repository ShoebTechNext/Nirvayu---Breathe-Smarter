"use client";

import { motion } from "framer-motion";
import type { AqiCategoryKey } from "@/lib/types";

interface VayuMascotProps {
  category: AqiCategoryKey;
  tip?: string;
  size?: "sm" | "md" | "lg";
  thinking?: boolean;
}

export function VayuMascot({
  category,
  tip,
  size = "md",
  thinking = false,
}: VayuMascotProps) {
  const showMask =
    category === "poor" || category === "very_poor" || category === "severe";
  const isSevere = category === "severe";
  const isHappy = category === "good" || category === "satisfactory";

  const pxSize = size === "sm" ? 56 : size === "lg" ? 104 : 78;

  const bodyColors: Record<AqiCategoryKey, { top: string; bottom: string; cheek: string }> = {
    good: { top: "#CCFBF1", bottom: "#5EEAD4", cheek: "#FB7185" },
    satisfactory: { top: "#ECFCCB", bottom: "#BEF264", cheek: "#FB7185" },
    moderate: { top: "#FEF3C7", bottom: "#FCD34D", cheek: "#F97316" },
    poor: { top: "#FFEDD5", bottom: "#FDBA74", cheek: "#EA580C" },
    very_poor: { top: "#FEE2E2", bottom: "#FCA5A5", cheek: "#DC2626" },
    severe: { top: "#F3E8FF", bottom: "#CBD5E1", cheek: "#9F1239" },
  };

  const palette = bodyColors[category];

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="relative shrink-0"
        animate={
          thinking
            ? { y: [0, -6, 0], rotate: [-2, 2, -2] }
            : isSevere
              ? { x: [0, -2, 2, -1, 0], y: [0, -2, 0] }
              : { y: [0, -5, 0] }
        }
        transition={{
          duration: thinking ? 1.4 : isSevere ? 1.8 : 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-hidden="true"
      >
        <svg
          width={pxSize}
          height={pxSize}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          <defs>
            <linearGradient id={`vayuGrad-${category}-${size}`} x1="60" y1="18" x2="60" y2="104" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={palette.top} />
              <stop offset="100%" stopColor={palette.bottom} />
            </linearGradient>
          </defs>

          {/* Sprout leaf on head */}
          <path
            d="M60 22 C60 12, 72 8, 76 14 C72 21, 64 22, 60 22 Z"
            fill="#10B981"
          />
          <path
            d="M60 24 C60 17, 50 13, 47 18 C51 23, 57 24, 60 24 Z"
            fill="#34D399"
          />
          <path d="M60 22 L60 30" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />

          {/* Cloud-lung friendly body */}
          <path
            d="M36 96 C20 96, 14 82, 20 68 C16 54, 28 40, 42 42 C46 30, 68 28, 76 40 C92 38, 104 52, 100 68 C106 82, 98 96, 82 96 Z"
            fill={`url(#vayuGrad-${category}-${size})`}
            stroke="#0F766E"
            strokeOpacity="0.35"
            strokeWidth="2.5"
          />

          {/* Subtle lung-lobe arcs */}
          <path
            d="M44 52 C38 58, 38 72, 46 80"
            stroke="#0F766E"
            strokeOpacity="0.18"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M76 52 C82 58, 82 72, 74 80"
            stroke="#0F766E"
            strokeOpacity="0.18"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Cheeks */}
          <circle cx="40" cy="69" r="4.5" fill={palette.cheek} fillOpacity="0.45" />
          <circle cx="80" cy="69" r="4.5" fill={palette.cheek} fillOpacity="0.45" />

          {/* Eyes */}
          {isHappy ? (
            <>
              <circle cx="47" cy="60" r="4.2" fill="#0F172A" />
              <circle cx="73" cy="60" r="4.2" fill="#0F172A" />
              <circle cx="48.5" cy="58.5" r="1.4" fill="#FFFFFF" />
              <circle cx="74.5" cy="58.5" r="1.4" fill="#FFFFFF" />
            </>
          ) : isSevere ? (
            <>
              <path d="M42 58 L51 62 L42 64" stroke="#0F172A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M78 58 L69 62 L78 64" stroke="#0F172A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <circle cx="47" cy="61" r="4" fill="#0F172A" />
              <circle cx="73" cy="61" r="4" fill="#0F172A" />
              {/* Worried eyebrows for moderate/poor */}
              {showMask && (
                <>
                  <path d="M41 54 L51 56" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M79 54 L69 56" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
                </>
              )}
            </>
          )}

          {/* Mouth or N95 Mask */}
          {showMask ? (
            <g>
              {/* Ear straps */}
              <path d="M29 66 L44 69" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
              <path d="M91 66 L76 69" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
              {/* N95 respirator cup */}
              <path
                d="M44 68 C44 64, 76 64, 76 68 L74 84 C68 89, 52 89, 46 84 Z"
                fill="#FFFFFF"
                stroke="#0F766E"
                strokeWidth="2"
              />
              <path d="M52 67 L68 67" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
              <circle cx="66" cy="76" r="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            </g>
          ) : isHappy ? (
            <path
              d="M52 71 Q60 79 68 71"
              stroke="#0F172A"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <path
              d="M53 73 L67 73"
              stroke="#0F172A"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          )}

          {/* Cough puffs when Severe */}
          {isSevere && (
            <g opacity="0.75">
              <circle cx="96" cy="76" r="3.5" fill="#94A3B8" />
              <circle cx="105" cy="72" r="5" fill="#CBD5E1" />
            </g>
          )}
        </svg>
      </motion.div>

      {tip && (
        <div className="relative rounded-2xl glass-strong px-3.5 py-2.5 text-xs sm:text-sm font-medium leading-snug shadow-sm">
          <span className="font-bold text-teal-700 dark:text-teal-300 mr-1.5">
            Vayu:
          </span>
          <span>{tip}</span>
        </div>
      )}
    </div>
  );
}
