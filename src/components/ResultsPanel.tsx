"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  Share2,
  Sparkles,
} from "lucide-react";
import { AQI_META } from "@/lib/aqi";
import { TRANSLATIONS } from "@/lib/i18n";
import type {
  AqiLocationData,
  CleanAirPlan,
  HouseholdProfile,
  Language,
} from "@/lib/types";
import { AqiGauge } from "./AqiGauge";
import { HouseholdForm } from "./HouseholdForm";
import { PlanCards } from "./PlanCards";
import { PollutantGrid } from "./PollutantGrid";
import { VayuMascot } from "./VayuMascot";

const ForecastChart = dynamic(() => import("./ForecastChart"), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-2xl glass-card animate-pulse" />
  ),
});

interface ResultsPanelProps {
  aqiData: AqiLocationData | null;
  aqiLoading: boolean;
  aqiError: string | null;
  profile: HouseholdProfile;
  language: Language;
  plan: CleanAirPlan | null;
  planLoading: boolean;
  shareToast: string | null;
  onRetryAqi: () => void;
  onProfileChange: (next: HouseholdProfile) => void;
  onGeneratePlan: () => void;
  onShare: () => void;
  onOpenImpactModal: () => void;
}

export function ResultsPanel({
  aqiData,
  aqiLoading,
  aqiError,
  profile,
  language,
  plan,
  planLoading,
  shareToast,
  onRetryAqi,
  onProfileChange,
  onGeneratePlan,
  onShare,
  onOpenImpactModal,
}: ResultsPanelProps) {
  const t = TRANSLATIONS[language];

  if (aqiLoading) {
    return (
      <div className="space-y-4">
        <div className="glass-card rounded-3xl p-5 space-y-4 animate-pulse">
          <div className="h-6 w-1/2 rounded bg-teal-500/20" />
          <div className="h-32 w-full rounded-2xl bg-slate-300/35 dark:bg-slate-700/35" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 rounded-xl bg-slate-300/35 dark:bg-slate-700/35" />
            <div className="h-16 rounded-xl bg-slate-300/35 dark:bg-slate-700/35" />
            <div className="h-16 rounded-xl bg-slate-300/35 dark:bg-slate-700/35" />
          </div>
        </div>
      </div>
    );
  }

  if (aqiError) {
    return (
      <div className="glass-card rounded-3xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto" />
        <p className="text-sm font-medium">{aqiError}</p>
        <button
          type="button"
          onClick={onRetryAqi}
          className="min-h-[44px] px-4 rounded-2xl bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t.retry}</span>
        </button>
      </div>
    );
  }

  if (!aqiData) {
    return (
      <div className="glass-card rounded-3xl p-6 text-center space-y-4">
        <div className="flex justify-center">
          <VayuMascot category="good" size="lg" />
        </div>
        <h2 className="text-lg font-extrabold">{t.emptyTitle}</h2>
        <p className="text-xs sm:text-sm opacity-75 leading-relaxed">
          {t.emptyDesc}
        </p>
      </div>
    );
  }

  const isSmogAlert =
    aqiData.category === "poor" ||
    aqiData.category === "very_poor" ||
    aqiData.category === "severe";

  const displayName =
    language === "hi" && aqiData.placeNameHi
      ? aqiData.placeNameHi
      : aqiData.placeName;

  const meta = AQI_META[aqiData.category];

  return (
    <div className="space-y-4 pb-8">
      {/* Smog Alert Mode Banner */}
      {isSmogAlert && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-3.5 bg-gradient-to-r from-orange-600 to-rose-700 text-white shadow-lg flex items-start gap-3"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <div className="font-extrabold">{t.smogAlertTitle}</div>
            <p className="opacity-95 text-xs mt-0.5 leading-snug">
              {t.smogAlertBody}
            </p>
          </div>
        </motion.div>
      )}

      {/* Live AQI Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-4 sm:p-5 shadow-md space-y-4"
        style={{ borderColor: meta.border }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {displayName}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  aqiData.fallback
                    ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {aqiData.fallback ? t.fallbackBadge : t.liveBadge}
              </span>
            </div>
            <div className="text-xs opacity-70 mt-0.5">
              {aqiData.state ? `${aqiData.state} · ` : ""}
              {aqiData.lat.toFixed(2)}°N, {aqiData.lon.toFixed(2)}°E
            </div>
          </div>

          <button
            type="button"
            onClick={onShare}
            className="min-h-[40px] px-3 rounded-xl glass-strong hover:bg-teal-500/10 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t.shareBtn}</span>
          </button>
        </div>

        {shareToast && (
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl">
            {shareToast}
          </div>
        )}

        {/* Gauge + Vayu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <AqiGauge
            value={aqiData.indianAqi}
            category={aqiData.category}
            categoryLabel={t.categories[aqiData.category]}
            aqiLabel={t.indianAqiLabel}
          />

          <div className="space-y-3">
            <VayuMascot
              category={aqiData.category}
              tip={t.vayuTips[aqiData.category]}
              size="md"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white/55 dark:bg-slate-900/50">
                <div className="text-[10px] opacity-65">{t.usAqiLabel}</div>
                <div className="font-extrabold text-sm tabular-nums">
                  {aqiData.usAqi}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/55 dark:bg-slate-900/50">
                <div className="text-[10px] opacity-65">{t.dominantLabel}</div>
                <div className="font-extrabold text-sm">
                  {aqiData.dominantPollutant}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cleanest Window + Updated Timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-300">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {t.bestWindowLabel}: {aqiData.bestWindow.startHour}–
              {aqiData.bestWindow.endHour} (AQI ~{aqiData.bestWindow.expectedAqi})
            </span>
          </span>
          <span className="text-[11px] opacity-65">
            {t.updatedLabel}: {aqiData.updatedAt.replace("T", " ").slice(0, 16)}
          </span>
        </div>
      </motion.div>

      {/* Pollutants */}
      <PollutantGrid pollutants={aqiData.pollutants} title={t.pollutantsTitle} />

      {/* 24h + 3d Forecast Chart */}
      <ForecastChart
        hourly24={aqiData.hourly24}
        daily3={aqiData.daily3}
        title={t.forecastTitle}
        tab24h={t.tab24h}
        tab3d={t.tab3d}
      />

      {/* Household Profile */}
      <HouseholdForm
        profile={profile}
        language={language}
        onChange={onProfileChange}
      />

      {/* Primary GenAI CTA with animated gradient border */}
      <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-emerald-500 shadow-lg">
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={onGeneratePlan}
          disabled={planLoading}
          className="w-full min-h-[52px] rounded-[14px] bg-gradient-to-r from-teal-700 to-sky-700 hover:from-teal-800 hover:to-sky-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all disabled:opacity-70"
        >
          <Sparkles className="w-5 h-5" />
          <span>{plan ? t.regeneratePlanBtn : t.generatePlanBtn}</span>
        </motion.button>
      </div>

      {/* Structured Clean Air Plan */}
      <PlanCards
        plan={plan}
        loading={planLoading}
        category={aqiData.category}
        language={language}
        placeName={displayName}
        onOpenImpactModal={onOpenImpactModal}
      />
    </div>
  );
}
