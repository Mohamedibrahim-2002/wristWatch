/**
 * IEEE SWEBOK v4 Chapter 13 (Software Security)
 * RBAC (Role-Based Access Control) & Default Deny Middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/authService.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Extracts and verifies token if present (does not block unauthenticated access).
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.wrist_auth_token;

  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (token) {
    try {
      req.user = authService.verifyToken(token);
    } catch {
      // Invalid token, continue unauthenticated
    }
  }

  next();
}

/**
 * Enforces authenticated session.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required to access this resource.',
        },
      });
      return;
    }
    next();
  });
}

/**
 * Enforces admin role under Principle of Least Privilege.
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: Administrative privileges required.',
        },
      });
      return;
    }
    next();
  });
}

