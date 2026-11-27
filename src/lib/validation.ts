import { z } from "zod";
import { INDIA_BOUNDS } from "./cities";

export const IndiaLatSchema = z
  .number()
  .finite()
  .min(INDIA_BOUNDS.minLat, "Latitude outside India bounds")
  .max(INDIA_BOUNDS.maxLat, "Latitude outside India bounds");

export const IndiaLonSchema = z
  .number()
  .finite()
  .min(INDIA_BOUNDS.minLon, "Longitude outside India bounds")
  .max(INDIA_BOUNDS.maxLon, "Longitude outside India bounds");

export const CoordsQuerySchema = z
  .object({
    lat: IndiaLatSchema,
    lon: IndiaLonSchema,
    name: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const GeocodeSearchSchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(2, "Search query must be at least 2 characters")
      .max(80, "Search query is too long")
      .regex(/^[\p{L}\p{N}\s,.-]+$/u, "Unsupported characters in search query"),
  })
  .strict();

export const LanguageSchema = z.enum(["en", "hi"]);

export const AqiCategorySchema = z.enum([
  "good",
  "satisfactory",
  "moderate",
  "poor",
  "very_poor",
  "severe",
]);

export const HouseholdProfileSchema = z
  .object({
    familyMembers: z.number().int().min(1).max(20).default(4),
    childrenUnder5: z.boolean().default(false),
    elderly: z.boolean().default(false),
    respiratoryConditions: z.boolean().default(false),
    pregnancy: z.boolean().default(false),
    commuteType: z
      .enum(["walk", "two_wheeler", "car", "bus", "metro", "wfh"])
      .default("two_wheeler"),
    homeType: z
      .enum(["apartment", "independent", "informal", "hostel"])
      .default("apartment"),
    cookingFuel: z.enum(["lpg", "induction", "biomass"]).default("lpg"),
    hasAirPurifier: z.boolean().default(false),
    budget: z.enum(["low", "medium", "high"]).default("medium"),
    language: LanguageSchema.default("en"),
  })
  .strict();

export const PlanRequestSchema = z
  .object({
    language: LanguageSchema,
    profile: HouseholdProfileSchema,
    aqiData: z
      .object({
        placeName: z.string().trim().min(1).max(80),
        lat: IndiaLatSchema,
        lon: IndiaLonSchema,
        indianAqi: z.number().min(0).max(700),
        usAqi: z.number().min(0).max(700),
        category: AqiCategorySchema,
        dominantPollutant: z.enum(["PM2.5", "PM10", "NO2", "O3", "CO", "SO2"]),
        pollutants: z
          .object({
            pm25: z.number().min(0).max(1500),
            pm10: z.number().min(0).max(2000),
            no2: z.number().min(0).max(1500),
            o3: z.number().min(0).max(1500),
            co: z.number().min(0).max(100000),
            so2: z.number().min(0).max(2500),
          })
          .strict(),
        bestWindow: z
          .object({
            startHour: z.string().trim().max(16),
            endHour: z.string().trim().max(16),
            expectedAqi: z.number().min(0).max(700),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export const CleanAirPlanSchema = z
  .object({
    healthAdvisory: z
      .object({
        riskLevel: AqiCategorySchema,
        headline: z.string().min(3).max(220),
        summary: z.string().min(10).max(600),
        extraCareGroups: z.array(z.string().min(2).max(120)).min(1).max(6),
        disclaimer: z.string().min(10).max(300),
      })
      .strict(),
    dailyRoutine: z
      .array(
        z
          .object({
            period: z.enum(["morning", "afternoon", "evening"]),
            title: z.string().min(2).max(120),
            timeWindow: z.string().min(2).max(60),
            guidance: z.string().min(10).max(400),
            outdoorOk: z.boolean(),
          })
          .strict()
      )
      .length(3),
    indoorHacks: z
      .array(
        z
          .object({
            id: z.string().min(1).max(40),
            category: z.enum([
              "windows",
              "diy_filter",
              "plants",
              "cooking",
              "cleaning",
              "mask",
            ]),
            title: z.string().min(2).max(120),
            description: z.string().min(10).max(360),
            costLevel: z.enum(["low", "medium", "high"]),
          })
          .strict()
      )
      .min(4)
      .max(6),
    sustainableAlternatives: z
      .array(
        z
          .object({
            id: z.string().min(1).max(40),
            area: z.enum(["commute", "cooking", "heating", "waste"]),
            title: z.string().min(2).max(120),
            description: z.string().min(10).max(360),
            costLevel: z.enum(["low", "medium", "high"]),
            difficulty: z.enum(["easy", "medium", "hard"]),
          })
          .strict()
      )
      .min(3)
      .max(5),
    impactEstimator: z
      .object({
        totalPm25ReductionPct: z.number().min(0).max(85),
        totalCo2SavedKgPerWeek: z.number().min(0).max(150),
        actions: z
          .array(
            z
              .object({
                id: z.string().min(1).max(40),
                title: z.string().min(2).max(120),
                pm25ReductionPct: z.number().min(0).max(60),
                co2SavedKgPerWeek: z.number().min(0).max(80),
                assumption: z.string().min(5).max(260),
              })
              .strict()
          )
          .min(3)
          .max(6),
        methodologyNote: z.string().min(10).max(360),
      })
      .strict(),
    checklist: z
      .array(
        z
          .object({
            id: z.string().min(1).max(40),
            label: z.string().min(3).max(180),
            points: z.number().int().min(5).max(50),
          })
          .strict()
      )
      .min(4)
      .max(8),
  })
  .strict();

export function sanitizePlainText(input: string): string {
  return input.replace(/[\u0000-\u001F\u007F<>`]/g, "").trim();
}
