/**
 * Simple JSON-file persistence for saved scenarios.
 * Reads/writes to server/db/data/scenarios.json.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'scenarios.json');

export interface SavedScenario {
  id: string;
  name: string;
  type: 'compensation' | 'retirement' | 'housing' | 'renovation';
  inputs: Record<string, unknown>;
  results?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Ensure data directory and file exist. */
async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
  }
}

/** Load all saved scenarios from disk. */
export async function loadScenarios(): Promise<SavedScenario[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as SavedScenario[];
}

/** Save the full scenario list to disk. */
async function writeToDisk(scenarios: SavedScenario[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(scenarios, null, 2), 'utf-8');
}

/** Add or update a scenario. Returns the saved scenario. */
export async function saveScenario(scenario: SavedScenario): Promise<SavedScenario> {
  const scenarios = await loadScenarios();
  const idx = scenarios.findIndex((s) => s.id === scenario.id);
  if (idx >= 0) {
    scenarios[idx] = { ...scenario, updatedAt: new Date().toISOString() };
  } else {
    scenarios.push(scenario);
  }
  await writeToDisk(scenarios);
  return idx >= 0 ? scenarios[idx]! : scenario;
}

/** Delete a scenario by ID. Returns true if found and deleted. */
export async function deleteScenario(id: string): Promise<boolean> {
  const scenarios = await loadScenarios();
  const filtered = scenarios.filter((s) => s.id !== id);
  if (filtered.length === scenarios.length) return false;
  await writeToDisk(filtered);
  return true;
}
