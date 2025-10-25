# Rate Limiting Implementation Guide

## Overview

DAVR implements rate limiting to protect authentication endpoints from abuse, brute-force attacks, and automated bots. This document describes the implementation, configuration, and upgrade path to production-ready Redis.

---

## Current Implementation

### Technology Stack

- **Library**: `@upstash/ratelimit` v2.0.6
- **Store**: In-memory (development)
- **Algorithm**: Sliding window
- **Scope**: Authentication endpoints

### Rate Limits

#### Authentication Endpoints
- **Limit**: 5 attempts per 15 minutes
- **Endpoints**:
  - `/api/auth/register` (POST)
  - `/api/auth/[...nextauth]` (POST, signin/callback only)
- **Window**: Sliding window (more accurate than fixed window)

#### General API Endpoints
- **Limit**: 20 attempts per minute
- **Store**: Available for future use via `apiRateLimiter`
- **Status**: Not yet applied (prepared for future implementation)

---

## Architecture

### File Structure

```
lib/
  rate-limit.ts              # Core rate limiting logic
app/
  api/
    auth/
      register/route.ts      # Registration with rate limiting
      [...nextauth]/route.ts # NextAuth with rate limiting
  auth/
    rate-limit-exceeded/     # User-facing error page
      page.tsx
```

### Core Components

#### 1. In-Memory Store (`lib/rate-limit.ts`)

```typescript
class InMemoryStore {
  private store: Map<string, { count: number; reset: number }>;

  async get(key: string): Promise<number | null>
  async set(key: string, count: number, expiresIn: number): Promise<void>
  async incr(key: string): Promise<number>
  cleanup(): void // Removes expired entries every 5 minutes
}
```

**Characteristics:**
- ✅ Zero external dependencies
- ✅ Perfect for development and testing
- ✅ Automatic cleanup of expired entries
- ⚠️ Does not persist across server restarts
- ⚠️ Not shared across multiple server instances
- ❌ Not suitable for production with multiple instances

#### 2. Rate Limiters

**Auth Rate Limiter:**
```typescript
export const authRateLimiter = new Ratelimit({
  redis: store, // In-memory store
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: false,
  prefix: 'ratelimit:auth',
});
```

**API Rate Limiter (prepared for future use):**
```typescript
export const apiRateLimiter = new Ratelimit({
  redis: store,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: false,
  prefix: 'ratelimit:api',
});
```

#### 3. Client Identification

```typescript
export function getClientIdentifier(request: Request): string
```

Identifies clients by:
1. `x-forwarded-for` header (primary)
2. `x-real-ip` header (fallback)
3. `cf-connecting-ip` header (Cloudflare)
4. `user-agent` header (last resort)

**Important**: In production behind a proxy (Vercel, Cloudflare, etc.), ensure proxy headers are properly configured.

#### 4. Rate Limit Headers

Standard rate limit headers are returned with all responses:

```typescript
X-RateLimit-Limit: 5        // Maximum attempts allowed
X-RateLimit-Remaining: 3     // Attempts remaining in window
X-RateLimit-Reset: 1697123456 // Unix timestamp when window resets
```

---

## Usage Examples

### Applying Rate Limiting to API Routes

```typescript
import { authRateLimiter, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Check rate limit
  const identifier = getClientIdentifier(request);
  const { success, limit, remaining, reset } = await authRateLimiter.limit(identifier);

  const headers = getRateLimitHeaders({ limit, remaining, reset });

  // Reject if rate limited
  if (!success) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      { status: 429, headers }
    );
  }

  // Process request...
  // Always include rate limit headers in response
  return NextResponse.json(data, { status: 200, headers });
}
```

### Custom Rate Limiters

Create custom rate limiters for different use cases:

```typescript
import { Ratelimit } from '@upstash/ratelimit';

// Strict rate limit for sensitive operations
export const strictRateLimiter = new Ratelimit({
  redis: store,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'ratelimit:strict',
});

// Lenient rate limit for read operations
export const readRateLimiter = new Ratelimit({
  redis: store,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'ratelimit:read',
});
```

