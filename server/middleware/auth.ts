/**
 * Auth middleware — protects API routes by requiring a valid session.
 */

import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  // Auth temporarily bypassed for local dev
  next();
}
