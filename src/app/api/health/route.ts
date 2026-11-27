import { enforceSameOrigin, jsonOk, rateLimitGuard } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const originErr = enforceSameOrigin(request);
  if (originErr) return originErr;

  const limitErr = rateLimitGuard(request, "health", 60);
  if (limitErr) return limitErr;

  return jsonOk({
    status: "ok",
    service: "nirvayu-api",
    timestamp: new Date().toISOString(),
    services: {
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      openMeteo: "live",
    },
  });
}
