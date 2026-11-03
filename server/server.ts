/**
 * Server Entry Point
 */

import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[SWEBOK_V4_CORE] Secure Wrist Watch API Server running on http://localhost:${PORT}`);
  console.log(`[SWEBOK_V4_CORE] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SWEBOK_V4_CORE] Security: Helmet, CORS, Integer-cents pricing, PCI tokenized gateway active`);
});
