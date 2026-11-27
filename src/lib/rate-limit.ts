interface BucketEntry {
  timestamps: number[];
}

const buckets = new Map<string, BucketEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * In-memory sliding-window rate limiter per IP + route bucket.
 * For multi-instance production deployments, replace with Redis/Upstash.
 */
export function checkRateLimit(
  ip: string,
  routeKey: string,
  limit: number,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const key = `${routeKey}:${ip}`;
  const cutoff = now - windowMs;

  const entry = buckets.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, entry);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  entry.timestamps.push(now);
  buckets.set(key, entry);

  // Opportunistic cleanup so map stays bounded
  if (buckets.size > 2000) {
    for (const [k, v] of buckets.entries()) {
      const fresh = v.timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) {
        buckets.delete(k);
      } else {
        v.timestamps = fresh;
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.timestamps.length),
    retryAfterSec: 0,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);
  return "127.0.0.1";
}
