import type { Request, Response, NextFunction } from 'express';

/**
 * Auth middleware — enforces session authentication.
 * Set AUTH_BYPASS=true in .env for local development without login.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (process.env.AUTH_BYPASS === 'true') {
    return next();
  }
  if (req.session?.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}
