/**
 * Expense import routes.
 * Handles Rocket Money CSV upload, parsing, and retrieval.
 */

import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import crypto from 'node:crypto';
import {
  loadExpenses,
  saveExpenses,
  clearExpenses,
  type ExpenseTransaction,
  type ExpenseData,
  type TransactionType,
} from '../db/expenses-store.ts';

const router = Router();

// 5MB file limit, memory storage (small files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'));
    }
  },
});

// ── Category Mapping ──────────────────────────────────────────────
// Maps actual Rocket Money categories to the app's 15 budget categories.

const CATEGORY_MAP: Record<string, string> = {
  // Essential
  'groceries': 'groceries',
  'auto & transport': 'transportation',
  'bills & utilities': 'utilities',
  'home & garden': 'housing',
  'medical': 'healthcare',
  'health & wellness': 'healthcare',
  'insurance': 'insurance',

  // Lifestyle
  'dining & drinks': 'dining',
  'shopping': 'shopping',
  'entertainment & rec.': 'entertainment',
  'travel & vacation': 'entertainment',
  'software & tech': 'subscriptions',
  'personal care': 'personalCare',
  'pets': 'misc',
  'trading cards': 'entertainment',

  // Obligations
  'loan payment': 'debt',
  'fees': 'debt',
  'taxes': 'misc',
  'legal': 'misc',
  'charitable donations': 'gifts',
  'gifts': 'gifts',
  'education': 'childcare',
  'family care': 'childcare',

  // Excluded from spending
  'credit card payment': '__transfer',
  'internal transfers': '__transfer',
  'savings transfer': '__transfer',
  'income': '__income',
  'investment': '__transfer',
  'cash & checks': '__transfer',
  'ignore': '__transfer',
  'business': '__transfer',
};

// ── Description-Based Overrides ───────────────────────────────────
// Matches against transaction Name/Description to fix miscategorized items.
// Checked BEFORE the Rocket Money category — description is more reliable.
// Each rule: [pattern (regex or string), overrideCategory]

const DESCRIPTION_OVERRIDES: Array<[RegExp, string]> = [
  // Housing: mortgage, rent, HOA, property tax
  [/mortgage/i, 'housing'],
  [/\bpennymac\b/i, 'housing'],
  [/\brent\b/i, 'housing'],
  [/\bhoa\b/i, 'housing'],
  [/property.?tax/i, 'housing'],

  // Insurance: carriers
  [/\bgeico\b/i, 'insurance'],
  [/\bprogressive\b/i, 'insurance'],
  [/\bstate\s*farm\b/i, 'insurance'],
  [/\ballstate\b/i, 'insurance'],
  [/\busaa\b/i, 'insurance'],

  // Auto loans
  [/wells\s*fargo\s*auto/i, 'transportation'],

  // Subscriptions: streaming, software
  [/\bspotify\b/i, 'subscriptions'],
  [/\bnetflix\b/i, 'subscriptions'],
  [/\bhulu\b/i, 'subscriptions'],
  [/\bdisney\+?\b/i, 'subscriptions'],
  [/\byoutube\s*(premium|music)/i, 'subscriptions'],
  [/\bapple\s*(music|tv|one|arcade)/i, 'subscriptions'],
  [/\badobe\b/i, 'subscriptions'],
  [/\bicloud\b/i, 'subscriptions'],
  [/\bchatgpt\b|openai/i, 'subscriptions'],

  // Venmo/Zelle: treat as real expense (misc) when Rocket Money tags as transfer
  [/\bvenmo\b/i, '__venmo'],
  [/\bzelle\b/i, '__venmo'],
  [/\bcashapp\b|cash\s*app/i, '__venmo'],
];

function descriptionOverride(description: string): string | null {
  for (const [pattern, category] of DESCRIPTION_OVERRIDES) {
    if (pattern.test(description)) return category;
  }
  return null;
}

function mapCategory(raw: string, description?: string): string {
  // Check description overrides first — more reliable than Rocket Money categories
  if (description) {
    const override = descriptionOverride(description);
    if (override === '__venmo') return 'misc'; // Venmo/Zelle → misc (can't determine true category)
    if (override) return override;
  }

  const normalized = raw.trim().toLowerCase();
  // Direct match
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];
  // Partial match fallback
  for (const [key, mapped] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return mapped;
  }
  return 'misc';
}

function classifyTransaction(amount: number, rawCategory: string, description?: string): TransactionType {
  // Check if description override rescues a transfer (e.g., Venmo tagged as Internal Transfer)
  if (description) {
    const override = descriptionOverride(description);
    if (override === '__venmo') {
      // Venmo/Zelle: positive = you paid someone (expense), negative = someone paid you back (refund)
      // Both land in 'misc' since we don't know the true category — refunds offset spending
      if (amount < 0) return 'refund';
      return 'expense';
    }
    // If description override points to a real category, treat as expense even if
    // Rocket Money category would make it a transfer (e.g., mortgage as "Loan Payment")
    if (override && override !== '__transfer' && override !== '__income') {
      if (amount < 0) return 'refund';
      return 'expense';
    }
  }

  const mapped = mapCategory(rawCategory, description);

  // Transfers and internal moves
  if (mapped === '__transfer') return 'transfer';
  // Income
  if (mapped === '__income') return 'income';

  // Rocket Money: positive = expense, negative = credit/refund/income
  if (amount < 0) return 'refund';
  return 'expense';
}

