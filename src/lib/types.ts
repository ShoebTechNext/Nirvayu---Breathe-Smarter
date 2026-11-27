export type Language = "en" | "hi";

export type AqiCategoryKey =
  | "good"
  | "satisfactory"
  | "moderate"
  | "poor"
  | "very_poor"
  | "severe";

export interface IndianCity {
  id: string;
  name: string;
  nameHi: string;
  state: string;
  lat: number;
  lon: number;
}

export interface Pollutants {
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number; // ug/m3 from Open-Meteo
  so2: number;
}

export interface HourlyPoint {
  time: string; // ISO string
  hourLabel: string;
  pm25: number;
  pm10: number;
  indianAqi: number;
  usAqi: number;
}

export interface DailyPoint {
  date: string;
  dayLabel: string;
  avgAqi: number;
  maxAqi: number;
  minAqi: number;
  avgPm25: number;
}

export interface AqiLocationData {
  placeName: string;
  placeNameHi?: string;
  state?: string;
  lat: number;
  lon: number;
  indianAqi: number;
  usAqi: number;
  category: AqiCategoryKey;
  dominantPollutant: "PM2.5" | "PM10" | "NO2" | "O3" | "CO" | "SO2";
  pollutants: Pollutants;
  updatedAt: string;
  hourly24: HourlyPoint[];
  daily3: DailyPoint[];
  bestWindow: {
    startHour: string;
    endHour: string;
    expectedAqi: number;
  };
  fallback: boolean;
}

export interface CitySnapshot {
  id: string;
  name: string;
  nameHi: string;
  state: string;
  lat: number;
  lon: number;
  indianAqi: number;
  usAqi: number;
  category: AqiCategoryKey;
  pm25: number;
  pm10: number;
  updatedAt: string;
}

export type CommuteType =
  | "walk"
  | "two_wheeler"
  | "car"
  | "bus"
  | "metro"
  | "wfh";

export type HomeType = "apartment" | "independent" | "informal" | "hostel";
export type CookingFuel = "lpg" | "induction" | "biomass";
export type BudgetLevel = "low" | "medium" | "high";

export interface HouseholdProfile {
  familyMembers: number;
  childrenUnder5: boolean;
  elderly: boolean;
  respiratoryConditions: boolean;
  pregnancy: boolean;
  commuteType: CommuteType;
  homeType: HomeType;
  cookingFuel: CookingFuel;
  hasAirPurifier: boolean;
  budget: BudgetLevel;
  language: Language;
}

export interface RoutineSlot {
  period: "morning" | "afternoon" | "evening";
  title: string;
  timeWindow: string;
  guidance: string;
  outdoorOk: boolean;
}

export interface IndoorHack {
  id: string;
  category:
    | "windows"
    | "diy_filter"
    | "plants"
    | "cooking"
    | "cleaning"
    | "mask";
  title: string;
  description: string;
  costLevel: BudgetLevel;
}

export interface SustainableAlternative {
  id: string;
  area: "commute" | "cooking" | "heating" | "waste";
  title: string;
  description: string;
  costLevel: BudgetLevel;
  difficulty: "easy" | "medium" | "hard";
}

export interface ImpactAction {
  id: string;
  title: string;
  pm25ReductionPct: number;
  co2SavedKgPerWeek: number;
  assumption: string;
}

export interface CleanAirPlan {
  healthAdvisory: {
    riskLevel: AqiCategoryKey;
    headline: string;
    summary: string;
    extraCareGroups: string[];
    disclaimer: string;
  };
  dailyRoutine: RoutineSlot[];
  indoorHacks: IndoorHack[];
  sustainableAlternatives: SustainableAlternative[];
  impactEstimator: {
    totalPm25ReductionPct: number;
    totalCo2SavedKgPerWeek: number;
    actions: ImpactAction[];
    methodologyNote: string;
  };
  checklist: {
    id: string;
    label: string;
    points: number;
  }[];
  fallbackMode?: boolean;
}

export interface GeoResult {
  name: string;
  admin1?: string;
  countryCode: string;
  lat: number;
  lon: number;
}
