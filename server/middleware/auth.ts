/**
 * Auth middleware — protects API routes by requiring a valid session.
 */

import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}
