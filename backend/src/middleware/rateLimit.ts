import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

let upstashAvailable = false;
const env: any = process.env as any;
const UP_URL = env['UPSTASH_REDIS_REST_URL'];
const UP_TOKEN = env['UPSTASH_REDIS_REST_TOKEN'];

let upstashRateLimiter:
  | ((
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<void | Response<any, Record<string, any>>>)
  | null = null;

if (UP_URL && UP_TOKEN) {
  try {
    // Lazy import to avoid adding types if not present in env
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('@upstash/redis');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Ratelimit } = require('@upstash/ratelimit');
    const redis = new Redis({ url: UP_URL, token: UP_TOKEN });
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
    });
    upstashRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
      const identifier = (req as any).user?.id || req.ip || 'anonymous';
      const { success, limit, reset, remaining } = await limiter.limit(identifier);
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', reset);
      if (!success) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
      }
      return next();
    };
    upstashAvailable = true;
  } catch {
    upstashAvailable = false;
  }
}

const localLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (upstashAvailable && upstashRateLimiter) {
    return (upstashRateLimiter as any)(req, res, next);
  }
  return (localLimiter as any)(req, res, next);
};
