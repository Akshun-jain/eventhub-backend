import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

// ── In-memory rate limiter ──
// In production, replace with Redis-backed limiter or express-rate-limit
// This works perfectly for single-instance deployments

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;   // time window in milliseconds
  maxRequests: number; // max requests per window
  message: string;     // error message when limited
}

function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, RateLimitEntry>();

  // Clean up expired entries every 60 seconds
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, 60 * 1000);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Use IP as identifier
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const entry = store.get(key);

    // No entry yet or window expired — start fresh
    if (!entry || now > entry.resetAt) {
      store.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      next();
      return;
    }

    // Within window — increment
    entry.count += 1;

    // Over limit
    if (entry.count > config.maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

      sendError(res, config.message, 429);
      return;
    }

    // Under limit — set headers and continue
    res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(config.maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    next();
  };
}

// ── Pre-configured limiters ──

// General API: 100 requests per 15 minutes
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests. Please try again later.',
});

// Auth endpoints: 20 requests per 15 minutes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many auth attempts. Please try again later.',
});

// OTP endpoint: 3 requests per 1 minute
export const otpLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 3,
  message: 'Too many OTP requests. Please wait 1 minute.',
});