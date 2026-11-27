"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, LocateFixed, MapPin, Search, X } from "lucide-react";
import { isWithinIndiaBounds } from "@/lib/cities";
import { TRANSLATIONS } from "@/lib/i18n";
import type { GeoResult, Language } from "@/lib/types";

interface SearchBarProps {
  language: Language;
  onSelectLocation: (loc: { lat: number; lon: number; name: string }) => void;
  onLocationError: (msg: string) => void;
}

export function SearchBar({
  language,
  onSelectLocation,
  onLocationError,
}: SearchBarProps) {
  const t = TRANSLATIONS[language];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showCoordsModal, setShowCoordsModal] = useState(false);
  const [latInput, setLatInput] = useState("23.2599");
  const [lonInput, setLonInput] = useState("77.4126");
  const [coordsErr, setCoordsErr] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cycle placeholder city names smoothly
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % t.searchCities.length);
    }, 2600);
    return () => clearInterval(id);
  }, [t.searchCities.length]);

  // '/' keyboard shortcut to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "SELECT"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = (await res.json()) as { results?: GeoResult[] };
          setResults(data.results ?? []);
          setIsOpen(true);
        }
      } catch {
        // Silent fail on transient typing
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      onLocationError(t.locationUnsupported);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        if (!isWithinIndiaBounds(lat, lon)) {
          setLocating(false);
          onLocationError(t.invalidCoords);
          return;
        }
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          const data = (await res.json()) as { name?: string };
          onSelectLocation({
            lat,
            lon,
            name: data.name ?? "My Location",
          });
        } catch {
          onSelectLocation({ lat, lon, name: "My Location" });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        onLocationError(t.locationDenied);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleApplyCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Number(latInput);
    const lon = Number(lonInput);
    if (!isWithinIndiaBounds(lat, lon)) {
      setCoordsErr(t.invalidCoords);
      return;
    }
    setCoordsErr("");
    setShowCoordsModal(false);
    onSelectLocation({
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      name: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
    });
  };

  const animatedCity = t.searchCities[placeholderIdx];

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-teal-700 dark:text-teal-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (val.trim().length < 2) {
                setResults([]);
                setIsOpen(false);
              }
            }}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            aria-label={t.searchPlaceholderPrefix}
            placeholder={`${t.searchPlaceholderPrefix} (${animatedCity})`}
            className="w-full min-h-[46px] pl-10 pr-20 rounded-2xl glass-strong text-sm font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setIsOpen(false);
                }}
                aria-label="Clear search"
                className="p-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                /
              </kbd>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute left-0 right-0 mt-2 z-[600] glass-strong rounded-2xl shadow-2xl overflow-hidden border border-teal-500/25 max-h-72 overflow-y-auto"
              >
                {isSearching ? (
                  <div className="p-3 text-xs text-slate-500">Searching India...</div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500">
                    No matching Indian city/town found.
                  </div>
                ) : (
                  results.map((item, idx) => (
                    <button
                      key={`${item.name}-${item.lat}-${idx}`}
                      type="button"
                      onClick={() => {
                        setQuery(
                          item.admin1
                            ? `${item.name}, ${item.admin1}`
                            : item.name
                        );
                        setIsOpen(false);
                        onSelectLocation({
                          lat: item.lat,
                          lon: item.lon,
                          name: item.name,
                        });
                      }}
                      className="w-full text-left px-3.5 py-2.5 min-h-[44px] hover:bg-teal-500/15 flex items-center justify-between gap-2 text-sm transition-colors"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{item.name}</span>
                        {item.admin1 && (
                          <span className="text-xs opacity-65">
                            {item.admin1}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] opacity-60 tabular-nums">
                        {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
                      </span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locating}
            className="min-h-[46px] flex-1 sm:flex-none px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
          >
            <LocateFixed className="w-4 h-4 shrink-0" />
            <span>{locating ? t.locating : t.useMyLocation}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCoordsModal(true)}
            className="min-h-[46px] px-3.5 rounded-2xl glass-strong hover:bg-teal-500/10 active:scale-[0.98] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all"
            title={t.enterCoords}
          >
            <Compass className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            <span className="hidden sm:inline">{t.enterCoords}</span>
          </button>
        </div>
      </div>

      {/* Manual Coordinates Modal */}
      <AnimatePresence>
        {showCoordsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.form
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onSubmit={handleApplyCoords}
              className="w-full max-w-sm glass-strong rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">{t.coordsModalTitle}</h3>
                <button
                  type="button"
                  onClick={() => setShowCoordsModal(false)}
                  aria-label={t.close}
                  className="p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold">
                  {t.latLabel}
                  <input
                    type="number"
                    step="0.0001"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </label>

                <label className="block text-xs font-semibold">
                  {t.lonLabel}
                  <input
                    type="number"
                    step="0.0001"
                    value={lonInput}
                    onChange={(e) => setLonInput(e.target.value)}
                    className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </label>
              </div>

              {coordsErr && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {coordsErr}
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-colors"
              >
                {t.applyCoords}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
