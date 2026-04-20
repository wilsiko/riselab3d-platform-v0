import { Request, Response, NextFunction } from 'express';

// Store request counts in memory (em produção, usar Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100; // 100 requests por minuto por IP/tenant

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = `${req.ip}-${req.tenantId}`;
  const now = Date.now();

  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    // Nova janela de tempo
    requestCounts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    res.set('Retry-After', String(Math.ceil((record.resetTime - now) / 1000)));
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  next();
}
