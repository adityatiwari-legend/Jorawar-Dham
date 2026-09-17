interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store (prepared to be backed by Redis in multi-instance production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup of stale entries (every 5 minutes)
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  timer.unref?.();
}

export interface RateLimitOptions {
  windowMs?: number;   // Window in milliseconds (default: 60s)
  maxRequests?: number; // Maximum permitted hits per window
}

export function checkRateLimit(
  identifier: string,
  options?: RateLimitOptions
): { allowed: boolean; remaining: number; resetInMs: number } {
  const windowMs = options?.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
  const maxRequests = options?.maxRequests || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt <= now) {
    // New or expired window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInMs: windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, entry.resetAt - now),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetInMs: Math.max(0, entry.resetAt - now),
  };
}

export const rateLimiter = {
  limit: async (identifier: string, maxRequests = 60, windowSeconds = 60) => {
    return checkRateLimit(identifier, { maxRequests, windowMs: windowSeconds * 1000 });
  },
};

export function rateLimit(identifier: string, maxRequests = 60, windowSeconds = 60) {
  return checkRateLimit(identifier, { maxRequests, windowMs: windowSeconds * 1000 });
}

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
