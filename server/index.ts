/**
 * Express backend for the ma-finance scenario planner.
 * Runs on port 3001 alongside the Vite dev server (5173).
 */

import express from 'express';
import cors from 'cors';
import scenarioRoutes from './routes/scenarios.ts';
import calculationRoutes from './routes/calculations.ts';
import { errorHandler } from './middleware/errorHandler.ts';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/calculate', calculationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[ma-finance] Server running on http://localhost:${PORT}`);
});
