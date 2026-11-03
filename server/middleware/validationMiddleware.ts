/**
 * IEEE SWEBOK v4 Chapter 13 (Software Security) & Chapter 04 (Defensive Construction)
 * Zod-Powered Strict Input Validation Middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed. Please review the provided fields.',
            details: err.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          },
        });
        return;
      }
      next(err);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            message: 'Invalid query parameters.',
            details: err.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          },
        });
        return;
      }
      next(err);
    }
  };
}
