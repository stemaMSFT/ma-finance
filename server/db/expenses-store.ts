/**
 * Expense transaction persistence.
 * Stores imported Rocket Money transactions as JSON on disk.
 * Atomic writes to prevent corruption on interrupted saves.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');

// ── Types ─────────────────────────────────────────────────────────

export type TransactionType = 'expense' | 'income' | 'refund' | 'transfer';

export interface ExpenseTransaction {
  date: string;           // ISO date (YYYY-MM-DD)
  description: string;
  rawCategory: string;    // Original Rocket Money category
  mappedCategory: string; // Mapped to app's budget categories
  amount: number;         // Always stored as positive for expenses, negative for income/refunds
  account: string;
  notes?: string;
  transactionType: TransactionType;
}

export interface ExpenseImportMeta {
  importedAt: string;
  filename: string;
  rowCount: number;
  dateRange: { start: string; end: string };
  fileHash: string;
}

export interface ExpenseData {
  meta: ExpenseImportMeta;
  transactions: ExpenseTransaction[];
}

// ── Storage ───────────────────────────────────────────────────────

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/** Load stored expenses (returns null if none imported yet). */
export async function loadExpenses(): Promise<ExpenseData | null> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(EXPENSES_FILE, 'utf-8');
    return JSON.parse(raw) as ExpenseData;
  } catch {
    return null;
  }
}

/** Atomically save expense data to disk. */
export async function saveExpenses(data: ExpenseData): Promise<void> {
  await ensureDataDir();
  const tmpFile = EXPENSES_FILE + '.tmp';
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpFile, EXPENSES_FILE);
}

/** Clear all stored expenses. */
export async function clearExpenses(): Promise<void> {
  await ensureDataDir();
  try {
    await fs.unlink(EXPENSES_FILE);
  } catch {
    // File didn't exist — fine
  }
}