// ── Parse CSV ─────────────────────────────────────────────────────

interface ParseResult {
  transactions: ExpenseTransaction[];
  errors: string[];
  skipped: number;
}

function parseCSV(buffer: Buffer, _filename: string): ParseResult {
  // Strip BOM if present
  let content = buffer.toString('utf-8');
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  const transactions: ExpenseTransaction[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2; // +2 for 1-indexed + header row

    // Find columns — supports actual Rocket Money format and generic CSV
    const date = row['Date'] ?? row['date'] ?? row['DATE'];
    const desc = row['Custom Name'] || row['Name'] || row['Description'] || row['description'] || row['Merchant'] || '';
    const category = row['Category'] ?? row['category'] ?? '';
    const amountStr = row['Amount'] ?? row['amount'] ?? '';
    const account = row['Account Name'] || row['Account'] || row['account'] || '';
    const institution = row['Institution Name'] || '';
    const notes = row['Note'] || row['Notes'] || row['notes'] || '';
    const accountLabel = institution ? `${institution} – ${account}` : account;

    // Validate required fields
    if (!date || !amountStr) {
      errors.push(`Row ${rowNum}: missing date or amount`);
      skipped++;
      continue;
    }

    // Parse amount
    const amount = parseFloat(amountStr.replace(/[,$]/g, ''));
    if (isNaN(amount)) {
      errors.push(`Row ${rowNum}: invalid amount "${amountStr}"`);
      skipped++;
      continue;
    }

    // Parse date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`Row ${rowNum}: invalid date "${date}"`);
      skipped++;
      continue;
    }

    const isoDate = parsedDate.toISOString().split('T')[0];
    const transactionType = classifyTransaction(amount, category, desc);
    const mappedCategory = mapCategory(category, desc);

    transactions.push({
      date: isoDate,
      description: desc || 'Unknown',
      rawCategory: category || 'Uncategorized',
      mappedCategory,
      amount: Math.abs(amount),
      account: accountLabel || 'Unknown',
      notes: notes || undefined,
      transactionType,
    });
  }

  return { transactions, errors, skipped };
}

// ── Routes ────────────────────────────────────────────────────────

/** POST /api/expenses/import?dryRun=true|false — parse and optionally save */
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No CSV file provided' });
    return;
  }

  const dryRun = req.query.dryRun === 'true';
  const { transactions, errors, skipped } = parseCSV(req.file.buffer, req.file.originalname);

  if (transactions.length === 0) {
    res.status(400).json({
      error: 'No valid transactions found in CSV',
      errors: errors.slice(0, 10),
    });
    return;
  }

  // Compute summary
  const dates = transactions.map(t => t.date).sort();
  const dateRange = { start: dates[0], end: dates[dates.length - 1] };
  const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex').slice(0, 16);

  const expenses = transactions.filter(t => t.transactionType === 'expense');
  const refunds = transactions.filter(t => t.transactionType === 'refund');
  const transfers = transactions.filter(t => t.transactionType === 'transfer');

  // Category breakdown (expenses only)
  const categoryTotals: Record<string, number> = {};
  for (const t of expenses) {
    categoryTotals[t.mappedCategory] = (categoryTotals[t.mappedCategory] ?? 0) + t.amount;
  }

  const summary = {
    totalRows: transactions.length,
    expenses: expenses.length,
    refunds: refunds.length,
    transfers: transfers.length,
    income: transactions.filter(t => t.transactionType === 'income').length,
    skipped,
    dateRange,
    totalExpenseAmount: expenses.reduce((sum, t) => sum + t.amount, 0),
    totalRefundAmount: refunds.reduce((sum, t) => sum + t.amount, 0),
    categoryTotals,
    errors: errors.slice(0, 10),
  };

  if (dryRun) {
    res.json({ dryRun: true, summary, preview: transactions.slice(0, 20) });
    return;
  }

  // Save
  const data: ExpenseData = {
    meta: {
      importedAt: new Date().toISOString(),
      filename: req.file.originalname,
      rowCount: transactions.length,
      dateRange,
      fileHash,
    },
    transactions,
  };

  await saveExpenses(data);
  res.json({ dryRun: false, summary });
});

/** GET /api/expenses — retrieve stored transactions */
router.get('/', async (_req, res) => {
  const data = await loadExpenses();
  if (!data) {
    res.json({ imported: false, meta: null, transactions: [] });
    return;
  }
  res.json({ imported: true, meta: data.meta, transactions: data.transactions });
});

/** DELETE /api/expenses — clear all stored expense data */
router.delete('/', async (_req, res) => {
  await clearExpenses();
  res.json({ ok: true });
});

export default router;
