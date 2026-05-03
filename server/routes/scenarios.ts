/**
 * CRUD routes for saved financial scenarios.
 * Persisted to a local JSON file via the store module.
 */

import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { loadScenarios, saveScenario, deleteScenario } from '../db/store.ts';
import { createHttpError } from '../middleware/errorHandler.ts';
import type { SavedScenario } from '../db/store.ts';

const router = Router();

const VALID_TYPES = new Set(['compensation', 'retirement', 'housing', 'renovation']);

/** GET /api/scenarios — list all saved scenarios */
router.get('/', async (_req, res, next) => {
  try {
    const scenarios = await loadScenarios();
    res.json(scenarios);
  } catch (err) {
    next(err);
  }
});

/** GET /api/scenarios/:id — get a single scenario */
router.get('/:id', async (req, res, next) => {
  try {
    const scenarios = await loadScenarios();
    const found = scenarios.find((s) => s.id === req.params.id);
    if (!found) throw createHttpError(404, `Scenario ${req.params.id} not found`);
    res.json(found);
  } catch (err) {
    next(err);
  }
});

/** POST /api/scenarios — create a new scenario */
router.post('/', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    const { name, type, inputs, results } = req.body as Partial<SavedScenario>;
    if (!name || typeof name !== 'string') throw createHttpError(400, 'name is required');
    if (!type || !VALID_TYPES.has(type)) throw createHttpError(400, `type must be one of: ${[...VALID_TYPES].join(', ')}`);
    if (!inputs || typeof inputs !== 'object') throw createHttpError(400, 'inputs object is required');

    const now = new Date().toISOString();
    const scenario: SavedScenario = {
      id: randomUUID(),
      name,
      type,
      inputs,
      results: results as Record<string, unknown> | undefined,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await saveScenario(scenario);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

/** PUT /api/scenarios/:id — update an existing scenario */
router.put('/:id', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    const scenarios = await loadScenarios();
    const existing = scenarios.find((s) => s.id === req.params.id);
    if (!existing) throw createHttpError(404, `Scenario ${req.params.id} not found`);

    const { name, type, inputs, results } = req.body as Partial<SavedScenario>;
    const updated: SavedScenario = {
      ...existing,
      name: name ?? existing.name,
      type: type && VALID_TYPES.has(type) ? type : existing.type,
      inputs: inputs ?? existing.inputs,
      results: results !== undefined ? (results as Record<string, unknown> | undefined) : existing.results,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveScenario(updated);
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/scenarios/:id — remove a scenario */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteScenario(req.params.id!);
    if (!deleted) throw createHttpError(404, `Scenario ${req.params.id} not found`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
