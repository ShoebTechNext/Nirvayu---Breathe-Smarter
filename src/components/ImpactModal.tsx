"use client";

import { motion } from "framer-motion";
import { Calculator, X } from "lucide-react";
import { TRANSLATIONS } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface ImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export function ImpactModal({ isOpen, onClose, language }: ImpactModalProps) {
  if (!isOpen) return null;
  const t = TRANSLATIONS[language];
  const hi = language === "hi";

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto glass-strong rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>{t.methodologyTitle}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
          <section className="p-3.5 rounded-2xl bg-white/65 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-teal-700 dark:text-teal-300">
              {hi
                ? "1. भारतीय CPCB राष्ट्रीय वायु गुणवत्ता सूचकांक (NAQI)"
                : "1. Indian CPCB National Air Quality Index (NAQI)"}
            </h3>
            <p className="opacity-85">
              {hi
                ? "प्रत्येक प्रदूषक (PM2.5, PM10, NO2, O3, CO, SO2) के लिए CPCB ब्रेकपॉइंट्स से उप-सूचकांक निकाला जाता है और अधिकतम मान को समग्र भारतीय AQI माना जाता है:"
                : "Each pollutant (PM2.5, PM10, NO2, O3, CO, SO2) is mapped to an Indian CPCB sub-index via piecewise linear interpolation, and the highest sub-index defines the overall Indian AQI:"}
            </p>
            <code className="block p-2.5 rounded-xl bg-slate-900 text-teal-200 text-xs overflow-x-auto">
              I_p = ((I_HI - I_LO) / (BP_HI - BP_LO)) * (C_p - BP_LO) + I_LO
            </code>
          </section>

          <section className="p-3.5 rounded-2xl bg-white/65 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-teal-700 dark:text-teal-300">
              {hi
                ? "2. संयुक्त PM2.5 एक्सपोज़र कमी (गुणनात्मक मॉडल)"
                : "2. Combined PM2.5 Exposure Reduction (Multiplicative Dose Model)"}
            </h3>
            <p className="opacity-85">
              {hi
                ? "अति-आशावादी जोड़ से बचने के लिए, स्वतंत्र उपायों (जैसे N95 मास्क, रसोई वेंटिलेशन, HEPA/DIY फिल्टर) को गुणनात्मक रूप से जोड़ा जाता है:"
                : "To avoid unrealistic linear stacking above 100%, independent exposure reductions (e.g., fitted N95 mask, exhaust ventilation, bedroom HEPA/DIY filter) combine multiplicatively:"}
            </p>
            <code className="block p-2.5 rounded-xl bg-slate-900 text-sky-200 text-xs overflow-x-auto">
              Total Reduction (%) = (1 - ∏ (1 - r_i / 100)) × 100   [capped ≤ 78%]
            </code>
          </section>

          <section className="p-3.5 rounded-2xl bg-white/65 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-teal-700 dark:text-teal-300">
              {hi
                ? "3. साप्ताहिक CO₂ बचत अनुमान (भारतीय उत्सर्जन कारक)"
                : "3. Weekly CO₂ Savings (India Emission Factors)"}
            </h3>
            <ul className="list-disc pl-5 space-y-1 opacity-85">
              <li>
                {hi
                  ? "कार → मेट्रो/बस/कारपूल (16 किमी × 3 दिन): ~140g CO₂/किमी की तुलना में ~11.4 kg CO₂/सप्ताह बचत।"
                  : "Car → Metro/Bus/Carpool (16 km × 3 trips/wk): ~11.4 kg CO₂/wk saved vs ~140g CO₂/km."}
              </li>
              <li>
                {hi
                  ? "दोपहिया → सार्वजनिक परिवहन (16 किमी × 3 दिन): ~52g CO₂/किमी के आधार पर ~4.2 kg CO₂/सप्ताह बचत।"
                  : "Two-wheeler → Public transit (16 km × 3 trips/wk): ~4.2 kg CO₂/wk saved at ~52g CO₂/km."}
              </li>
              <li>
                {hi
                  ? "बायोमास/लकड़ी से LPG/इंडक्शन व प्रेशर कुकर: ~18.5 kg CO₂/सप्ताह और भारी इंडोर PM2.5 कमी।"
                  : "Biomass/wood → LPG or Induction + pressure cooking: ~18.5 kg CO₂/wk saved + sharp indoor PM2.5 drop."}
              </li>
              <li>
                {hi
                  ? "सूखे पत्ते/कचरा न जलाना (कम्पोस्टिंग): ~6.4 kg CO₂e/सप्ताह और जहरीले धुएं से बचाव।"
                  : "Avoiding leaf/waste open burning via composting: ~6.4 kg CO₂e/wk avoided."}
              </li>
            </ul>
          </section>

          <p className="text-[11px] opacity-70 italic">
            {hi
              ? "अस्वीकरण: सभी संख्याएं सार्वजनिक पर्यावरण व स्वास्थ्य शोध पर आधारित शैक्षिक अनुमान हैं, चिकित्सा निदान या सलाह नहीं।"
              : "Disclaimer: All figures are transparent lifestyle estimates derived from public environmental health benchmarks, not medical advice."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
