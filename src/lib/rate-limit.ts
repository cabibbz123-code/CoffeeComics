// Rate limiter using Vercel KV (Redis-compatible)
// Falls back to in-memory for local development

import { kv } from '@vercel/kv';

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Check if Vercel KV is configured
const isKVConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Fallback in-memory store for local development
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for an identifier (e.g., IP address)
 * Uses Vercel KV in production, falls back to in-memory for local dev
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowSeconds = Math.ceil(config.windowMs / 1000);
  const key = `ratelimit:${identifier}`;

  // Use Vercel KV if configured
  if (isKVConfigured) {
    return checkRateLimitKV(key, config, now, windowSeconds);
  }

  // Fallback to in-memory for local development
  return checkRateLimitMemory(key, config, now);
}

/**
 * Rate limiting with Vercel KV (production)
 */
async function checkRateLimitKV(
  key: string,
  config: RateLimitConfig,
  now: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    // Get current count and TTL
    const [count, ttl] = await Promise.all([
      kv.get<number>(key),
      kv.ttl(key)
    ]);

    // Calculate reset time based on TTL (-2 means key doesn't exist, -1 means no TTL)
    const resetTime = ttl > 0 
      ? now + (ttl * 1000) 
      : now + config.windowMs;

    // Key doesn't exist - create it
    if (count === null) {
      await kv.set(key, 1, { ex: windowSeconds });
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    // Check if limit exceeded
    if (count >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    // Increment counter (INCR is atomic)
    const newCount = await kv.incr(key);
    
    return {
      success: true,
      remaining: Math.max(0, config.maxRequests - newCount),
      resetTime,
    };
  } catch (error) {
    // If KV fails, allow the request (fail open) but log it
    console.error('Rate limit KV error:', error);
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }
}

/**
 * Rate limiting with in-memory store (local development)
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig,
  now: number
): RateLimitResult {
  let entry = memoryStore.get(key);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of memoryStore.entries()) {
      if (now > v.resetTime) memoryStore.delete(k);
    }
  }

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    memoryStore.set(key, entry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment counter
  entry.count++;
  memoryStore.set(key, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request headers
 * Vercel provides x-forwarded-for, we take the first (client) IP
 */
export function getClientIP(request: Request): string {
  // Vercel-specific header (most reliable on Vercel)
  const vercelIP = request.headers.get('x-real-ip');
  if (vercelIP) {
    return vercelIP;
  }

  // Standard forwarded header
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP (original client), ignore proxies
    return forwarded.split(',')[0].trim();
  }

  // Fallback
  return 'unknown';
}

// Pre-configured rate limiters for different endpoints
export const RATE_LIMITS = {
  // Checkout: 10 requests per minute (prevents spam orders)
  checkout: { windowMs: 60 * 1000, maxRequests: 10 },

  // Order creation: 5 orders per minute
  orders: { windowMs: 60 * 1000, maxRequests: 5 },

  // Webhook: 100 requests per minute (Stripe can be bursty)
  webhook: { windowMs: 60 * 1000, maxRequests: 100 },

  // General API: 60 requests per minute
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  
  // Strict limit for sensitive operations: 3 per minute
  strict: { windowMs: 60 * 1000, maxRequests: 3 },
};

/**
 * Helper to create a rate limit response
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
      },
    }
  );
}