---

## Upgrading to Redis (Production)

### Why Upgrade?

The in-memory store is **not suitable for production** in these scenarios:
- Multiple server instances (horizontal scaling)
- Serverless deployments (Vercel, AWS Lambda)
- Need for persistent rate limit state
- Analytics and monitoring requirements

### Step 1: Set Up Upstash Redis

1. Create a free Upstash Redis database at [https://upstash.com](https://upstash.com)
2. Copy the REST API credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Step 2: Update Environment Variables

Add to `.env`:

```env
# Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Step 3: Install Upstash Redis

```bash
npm install @upstash/redis
```

### Step 4: Update `lib/rate-limit.ts`

Replace the in-memory store with Upstash Redis:

```typescript
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Update rate limiters to use Redis
export const authRateLimiter = new Ratelimit({
  redis, // ← Changed from in-memory store
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true, // ← Enable analytics in production
  prefix: 'ratelimit:auth',
});

export const apiRateLimiter = new Ratelimit({
  redis, // ← Changed from in-memory store
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

// Remove InMemoryStore class and all related code
```

### Step 5: Test

1. Run application: `npm run dev`
2. Verify Redis connection in Upstash dashboard
3. Test rate limiting by making multiple requests
4. Check analytics in Upstash dashboard (if enabled)

---

## Testing Rate Limiting

### Manual Testing

```bash
# Test registration endpoint
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}' \
    -i
done

# Expected:
# - Requests 1-5: Success or validation error (200/400)
# - Request 6: Rate limit exceeded (429)
```

### Automated Testing

```typescript
// tests/rate-limiting.test.ts
import { authRateLimiter } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  it('should allow 5 requests within 15 minutes', async () => {
    const identifier = 'test-user';

    for (let i = 0; i < 5; i++) {
      const result = await authRateLimiter.limit(identifier);
      expect(result.success).toBe(true);
    }
  });

  it('should block 6th request', async () => {
    const identifier = 'test-user-2';

    // Make 5 successful requests
    for (let i = 0; i < 5; i++) {
      await authRateLimiter.limit(identifier);
    }

    // 6th request should fail
    const result = await authRateLimiter.limit(identifier);
    expect(result.success).toBe(false);
  });
});
```

---

## Monitoring and Analytics

### Response Headers

Monitor rate limit usage via headers:

```typescript
// Client-side monitoring
fetch('/api/auth/register', { method: 'POST', body: data })
  .then(response => {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    console.log(`Rate limit: ${remaining}/${limit} remaining`);
    console.log(`Resets at: ${new Date(parseInt(reset) * 1000)}`);
  });
```

### Server-Side Logging

Log rate limit events for analysis:

```typescript
if (!success) {
  console.warn('[Rate Limit]', {
    identifier,
    endpoint: request.url,
    limit,
    remaining,
    reset: new Date(reset * 1000),
  });
}
```

### Upstash Analytics (Redis Only)

When using Upstash Redis with `analytics: true`:
- View request patterns in Upstash dashboard
- Identify potential attacks
- Optimize rate limit thresholds
- Monitor abuse patterns

---

## Security Considerations

### IP Spoofing

**Risk**: Attackers may spoof IP addresses via headers.

**Mitigation**:
- Use trusted proxy headers only in production
- Configure `x-forwarded-for` validation on proxy level
- Consider additional identifiers (session, fingerprint)

### Distributed Attacks

**Risk**: Attackers use multiple IPs to bypass limits.

**Mitigation**:
- Implement additional rate limits by user account
- Use CAPTCHA after failed attempts
- Monitor for suspicious patterns

### Header Manipulation

**Risk**: Clients may try to manipulate rate limit headers.

**Protection**:
- Rate limit headers are informational only
- Server-side state is authoritative
- Headers cannot be used to reset limits

---

## Troubleshooting

### Issue: Rate limiting not working

**Causes:**
1. In-memory store resets on server restart
2. Multiple server instances not sharing state
3. Client identifier not unique

**Solutions:**
1. Upgrade to Redis for persistence
2. Use Redis for shared state across instances
3. Verify `getClientIdentifier()` returns unique values

### Issue: False positives (legitimate users blocked)

**Causes:**
1. Rate limit too strict
2. Multiple users behind same IP (corporate network)
3. Aggressive polling from frontend

**Solutions:**
1. Adjust rate limit thresholds
2. Add user-based rate limiting (in addition to IP)
3. Implement exponential backoff on client

### Issue: Memory usage growing (in-memory store)

**Cause:** Expired entries not cleaned up fast enough

**Solution:**
1. Reduce cleanup interval (currently 5 minutes)
2. Upgrade to Redis (automatically handles TTL)

---

## Best Practices

### 1. Progressive Enhancement

Start with lenient limits and tighten based on abuse:

```typescript
// Development: Lenient
const DEV_LIMIT = 10;
const DEV_WINDOW = '5 m';

