"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type PanInfo,
} from "framer-motion";
import {
  ArrowLeftRight,
  Calculator,
  ChevronUp,
  Info,
  Languages,
  Map as MapIcon,
  Moon,
  Sparkles,
  Sun,
  WifiOff,
  Wind,
} from "lucide-react";
import { MAJOR_INDIAN_CITIES } from "@/lib/cities";
import { buildFallbackPlan } from "@/lib/fallback-plan";
import { TRANSLATIONS } from "@/lib/i18n";
import type {
  AqiCategoryKey,
  AqiLocationData,
  CitySnapshot,
  CleanAirPlan,
  HouseholdProfile,
  Language,
} from "@/lib/types";
import { AtmosphereBackground } from "./AtmosphereBackground";
import { CompareModal } from "./CompareModal";
import { ImpactModal } from "./ImpactModal";
import { ResultsPanel } from "./ResultsPanel";
import { SearchBar } from "./SearchBar";

const IndiaMap = dynamic(() => import("./IndiaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-3xl glass-card animate-pulse flex items-center justify-center text-sm font-semibold opacity-70">
      Loading Interactive India Map...
    </div>
  ),
});

const PROFILE_STORAGE_KEY = "nirvayu_profile_v1";
const LANG_STORAGE_KEY = "nirvayu_lang_v1";

const DEFAULT_PROFILE: HouseholdProfile = {
  familyMembers: 4,
  childrenUnder5: false,
  elderly: false,
  respiratoryConditions: false,
  pregnancy: false,
  commuteType: "two_wheeler",
  homeType: "apartment",
  cookingFuel: "lpg",
  hasAirPurifier: false,
  budget: "medium",
  language: "en",
};

type SheetSnap = "peek" | "half" | "full";

