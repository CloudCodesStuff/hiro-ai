// Daily rate limiter — in-memory, IP-based, resets every 24 hours.
// Simple serverless-compatible implementation with basic abuse protection.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 300_000);

const DAILY_LIMIT = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

function getResetTime(): number {
  // Reset at midnight UTC
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return midnight.getTime();
}

/**
 * Check if a request is within the daily rate limit.
 */
export function checkDailyLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = store.get(identifier);

  // No entry or window expired — fresh start
  if (!entry || now > entry.resetAt) {
    const resetAt = getResetTime();
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: DAILY_LIMIT - 1, limit: DAILY_LIMIT, resetAt };
  }

  // Within the window
  entry.count++;
  const remaining = Math.max(0, DAILY_LIMIT - entry.count);

  return {
    allowed: entry.count <= DAILY_LIMIT,
    remaining,
    limit: DAILY_LIMIT,
    resetAt: entry.resetAt,
  };
}

/**
 * Get remaining messages (doesn't increment count).
 */
export function getRemaining(identifier: string): {
  remaining: number;
  limit: number;
  limitReached: boolean;
} {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    return { remaining: DAILY_LIMIT, limit: DAILY_LIMIT, limitReached: false };
  }

  const remaining = Math.max(0, DAILY_LIMIT - entry.count);
  return {
    remaining,
    limit: DAILY_LIMIT,
    limitReached: entry.count >= DAILY_LIMIT,
  };
}

/**
 * Extract identifier from request headers.
 */
export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
