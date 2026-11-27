import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "./rate-limit";

export function jsonOk(
  data: unknown,
  options?: { status?: number; cacheControl?: string }
): NextResponse {
  return NextResponse.json(data, {
    status: options?.status ?? 200,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": options?.cacheControl ?? "no-store",
    },
  });
}

export function jsonError(
  message: string,
  status = 400,
  extraHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
        ...(extraHeaders ?? {}),
      },
    }
  );
}

export function rateLimitGuard(
  request: Request,
  routeKey: string,
  limitPerMinute: number
): NextResponse | null {
  const ip = getClientIp(request);
  const res = checkRateLimit(ip, routeKey, limitPerMinute, 60_000);
  if (!res.allowed) {
    return jsonError(
      "Too many requests. Please wait a moment and try again.",
      429,
      { "Retry-After": String(res.retryAfterSec) }
    );
  }
  return null;
}

export function enforceSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null; // Non-browser clients (curl/health checks) or same-origin GETs

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;

  try {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.host !== host) {
      return jsonError("Cross-origin requests are not allowed.", 403);
    }
  } catch {
    return jsonError("Invalid request origin.", 403);
  }
  return null;
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Upstream HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