// Production: Strict
const PROD_LIMIT = 5;
const PROD_WINDOW = '15 m';

export const authRateLimiter = new Ratelimit({
  redis: store,
  limiter: Ratelimit.slidingWindow(
    process.env.NODE_ENV === 'production' ? PROD_LIMIT : DEV_LIMIT,
    process.env.NODE_ENV === 'production' ? PROD_WINDOW : DEV_WINDOW
  ),
});
```

### 2. User-Friendly Error Messages

Always explain why and how long:

```typescript
{
  error: 'RATE_LIMIT_EXCEEDED',
  message: 'Zu viele Anmeldeversuche.',
  retryAfter: 900, // seconds
  tip: 'Bitte versuchen Sie es in 15 Minuten erneut.'
}
```

### 3. Graceful Degradation

Allow bypassing rate limits for admin users or in emergencies:

```typescript
if (session?.user?.isAdmin) {
  // Skip rate limiting for admins
  return processRequest();
}
```

### 4. Layer Multiple Limits

Apply different limits at different levels:

```typescript
// Per-IP limit
const ipLimit = await authRateLimiter.limit(getClientIdentifier(request));

// Per-user limit (stricter)
if (email) {
  const userLimit = await strictRateLimiter.limit(email);
}
```

---

## Future Enhancements

### Planned Improvements

1. **User-based rate limiting** - Track attempts by email/user ID
2. **CAPTCHA integration** - Require CAPTCHA after 3 failed attempts
3. **Adaptive rate limiting** - Adjust limits based on detected patterns
4. **Whitelist/Blacklist** - Bypass or block specific IPs
5. **Geolocation-based limits** - Different limits per region
6. **Real-time monitoring dashboard** - Visualize rate limit metrics

### Integration Points

```typescript
// app/api/auth/register/route.ts
// TODO: Add CAPTCHA after 3 failed attempts
// TODO: Send alert email after 5 failed attempts
// TODO: Temporary account lock after 10 failed attempts
```

---

## API Reference

### `authRateLimiter`

Rate limiter for authentication endpoints.

**Config:**
- Limit: 5 attempts
- Window: 15 minutes
- Algorithm: Sliding window

### `apiRateLimiter`

Rate limiter for general API endpoints.

**Config:**
- Limit: 20 attempts
- Window: 1 minute
- Algorithm: Sliding window

### `getClientIdentifier(request: Request): string`

Extract unique client identifier from request.

**Returns:** IP address or user-agent string

### `getRateLimitHeaders(result): Record<string, string>`

Generate standard rate limit response headers.

**Returns:**
```typescript
{
  'X-RateLimit-Limit': string,
  'X-RateLimit-Remaining': string,
  'X-RateLimit-Reset': string
}
```

---

## Support

For questions or issues with rate limiting:

1. Check logs for rate limit warnings
2. Review Upstash dashboard (if using Redis)
3. Consult this documentation
4. Open an issue in the project repository

---

**Document Version:** 1.0
**Last Updated:** 2025-10-16
**Author:** Claude Code
**Status:** ✅ Implemented (In-Memory) | ⏳ Pending (Redis Upgrade)
