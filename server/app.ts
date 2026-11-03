/**
 * IEEE SWEBOK v4 - Express Application Architecture
 * High Cohesion, Separation of Concerns & Defense in Depth.
 */

import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { configureSecurityHeaders, configureCors } from './middleware/securityHeaders.js';
import { errorHandler } from './middleware/errorHandler.js';

import catalogRoutes from './routes/catalogRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

export function createApp(): Express {
  const app = express();

  // Defense in Depth Security Middlewares
  app.use(configureSecurityHeaders());
  app.use(configureCors());
  app.use(express.json({ limit: '100kb' })); // Mitigate Denial-of-Service via payload flooding
  app.use(cookieParser());

  // Request Auditing & Telemetry
  app.use((req, _res, next) => {
    // SWEBOK v4 Ch. 13: Sanitize logged data, do not log tokens or secrets
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedUrl = req.originalUrl.split('?')[0];
      console.log(`[ACCESS_LOG] ${new Date().toISOString()} ${req.method} ${sanitizedUrl}`);
    }
    next();
  });

  // API Routing Modular Architecture
  app.use('/api/health', healthRoutes);
  app.use('/api/catalog', catalogRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);

  // Catch-all 404 handler for API routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: 'The requested API route does not exist.',
      },
    });
  });

  // Serve production client build if present
  const clientDist = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res, next) => {
      const indexPath = path.join(clientDist, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    });
  }

  // Central Exception & Error Handler (Defensive Construction)
  app.use(errorHandler);

  return app;
}
