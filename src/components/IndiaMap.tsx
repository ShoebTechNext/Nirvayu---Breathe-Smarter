"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { AQI_META } from "@/lib/aqi";
import { isWithinIndiaBounds } from "@/lib/cities";
import { TRANSLATIONS } from "@/lib/i18n";
import type { AqiCategoryKey, CitySnapshot, Language } from "@/lib/types";

interface IndiaMapProps {
  cities: CitySnapshot[];
  selectedPoint: { lat: number; lon: number; name?: string } | null;
  language: Language;
  onSelectCity: (city: CitySnapshot) => void;
  onMapClick: (lat: number, lon: number) => void;
}

const INDIA_CENTER: [number, number] = [22.6, 79.2];

function getMoodText(category: AqiCategoryKey, lang: Language): string {
  if (category === "good" || category === "satisfactory") {
    return lang === "hi" ? "😊 साफ हवा" : "😊 Fresh";
  }
  if (category === "moderate") {
    return lang === "hi" ? "😐 हल्की धुंध" : "😐 Hazy";
  }
  if (category === "poor" || category === "very_poor") {
    return lang === "hi" ? "😷 मास्क पहनें" : "😷 Mask Up";
  }
  return lang === "hi" ? "🚨 गंभीर स्मॉग" : "🚨 Severe";
}

function createCityIcon(
  aqi: number,
  category: AqiCategoryKey,
  isSelected: boolean
): L.DivIcon {
  const meta = AQI_META[category];
  const shouldPulse =
    category === "poor" || category === "very_poor" || category === "severe";

  const size = isSelected ? 40 : 32;
  const ringClass = shouldPulse ? "aqi-pulse-marker" : "";
  const selectedBorder = isSelected
    ? "box-shadow: 0 0 0 3px #ffffff, 0 0 0 6px #0f766e;"
    : "box-shadow: 0 3px 10px rgba(0,0,0,0.28); border: 2px solid rgba(255,255,255,0.92);";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="${ringClass}" style="position:relative;width:${size}px;height:${size}px;border-radius:9999px;background:${meta.color};color:${meta.color};display:flex;align-items:center;justify-content:center;${selectedBorder}transition:transform 0.2s ease;"><span style="color:#ffffff;font-weight:800;font-size:${isSelected ? 12 : 10}px;line-height:1;">${aqi}</span></div>`,
  });
}

function createPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div class="aqi-pulse-marker" style="position:relative;width:30px;height:30px;border-radius:9999px;background:#0F766E;color:#14B8A6;border:3px solid #FFFFFF;box-shadow:0 4px 14px rgba(15,118,110,0.45);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:9999px;background:#FFFFFF;"></div></div>`,
  });
}

function MapFlyController({
  selectedPoint,
}: {
  selectedPoint: { lat: number; lon: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPoint) return;
    map.flyTo([selectedPoint.lat, selectedPoint.lon], 9, {
      duration: 1.1,
      easeLinearity: 0.25,
    });
  }, [map, selectedPoint]);

  return null;
}

function MapClickListener({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (isWithinIndiaBounds(lat, lng)) {
        onMapClick(Number(lat.toFixed(4)), Number(lng.toFixed(4)));
      }
    },
  });
  return null;
}

export default function IndiaMap({
  cities,
  selectedPoint,
  language,
  onSelectCity,
  onMapClick,
}: IndiaMapProps) {
  const t = TRANSLATIONS[language];
  const pinIcon = useMemo(() => createPinIcon(), []);

  const legendItems: { key: AqiCategoryKey; label: string }[] = [
    { key: "good", label: t.categories.good },
    { key: "satisfactory", label: t.categories.satisfactory },
    { key: "moderate", label: t.categories.moderate },
    { key: "poor", label: t.categories.poor },
    { key: "very_poor", label: t.categories.very_poor },
    { key: "severe", label: t.categories.severe },
  ];

  const isCustomPointSelected = useMemo(() => {
    if (!selectedPoint) return false;
    return !cities.some(
      (c) =>
        Math.abs(c.lat - selectedPoint.lat) < 0.03 &&
        Math.abs(c.lon - selectedPoint.lon) < 0.03
    );
  }, [cities, selectedPoint]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden border border-teal-500/20 shadow-xl">
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        minZoom={4}
        maxZoom={14}
        maxBounds={[
          [4.5, 65.0],
          [39.0, 99.5],
        ]}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFlyController selectedPoint={selectedPoint} />
        <MapClickListener onMapClick={onMapClick} />

        {cities.map((city) => {
          const isSelected = Boolean(
            selectedPoint &&
              Math.abs(city.lat - selectedPoint.lat) < 0.05 &&
              Math.abs(city.lon - selectedPoint.lon) < 0.05
          );
          const icon = createCityIcon(city.indianAqi, city.category, isSelected);
          const displayName = language === "hi" ? city.nameHi : city.name;

          return (
            <Marker
              key={city.id}
              position={[city.lat, city.lon]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectCity(city),
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -14]}
                className="nirvayu-tooltip"
              >
                <div className="min-w-[130px]">
                  <div className="font-bold text-xs flex items-center justify-between gap-2">
                    <span>{displayName}</span>
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] text-white font-bold"
                      style={{ background: AQI_META[city.category].color }}
                    >
                      AQI {city.indianAqi}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5 flex items-center justify-between gap-2">
                    <span>{t.categories[city.category]}</span>
                    <span>{getMoodText(city.category, language)}</span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {isCustomPointSelected && selectedPoint && (
          <Marker
            position={[selectedPoint.lat, selectedPoint.lon]}
            icon={pinIcon}
          />
        )}
      </MapContainer>

      {/* Top map hint pill */}
      <div className="pointer-events-none absolute top-3 left-14 right-3 z-[400] flex justify-end">
        <div className="glass-strong px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm">
          {t.mapHint}
        </div>
      </div>

      {/* Floating CPCB Legend */}
      <div className="absolute bottom-3 left-3 z-[400] glass-strong rounded-2xl p-2.5 shadow-md max-w-[92%]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-1.5">
          {t.legendTitle}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {legendItems.map((item) => {
            const meta = AQI_META[item.key];
            return (
              <div
                key={item.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/60 dark:bg-slate-900/60"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                <span className="opacity-65 hidden sm:inline">({meta.range})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
