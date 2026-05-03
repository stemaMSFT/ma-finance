/**
 * API routes that run the financial engine server-side.
 * Imports pure-TS engine functions from src/engine/.
 */

import { Router } from 'express';
import { createHttpError } from '../middleware/errorHandler.ts';

// Engine imports — pure TypeScript, no React deps
import { projectRetirement } from '../../src/engine/retirement.ts';
import { calculateAffordability, compareRenovationVsSave } from '../../src/engine/housing.ts';
import { calculateNetWorthProjection } from '../../src/engine/projections.ts';
import type { RetirementInput, HousingInput, RenovationInput, UserProfile } from '../../src/engine/types.ts';
import type { NetWorthInput } from '../../src/engine/projections.ts';

const router = Router();

/**
 * POST /api/calculate/retirement
 * Accepts RetirementInput + UserProfile fields, returns ScenarioResult.
 */
router.post('/retirement', (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    const { profile, retirement } = req.body as {
      profile: UserProfile;
      retirement: RetirementInput;
    };
    if (!profile || !retirement) {
      throw createHttpError(400, 'Both "profile" and "retirement" fields are required');
    }
    const result = projectRetirement(profile, retirement);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/calculate/housing
 * Accepts UserProfile + HousingInput, returns affordability ScenarioResult.
 */
router.post('/housing', (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    const { profile, housing } = req.body as {
      profile: UserProfile;
      housing: HousingInput;
    };
    if (!profile || !housing) {
      throw createHttpError(400, 'Both "profile" and "housing" fields are required');
    }
    const result = calculateAffordability(profile, housing);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/calculate/renovation
 * Accepts RenovationInput, returns renovation-vs-save ScenarioResult.
 */
router.post('/renovation', (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    const { renovation } = req.body as { renovation: RenovationInput };
    if (!renovation) {
      throw createHttpError(400, '"renovation" field is required');
    }
    const result = compareRenovationVsSave(renovation, renovation.alternativeSavingsReturn);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/calculate/net-worth
 * Accepts NetWorthInput, returns year-by-year net worth projection.
 */
router.post('/net-worth', (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    const input = req.body as NetWorthInput;
    if (input.currentAge == null || input.years == null) {
      throw createHttpError(400, '"currentAge" and "years" are required');
    }
    const result = calculateNetWorthProjection(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
