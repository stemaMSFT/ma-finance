/**
 * Global Express error-handling middleware.
 * Catches thrown errors and returns a consistent JSON response.
 */

import type { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.statusCode ?? 500;
  console.error(`[ERROR] ${status} — ${err.message}`);
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
}

/** Create an error with a status code for use in route handlers. */
export function createHttpError(statusCode: number, message: string): ApiError {
  const err: ApiError = new Error(message);
  err.statusCode = statusCode;
  return err;
}
