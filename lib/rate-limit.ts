import { Ratelimit } from '@upstash/ratelimit';

/**
 * In-memory rate limiting store
 * For production, replace with Redis using @upstash/redis
 *
 * To upgrade to Redis:
 * 1. Install: npm install @upstash/redis
 * 2. Import: import { Redis } from '@upstash/redis'
 * 3. Replace store with: new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
 */
class InMemoryStore {
  private store: Map<string, { count: number; reset: number }> = new Map();

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if the entry has expired
    if (Date.now() > entry.reset) {
      this.store.delete(key);
      return null;
    }

    return entry.count;
  }

  async set(key: string, count: number, expiresIn: number): Promise<void> {
    const reset = Date.now() + expiresIn;
    this.store.set(key, { count, reset });
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newCount = (current || 0) + 1;

    // Keep existing reset time or set new one (15 minutes from now)
    const entry = this.store.get(key);
    const reset = entry?.reset || Date.now() + 15 * 60 * 1000;

    this.store.set(key, { count: newCount, reset });
    return newCount;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (now > entry.reset) {
        this.store.delete(key);
      }
    });
  }
}

// Create a singleton store instance
const store = new InMemoryStore();

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => store.cleanup(), 5 * 60 * 1000);
}

/**
 * Rate limiter for authentication endpoints
 * Sliding window: 5 attempts per 15 minutes
 */
export const authRateLimiter = new Ratelimit({
  // @ts-ignore - Using custom store implementation
  redis: store,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: false,
  prefix: 'ratelimit:auth',
});

/**
 * Rate limiter for general API endpoints
 * Sliding window: 20 attempts per minute
 */
export const apiRateLimiter = new Ratelimit({
  // @ts-ignore - Using custom store implementation
  redis: store,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: false,
  prefix: 'ratelimit:api',
});

/**
 * Rate limiter for messaging endpoint
 * Sliding window: 3 attempts per minute
 */
export const messagesRateLimiter = new Ratelimit({
  // @ts-ignore - Using custom store implementation
  redis: store,
  limiter: Ratelimit.slidingWindow(3, '1 m'),
  analytics: false,
  prefix: 'ratelimit:messages',
});

/**
 * Get client identifier from request
 * Uses IP address or fallback to user-agent
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  // If IP is unknown, use user-agent as fallback
  if (ip === 'unknown') {
    return request.headers.get('user-agent') || 'anonymous';
  }

  return ip;
}

/**
 * Apply rate limiting to a request
 * Returns null if allowed, or error response if rate limited
 */
export async function checkRateLimit(
  request: Request,
  limiter: Ratelimit = authRateLimiter
): Promise<{ success: boolean; limit: number; remaining: number; reset: number } | null> {
  const identifier = getClientIdentifier(request);

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return {
      success: false,
      limit,
      remaining,
      reset,
    };
  }

  return null;
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