export function NirvayuApp() {
  const [language, setLanguage] = useState<Language>("en");
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [cities, setCities] = useState<CitySnapshot[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{
    lat: number;
    lon: number;
    name?: string;
  } | null>(null);
  const [aqiData, setAqiData] = useState<AqiLocationData | null>(null);
  const [aqiLoading, setAqiLoading] = useState(false);
  const [aqiError, setAqiError] = useState<string | null>(null);

  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [plan, setPlan] = useState<CleanAirPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  const [locationAlert, setLocationAlert] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const [showCompare, setShowCompare] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [mobileSnap, setMobileSnap] = useState<SheetSnap>("peek");
  const [mobileTab, setMobileTab] = useState<"map" | "plan">("map");

  const t = TRANSLATIONS[language];
  const activeCategory: AqiCategoryKey = aqiData?.category ?? "satisfactory";

  // Initialize theme, language, profile, service worker, and offline state
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const savedTheme = localStorage.getItem("nirvayu_theme");
      const isDark = savedTheme ? savedTheme === "dark" : prefersDark;
      setDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);

      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === "hi" || savedLang === "en") {
        setLanguage(savedLang);
      }

      try {
        const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (savedProfile) {
          setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(savedProfile) });
        }
      } catch {
        // Ignore invalid localStorage
      }

      setIsOffline(!navigator.onLine);
    });

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      active = false;
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Fetch initial 28 Indian cities AQI batch
  useEffect(() => {
    fetch("/api/cities")
      .then((res) => res.json() as Promise<{ cities?: CitySnapshot[] }>)
      .then((data) => {
        if (data.cities && data.cities.length > 0) {
          setCities(data.cities);
        }
      })
      .catch(() => {
        // Keep empty until retry
      });
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("nirvayu_theme", next ? "dark" : "light");
  };

  const toggleLanguage = () => {
    const next: Language = language === "en" ? "hi" : "en";
    setLanguage(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
    setProfile((prev) => {
      const updated = { ...prev, language: next };
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleProfileChange = (next: HouseholdProfile) => {
    const synced = { ...next, language };
    setProfile(synced);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(synced));
    } catch {
      // Ignore
    }
  };

  const loadLocationAqi = useCallback(
    async (loc: { lat: number; lon: number; name?: string }) => {
      setSelectedPoint(loc);
      setLocationAlert(null);
      setAqiError(null);
      setAqiLoading(true);
      setPlan(null);
      setMobileTab("plan");
      setMobileSnap("half");

      try {
        const params = new URLSearchParams({
          lat: String(loc.lat),
          lon: String(loc.lon),
        });
        if (loc.name) params.set("name", loc.name);

        const res = await fetch(`/api/aqi?${params.toString()}`);
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as AqiLocationData;
        setAqiData(data);
      } catch {
        setAqiError(t.errorFetchAqi);
      } finally {
        setAqiLoading(false);
      }
    },
    [t.errorFetchAqi]
  );

  const handleSelectCity = (city: CitySnapshot) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    loadLocationAqi({
      lat: city.lat,
      lon: city.lon,
      name: city.name,
    });
  };

  const handleMapClick = async (lat: number, lon: number) => {
    setLocationAlert(null);
    let placeName = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const geo = (await res.json()) as { name?: string };
        if (geo.name) placeName = geo.name;
      }
    } catch {
      // Fallback to coord label
    }
    loadLocationAqi({ lat, lon, name: placeName });
  };

  const handleGeneratePlan = async () => {
    if (!aqiData) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(14);
    }
    setPlanLoading(true);
    setMobileSnap("full");

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          profile: { ...profile, language },
          aqiData: {
            placeName: aqiData.placeName,
            lat: aqiData.lat,
            lon: aqiData.lon,
            indianAqi: aqiData.indianAqi,
            usAqi: aqiData.usAqi,
            category: aqiData.category,
            dominantPollutant: aqiData.dominantPollutant,
            pollutants: aqiData.pollutants,
            bestWindow: aqiData.bestWindow,
          },
        }),
      });

      if (!res.ok) throw new Error("Plan failed");
      const data = (await res.json()) as CleanAirPlan;
      setPlan(data);
    } catch {
      // Never break UI — generate local deterministic fallback plan
      setPlan(
        buildFallbackPlan({
          placeName: aqiData.placeName,
          indianAqi: aqiData.indianAqi,
          category: aqiData.category,
          pm25: aqiData.pollutants.pm25,
          bestWindow: aqiData.bestWindow,
          profile: { ...profile, language },
          language,
        })
      );
    } finally {
      setPlanLoading(false);
    }
  };

  const handleShare = async () => {
    if (!aqiData) return;
    const summaryText =
      language === "hi"
        ? `निर्वायु (${aqiData.placeName}): भारतीय AQI ${aqiData.indianAqi} (${t.categories[aqiData.category]}), PM2.5 ${aqiData.pollutants.pm25} µg/m³। आज का सबसे साफ समय: ${aqiData.bestWindow.startHour}–${aqiData.bestWindow.endHour}।`
        : `NIRVAYU (${aqiData.placeName}): Indian AQI ${aqiData.indianAqi} (${t.categories[aqiData.category]}), PM2.5 ${aqiData.pollutants.pm25} µg/m³. Cleanest window: ${aqiData.bestWindow.startHour}–${aqiData.bestWindow.endHour}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "NIRVAYU – Breathe Smarter, India",
          text: summaryText,
        });
      } else {
        await navigator.clipboard.writeText(summaryText);
        setShareToast(t.copiedToast);
        setTimeout(() => setShareToast(null), 2600);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(summaryText);
        setShareToast(t.copiedToast);
        setTimeout(() => setShareToast(null), 2600);
      } catch {
        // Ignore clipboard denial
      }
    }
  };

  const handleSheetDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y < -60) {
      setMobileSnap((s) => (s === "peek" ? "half" : "full"));
    } else if (info.offset.y > 60) {
      setMobileSnap((s) => (s === "full" ? "half" : "peek"));
    }
  };

  const mobileSheetHeightClass =
    mobileSnap === "full"
      ? "h-[84vh]"
      : mobileSnap === "half"
        ? "h-[52vh]"
        : "h-[88px]";

  const defaultCompareCity =
    cities.find(
      (c) =>
        selectedPoint &&
        Math.abs(c.lat - selectedPoint.lat) < 0.2 &&
        Math.abs(c.lon - selectedPoint.lon) < 0.2
    )?.id ?? MAJOR_INDIAN_CITIES[0].id;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col relative pb-20 lg:pb-0">
        <AtmosphereBackground category={activeCategory} />

        {/* Offline Banner */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 z-50"
            >
              <WifiOff className="w-4 h-4" />
              <span>{t.offlineBanner}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky Glass Top Bar */}
        <header
          className={`sticky top-0 z-40 transition-all duration-300 ${
            scrolled
              ? "py-2 glass-strong shadow-md"
              : "py-3.5 bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-sky-600 text-white flex items-center justify-center shadow-md">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-teal-900 dark:text-teal-200">
                    {t.brand}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-400">
                    {t.brandDevanagari}
                  </span>
                </div>
                <p className="text-[11px] font-medium opacity-75 hidden sm:block">
                  {t.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setShowCompare(true)}
                className="hidden sm:inline-flex min-h-[40px] px-3 rounded-xl glass-strong hover:bg-teal-500/10 text-xs font-semibold items-center gap-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t.compareBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImpactModal(true)}
                className="hidden md:inline-flex min-h-[40px] px-3 rounded-xl glass-strong hover:bg-teal-500/10 text-xs font-semibold items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t.methodologyBtn}</span>
              </button>

              <button
                type="button"
                onClick={toggleLanguage}
                aria-label="Switch language"
                className="min-h-[40px] px-3 rounded-xl glass-strong hover:bg-teal-500/10 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Languages className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{language === "en" ? "हिंदी" : "EN"}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle dark or light theme"
                className="min-h-[40px] min-w-[40px] rounded-xl glass-strong hover:bg-teal-500/10 flex items-center justify-center"
              >
                <motion.div
                  key={darkMode ? "moon" : "sun"}
                  initial={{ rotate: -60, scale: 0.7 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-teal-800" />
                  )}
                </motion.div>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Heading + Search */}
        <section className="max-w-7xl w-full mx-auto px-3 sm:px-6 pt-2 pb-4 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center lg:text-left space-y-1"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-800 via-sky-700 to-teal-600 dark:from-teal-300 dark:via-sky-300 dark:to-emerald-300 bg-clip-text text-transparent animate-shimmer-text">
              {t.heroTitle}
            </h1>
            <p className="text-xs sm:text-sm opacity-80 max-w-2xl mx-auto lg:mx-0">
              {t.heroSubtitle}
            </p>
          </motion.div>

          <SearchBar
            language={language}
            onSelectLocation={(loc) => loadLocationAqi(loc)}
            onLocationError={(msg) => setLocationAlert(msg)}
          />

          {locationAlert && (
            <div
              role="alert"
              className="glass-strong rounded-2xl px-4 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-200 border border-amber-500/30 flex items-center justify-between gap-2"
            >
              <span>{locationAlert}</span>
              <button
                type="button"
                onClick={() => setLocationAlert(null)}
                className="font-bold underline"
              >
                {t.close}
              </button>
            </div>
          )}
        </section>

        {/* Main Workspace: Split on Desktop, Map + Draggable Sheet on Mobile */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5 items-start">
            {/* Interactive India Map */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="h-[64vh] min-h-[420px] lg:h-[calc(100vh-220px)] lg:sticky lg:top-20"
            >
              <IndiaMap
                cities={cities}
                selectedPoint={selectedPoint}
                language={language}
                onSelectCity={handleSelectCity}
                onMapClick={handleMapClick}
              />
            </motion.div>

            {/* Desktop Results Panel */}
            <div className="hidden lg:block">
              <ResultsPanel
                aqiData={aqiData}
                aqiLoading={aqiLoading}
                aqiError={aqiError}
                profile={profile}
                language={language}
                plan={plan}
                planLoading={planLoading}
                shareToast={shareToast}
                onRetryAqi={() =>
                  selectedPoint && loadLocationAqi(selectedPoint)
                }
                onProfileChange={handleProfileChange}
                onGeneratePlan={handleGeneratePlan}
                onShare={handleShare}
                onOpenImpactModal={() => setShowImpactModal(true)}
              />
            </div>
          </div>
        </main>

        {/* Mobile Draggable Bottom Sheet (3 snap points: peek / half / full) */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.12}
          onDragEnd={handleSheetDragEnd}
          className={`lg:hidden fixed left-0 right-0 bottom-16 z-[500] glass-strong rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-teal-500/25 transition-all duration-300 flex flex-col ${mobileSheetHeightClass}`}
        >
          {/* Sheet Drag Handle & Snap Header */}
          <button
            type="button"
            onClick={() =>
              setMobileSnap((s) =>
                s === "peek" ? "half" : s === "half" ? "full" : "peek"
              )
            }
            className="w-full pt-2.5 pb-2 px-4 flex flex-col items-center gap-1.5 shrink-0"
            aria-label="Toggle results sheet size"
          >
            <span className="w-10 h-1.5 rounded-full bg-slate-400/60" />
            <div className="w-full flex items-center justify-between text-xs font-bold">
              <span className="truncate">
                {aqiData
                  ? `${language === "hi" && aqiData.placeNameHi ? aqiData.placeNameHi : aqiData.placeName} · AQI ${aqiData.indianAqi}`
                  : t.emptyTitle}
              </span>
              <ChevronUp
                className={`w-4 h-4 transition-transform ${
                  mobileSnap === "full" ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {mobileSnap !== "peek" && (
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <ResultsPanel
                aqiData={aqiData}
                aqiLoading={aqiLoading}
                aqiError={aqiError}
                profile={profile}
                language={language}
                plan={plan}
                planLoading={planLoading}
                shareToast={shareToast}
                onRetryAqi={() =>
                  selectedPoint && loadLocationAqi(selectedPoint)
                }
                onProfileChange={handleProfileChange}
                onGeneratePlan={handleGeneratePlan}
                onShare={handleShare}
                onOpenImpactModal={() => setShowImpactModal(true)}
              />
            </div>
          )}
        </motion.div>

        {/* Thumb-Friendly Mobile Bottom Navigation */}
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 h-16 z-[600] glass-strong border-t border-teal-500/20 grid grid-cols-4"
        >
          <button
            type="button"
            onClick={() => {
              setMobileTab("map");
              setMobileSnap("peek");
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              mobileTab === "map" && mobileSnap === "peek"
                ? "text-teal-700 dark:text-teal-300"
                : "opacity-70"
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span>{t.nav.map}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileTab("plan");
              setMobileSnap("half");
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              mobileTab === "plan" || mobileSnap !== "peek"
                ? "text-teal-700 dark:text-teal-300"
                : "opacity-70"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>{t.nav.plan}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCompare(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold opacity-75"
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span>{t.nav.compare}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImpactModal(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold opacity-75"
          >
            <Info className="w-5 h-5" />
            <span>{t.nav.settings}</span>
          </button>
        </nav>

        {/* Privacy Footer */}
        <footer className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 text-center text-[11px] opacity-75">
          {t.footerPrivacy}
        </footer>

        {/* Modals */}
        <CompareModal
          isOpen={showCompare}
          onClose={() => setShowCompare(false)}
          language={language}
          initialCityId={defaultCompareCity}
        />

        <ImpactModal
          isOpen={showImpactModal}
          onClose={() => setShowImpactModal(false)}
          language={language}
        />
      </div>
    </MotionConfig>
  );
}
