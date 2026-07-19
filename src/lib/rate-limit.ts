// In-memory rate limiter for serverless environments.
// Resets when the function instance cold-starts, which is acceptable
// for basic abuse protection without external dependencies.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000, // 1 minute
};

/**
 * Check if a request should be rate limited.
 * Returns true if the request is allowed, false if limited.
 */
export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const entry = store.get(identifier);

  // No existing entry or window expired — create fresh
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(identifier, newEntry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: newEntry.resetAt };
  }

  // Within window
  entry.count++;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract a rate-limit identifier from a Request.
 * Uses X-Forwarded-For header (Vercel) or falls back to a simple hash.
 */
export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // Fallback: use a session cookie or IP from request
  const cookie = request.headers.get("cookie") ?? "";
  // Simple hash for privacy — not perfect but sufficient for basic limiting
  return `session:${cookie.slice(0, 50)}`;
}
