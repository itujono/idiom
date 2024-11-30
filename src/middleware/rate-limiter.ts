import type { MiddlewareHandler } from "hono";
import { appLogger as logger } from "../services/logger";

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

// Simple in-memory store for rate limiting
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.store = new Map();
  }

  increment(
    key: string,
    windowMs: number
  ): { count: number; resetTime: number } {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      const newRecord = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, newRecord);
      return newRecord;
    }

    record.count++;
    return record;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

// Clean up every hour
setInterval(() => store.cleanup(), 60 * 60 * 1000);

export const rateLimiter = (options: RateLimitOptions): MiddlewareHandler => {
  return async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || "unknown";
    const key = `${ip}:${c.req.path}`;

    const { count, resetTime } = store.increment(key, options.windowMs);

    // Set rate limit headers
    c.header("X-RateLimit-Limit", options.max.toString());
    c.header(
      "X-RateLimit-Remaining",
      Math.max(0, options.max - count).toString()
    );
    c.header("X-RateLimit-Reset", resetTime.toString());

    if (count > options.max) {
      logger.warn({ ip, path: c.req.path, count }, "Rate limit exceeded");
      return c.json(
        {
          error: "Too many requests",
          message: `Please try again after ${new Date(
            resetTime
          ).toLocaleTimeString()}`,
        },
        429
      );
    }

    await next();
  };
};
