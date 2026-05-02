/**
 * Express backend for the ma-finance scenario planner.
 * Serves the API and (in production) the built React frontend.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import scenarioRoutes from './routes/scenarios.ts';
import calculationRoutes from './routes/calculations.ts';
import expenseRoutes from './routes/expenses.ts';
import authRoutes from './routes/auth.ts';
import { requireAuth } from './middleware/auth.ts';
import { errorHandler } from './middleware/errorHandler.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === 'production';

// ── Trust proxy (needed for secure cookies behind Render/etc.) ────
if (isProd) app.set('trust proxy', 1);

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: isProd ? true : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieSession({
  name: 'ma-finance-session',
  secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'lax' : 'lax',
}));

// ── Auth routes (public) ──────────────────────────────────────────
app.use('/auth', authRoutes);

// Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Protected API routes ──────────────────────────────────────────
app.use('/api/scenarios', requireAuth, scenarioRoutes);
app.use('/api/calculate', requireAuth, calculationRoutes);
app.use('/api/expenses', requireAuth, expenseRoutes);

// ── Serve frontend in production ──────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[ma-finance] Server running on http://localhost:${PORT}${isProd ? ' (production)' : ''}`);
});
