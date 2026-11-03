/**
 * IEEE SWEBOK v4 Chapter 04 (Defensive Construction)
 * Standardized Exception Handling: Prevents stack trace disclosure to clients.
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Safe internal server logging (without credentials or raw tokens)
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = err?.message || 'An unexpected internal error occurred';
  const statusCode = err?.statusCode || (err?.status && typeof err.status === 'number' ? err.status : 500);

  if (statusCode >= 500) {
    console.error(`[CRITICAL_SYSTEM_ERROR] ${new Date().toISOString()}: ${errorMessage}`);
    if (!isProduction && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err?.code || 'INTERNAL_SERVER_ERROR',
      message: isProduction && statusCode === 500 ? 'Internal server error occurred' : errorMessage,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}
