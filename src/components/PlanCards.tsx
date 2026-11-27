"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Flame,
  HeartPulse,
  Home,
  Info,
  Leaf,
  ShieldAlert,
  Sparkles,
  Sun,
  Sunset,
  Sunrise,
} from "lucide-react";
import { AQI_META } from "@/lib/aqi";
import { TRANSLATIONS } from "@/lib/i18n";
import type { AqiCategoryKey, CleanAirPlan, Language } from "@/lib/types";
import { VayuMascot } from "./VayuMascot";

interface PlanCardsProps {
  plan: CleanAirPlan | null;
  loading: boolean;
  category: AqiCategoryKey;
  language: Language;
  placeName: string;
  onOpenImpactModal: () => void;
}

interface ChecklistState {
  dateKey: string;
  checkedIds: string[];
  streak: number;
  points: number;
}

const CHECKLIST_STORAGE_KEY = "nirvayu_checklist_v1";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function SectionIllustration({ kind }: { kind: "health" | "routine" | "home" | "eco" }) {
  if (kind === "health") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#FEE2E2" />
        <path
          d="M16 23s-7-4.5-7-9.5a4 4 0 0 1 7-2.6A4 4 0 0 1 23 13.5c0 5-7 9.5-7 9.5Z"
          fill="#EF4444"
        />
      </svg>
    );
  }
  if (kind === "routine") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#E0F2FE" />
        <circle cx="16" cy="16" r="6" fill="#0284C7" />
        <path d="M16 5v3M16 24v3M5 16h3M24 16h3" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "home") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#CCFBF1" />
        <path d="M8 16l8-7 8 7v8H8v-8Z" fill="#0F766E" />
        <rect x="14" y="18" width="4" height="6" rx="1" fill="#CCFBF1" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#DCFCE7" />
      <path d="M10 21c0-7 6-11 12-11-1 6-5 11-12 11Z" fill="#16A34A" />
      <path d="M10 21l5-5" stroke="#DCFCE7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlanCards({
  plan,
  loading,
  category,
  language,
  onOpenImpactModal,
}: PlanCardsProps) {
  const t = TRANSLATIONS[language];
  const [msgIdx, setMsgIdx] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    advisory: true,
    routine: true,
    hacks: true,
    alternatives: true,
    impact: true,
    checklist: true,
  });

  const [checkState, setCheckState] = useState<ChecklistState>({
    dateKey: getTodayKey(),
    checkedIds: [],
    streak: 1,
    points: 0,
  });

  // Load persisted checklist/streak after hydration
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as ChecklistState;
        const today = getTodayKey();
        if (saved.dateKey === today) {
          setCheckState(saved);
        } else {
          // New day: keep streak if yesterday had at least 1 item checked
          const yesterday = new Date(Date.now() - 86_400_000)
            .toISOString()
            .slice(0, 10);
          const keepStreak =
            saved.dateKey === yesterday && saved.checkedIds.length > 0
              ? saved.streak + 1
              : saved.checkedIds.length > 0
                ? 1
                : 0;
          setCheckState({
            dateKey: today,
            checkedIds: [],
            streak: Math.max(1, keepStreak),
            points: saved.points ?? 0,
          });
        }
      } catch {
        // Ignore storage errors
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Rotate friendly loading messages
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % t.loadingMessages.length);
    }, 1900);
    return () => clearInterval(id);
  }, [loading, t.loadingMessages.length]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleChecklist = (id: string, pts: number) => {
    const already = checkState.checkedIds.includes(id);
    const nextIds = already
      ? checkState.checkedIds.filter((x) => x !== id)
      : [...checkState.checkedIds, id];
    const nextPoints = Math.max(0, checkState.points + (already ? -pts : pts));

    const updated: ChecklistState = {
      dateKey: getTodayKey(),
      checkedIds: nextIds,
      streak: Math.max(1, checkState.streak),
      points: nextPoints,
    };
    setCheckState(updated);
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    if (!already) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(18);
      }
      confetti({
        particleCount: 38,
        spread: 60,
        origin: { y: 0.72 },
        disableForReducedMotion: true,
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-4">
          <VayuMascot
            category={category}
            tip={t.loadingMessages[msgIdx]}
            size="md"
            thinking
          />
        </div>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="glass-card rounded-2xl p-4 space-y-2.5 animate-pulse"
          >
            <div className="h-4 w-2/5 rounded bg-teal-500/20" />
            <div className="h-3 w-full rounded bg-slate-300/40 dark:bg-slate-700/40" />
            <div className="h-3 w-4/5 rounded bg-slate-300/40 dark:bg-slate-700/40" />
          </div>
        ))}
      </div>
    );
  }

  if (!plan) return null;

  const advisoryMeta = AQI_META[plan.healthAdvisory.riskLevel];
  const pm25Pct = Math.min(100, Math.max(0, plan.impactEstimator.totalPm25ReductionPct));
  const ringRadius = 40;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (pm25Pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* AI vs Fallback Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            plan.fallbackMode
              ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
              : "bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{plan.fallbackMode ? t.fallbackBadge : "Gemini AI Plan"}</span>
        </span>

        <button
          type="button"
          onClick={onOpenImpactModal}
          className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline inline-flex items-center gap-1"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{t.methodologyBtn}</span>
        </button>
      </div>

      {/* 1. Health Advisory */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection("advisory")}
          className="w-full p-4 flex items-center justify-between text-left min-h-[52px]"
        >
          <span className="flex items-center gap-2.5 font-bold text-sm">
            <SectionIllustration kind="health" />
            <span>{t.planSections.advisory}</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              openSections.advisory ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence initial={false}>
          {openSections.advisory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                <div
                  className="p-3 rounded-xl border"
                  style={{
                    background: advisoryMeta.bgSoft,
                    borderColor: advisoryMeta.border,
                  }}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <HeartPulse className="w-4 h-4 shrink-0" />
                    <span>{plan.healthAdvisory.headline}</span>
                  </div>
                  <p className="text-xs sm:text-sm mt-1.5 leading-relaxed opacity-90">
                    {plan.healthAdvisory.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {plan.healthAdvisory.extraCareGroups.map((g, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/25"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      {g}
                    </span>
                  ))}
                </div>

                <p className="text-[11px] opacity-70 italic">
                  {plan.healthAdvisory.disclaimer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Low-Emission Daily Routine */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection("routine")}
          className="w-full p-4 flex items-center justify-between text-left min-h-[52px]"
        >
          <span className="flex items-center gap-2.5 font-bold text-sm">
            <SectionIllustration kind="routine" />
            <span>{t.planSections.routine}</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              openSections.routine ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence initial={false}>
          {openSections.routine && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2.5">
                {plan.dailyRoutine.map((slot) => {
                  const Icon =
                    slot.period === "morning"
                      ? Sunrise
                      : slot.period === "afternoon"
                        ? Sun
                        : Sunset;
                  return (
                    <div
                      key={slot.period}
                      className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/55 border border-slate-200/70 dark:border-slate-700/60"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                          <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span>{slot.title}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            slot.outdoorOk
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-orange-500/15 text-orange-700 dark:text-orange-300"
                          }`}
                        >
                          {slot.outdoorOk ? t.outdoorSafe : t.stayIndoor}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 mt-0.5">
                        {slot.timeWindow}
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-85">
                        {slot.guidance}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Indoor Air Hacks */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection("hacks")}
          className="w-full p-4 flex items-center justify-between text-left min-h-[52px]"
        >
          <span className="flex items-center gap-2.5 font-bold text-sm">
            <SectionIllustration kind="home" />
            <span>{t.planSections.hacks}</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              openSections.hacks ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence initial={false}>
          {openSections.hacks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {plan.indoorHacks.map((hack) => (
                  <div
                    key={hack.id}
                    className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/55 border border-slate-200/70 dark:border-slate-700/60 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{hack.title}</span>
                      </span>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-800 dark:text-teal-300">
                        {t.costLevels[hack.costLevel]}
                      </span>
                    </div>
                    <p className="text-xs opacity-85 leading-relaxed">
                      {hack.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Sustainable Alternatives */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection("alternatives")}
          className="w-full p-4 flex items-center justify-between text-left min-h-[52px]"
        >
          <span className="flex items-center gap-2.5 font-bold text-sm">
            <SectionIllustration kind="eco" />
            <span>{t.planSections.alternatives}</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              openSections.alternatives ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence initial={false}>
          {openSections.alternatives && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2.5">
                {plan.sustainableAlternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/55 border border-slate-200/70 dark:border-slate-700/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{alt.title}</span>
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800">
                          {t.costLabel}: {t.costLevels[alt.costLevel]}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          {t.difficultyLevels[alt.difficulty]}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs mt-1.5 opacity-85 leading-relaxed">
                      {alt.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Impact Estimator & Weekly Progress Ring */}
      <div className="glass-card rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm">{t.planSections.impact}</h3>
          <button
            type="button"
            onClick={onOpenImpactModal}
            className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline"
          >
            {t.methodologyBtn}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-br from-teal-500/10 to-sky-500/10 border border-teal-500/20">
          {/* Animated Progress Ring */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                stroke="currentColor"
                strokeOpacity="0.14"
                strokeWidth="9"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={ringRadius}
                stroke="#0F766E"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-xl font-extrabold text-teal-700 dark:text-teal-300 tabular-nums">
                -{pm25Pct}%
              </div>
              <div className="text-[9px] font-bold uppercase opacity-70">PM2.5</div>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="text-xs font-semibold opacity-75">{t.pm25Reduced}</div>
            <div className="text-2xl font-extrabold tabular-nums text-sky-700 dark:text-sky-300">
              {plan.impactEstimator.totalCo2SavedKgPerWeek} kg{" "}
              <span className="text-xs font-semibold opacity-75">
                {t.co2Saved}
              </span>
            </div>
            <p className="text-[11px] opacity-75 leading-snug">
              {plan.impactEstimator.methodologyNote}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {plan.impactEstimator.actions.map((act) => (
            <div
              key={act.id}
              className="p-2.5 rounded-xl bg-white/55 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span>{act.title}</span>
                <span className="shrink-0 text-teal-700 dark:text-teal-300 tabular-nums">
                  -{act.pm25ReductionPct}% PM2.5 · {act.co2SavedKgPerWeek} kg CO₂
                </span>
              </div>
              <p className="text-[11px] opacity-70 mt-1">{act.assumption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Interactive Action Checklist */}
      <div className="glass-card rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-sm">{t.planSections.checklist}</h3>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300">
              <Flame className="w-3.5 h-3.5" />
              {checkState.streak}d {t.streakLabel}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-300 tabular-nums">
              {checkState.points} {t.pointsLabel}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {plan.checklist.map((item) => {
            const checked = checkState.checkedIds.includes(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={() => handleToggleChecklist(item.id, item.points)}
                className={`w-full min-h-[46px] p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  checked
                    ? "bg-emerald-500/12 border-emerald-500/35"
                    : "bg-white/60 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-700/60 hover:border-teal-500/40"
                }`}
              >
                <span className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                  {checked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <span className={checked ? "line-through opacity-75" : ""}>
                    {item.label}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                  +{item.points}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
