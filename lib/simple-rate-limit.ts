import { NextRequest } from 'next/server';

// Simple in-memory rate limiter for development
class SimpleRateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 5, windowMs: number = 60000) { // 5 requests per minute by default
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(request: NextRequest): Promise<{ success: boolean; retryAfter?: number }> {
    // Get client identifier
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
    const key = `ratelimit:${ip}`;
    
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const record = this.store.get(key);
    
    if (!record || record.resetTime < now) {
      // New window, reset counter
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return { success: true };
    }
    
    if (record.count >= this.limit) {
      // Rate limited
      return { 
        success: false, 
        retryAfter: Math.floor((record.resetTime - now) / 1000) // in seconds
      };
    }
    
    // Increment counter
    this.store.set(key, { count: record.count + 1, resetTime: record.resetTime });
    return { success: true };
  }
}

// Rate limiter for messages (3 messages per minute)
export const simpleMessagesRateLimiter = new SimpleRateLimiter(3, 60000);

// Function to check rate limit
export async function checkSimpleRateLimit(request: NextRequest, limiter: SimpleRateLimiter = simpleMessagesRateLimiter) {
  return await limiter.check(request);
}