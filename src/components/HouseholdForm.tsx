"use client";

import { Lock, Users } from "lucide-react";
import { TRANSLATIONS } from "@/lib/i18n";
import type {
  BudgetLevel,
  CommuteType,
  CookingFuel,
  HomeType,
  HouseholdProfile,
  Language,
} from "@/lib/types";

interface HouseholdFormProps {
  profile: HouseholdProfile;
  language: Language;
  onChange: (next: HouseholdProfile) => void;
}

export function HouseholdForm({
  profile,
  language,
  onChange,
}: HouseholdFormProps) {
  const t = TRANSLATIONS[language];

  const update = <K extends keyof HouseholdProfile>(
    key: K,
    val: HouseholdProfile[K]
  ) => {
    onChange({ ...profile, [key]: val });
  };

  return (
    <div className="glass-card rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{t.profileTitle}</span>
          </h3>
          <p className="text-[11px] opacity-70 flex items-center gap-1 mt-0.5">
            <Lock className="w-3 h-3 shrink-0" />
            <span>{t.profilePrivacy}</span>
          </p>
        </div>
      </div>

      {/* Family Members & Sensitive Groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs font-semibold block">
          {t.familyMembers}
          <input
            type="number"
            min={1}
            max={20}
            value={profile.familyMembers}
            onChange={(e) =>
              update(
                "familyMembers",
                Math.min(20, Math.max(1, Number(e.target.value) || 1))
              )
            }
            className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-700 text-sm"
          />
        </label>

        <label className="text-xs font-semibold block">
          {t.commuteType}
          <select
            value={profile.commuteType}
            onChange={(e) =>
              update("commuteType", e.target.value as CommuteType)
            }
            className="mt-1 w-full min-h-[44px] px-3 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-700 text-sm"
          >
            {(Object.keys(t.commuteOptions) as CommuteType[]).map((k) => (
              <option key={k} value={k}>
                {t.commuteOptions[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Sensitive flags as accessible toggle pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["childrenUnder5", t.childrenUnder5],
            ["elderly", t.elderly],
            ["respiratoryConditions", t.respiratory],
            ["pregnancy", t.pregnancy],
          ] as const
        ).map(([key, label]) => {
          const active = profile[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => update(key, !active)}
              aria-pressed={active}
              className={`min-h-[40px] px-3 rounded-full text-xs font-semibold border transition-all ${
                active
                  ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                  : "bg-white/60 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700 hover:border-teal-500"
              }`}
            >
              {active ? "✓ " : "+ "}
              {label}
            </button>
          );
        })}
      </div>

      {/* Home, Cooking, Purifier, Budget */}
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold block">
          {t.homeType}
          <select
            value={profile.homeType}
            onChange={(e) => update("homeType", e.target.value as HomeType)}
            className="mt-1 w-full min-h-[44px] px-2.5 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          >
            {(Object.keys(t.homeOptions) as HomeType[]).map((k) => (
              <option key={k} value={k}>
                {t.homeOptions[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold block">
          {t.cookingFuel}
          <select
            value={profile.cookingFuel}
            onChange={(e) =>
              update("cookingFuel", e.target.value as CookingFuel)
            }
            className="mt-1 w-full min-h-[44px] px-2.5 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          >
            {(Object.keys(t.fuelOptions) as CookingFuel[]).map((k) => (
              <option key={k} value={k}>
                {t.fuelOptions[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold block">
          {t.budget}
          <select
            value={profile.budget}
            onChange={(e) => update("budget", e.target.value as BudgetLevel)}
            className="mt-1 w-full min-h-[44px] px-2.5 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          >
            {(Object.keys(t.budgetOptions) as BudgetLevel[]).map((k) => (
              <option key={k} value={k}>
                {t.budgetOptions[k]}
              </option>
            ))}
          </select>
        </label>

        <div className="text-xs font-semibold">
          <span>{t.hasPurifier}</span>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => update("hasAirPurifier", val)}
                className={`min-h-[44px] rounded-xl border text-xs font-semibold transition-all ${
                  profile.hasAirPurifier === val
                    ? "bg-teal-700 text-white border-teal-700"
                    : "bg-white/60 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700"
                }`}
              >
                {val ? t.yes : t.no}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
