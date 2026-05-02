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

const CATEGORY_MAP: Record<string, string> = {
  // Essential
  'rent': 'housing',
  'mortgage': 'housing',
  'housing': 'housing',
  'home': 'housing',
  'transportation': 'transportation',
  'gas': 'transportation',
  'auto': 'transportation',
  'car': 'transportation',
  'parking': 'transportation',
  'ride share': 'transportation',
  'uber': 'transportation',
  'lyft': 'transportation',
  'utilities': 'utilities',
  'electric': 'utilities',
  'internet': 'utilities',
  'phone': 'utilities',
  'water': 'utilities',
  'groceries': 'groceries',
  'grocery': 'groceries',
  'healthcare': 'healthcare',
  'health': 'healthcare',
  'medical': 'healthcare',
  'pharmacy': 'healthcare',
  'doctor': 'healthcare',
  'dental': 'healthcare',
  'insurance': 'insurance',

  // Lifestyle
  'restaurants': 'dining',
  'restaurant': 'dining',
  'dining': 'dining',
  'food & drink': 'dining',
  'food': 'dining',
  'coffee': 'dining',
  'fast food': 'dining',
  'subscriptions': 'subscriptions',
  'subscription': 'subscriptions',
  'streaming': 'subscriptions',
  'software': 'subscriptions',
  'gym': 'subscriptions',
  'membership': 'subscriptions',
  'shopping': 'shopping',
  'clothing': 'shopping',
  'electronics': 'shopping',
  'amazon': 'shopping',
  'entertainment': 'entertainment',
  'travel': 'entertainment',
  'vacation': 'entertainment',
  'hobbies': 'entertainment',
  'personal care': 'personalCare',
  'personal': 'personalCare',
  'beauty': 'personalCare',
  'hair': 'personalCare',

  // Obligations
  'debt': 'debt',
  'loan': 'debt',
  'student loan': 'debt',
  'credit card payment': 'debt',
  'gifts': 'gifts',
  'donation': 'gifts',
  'charitable': 'gifts',
  'charity': 'gifts',

  // Future
  'childcare': 'childcare',
  'education': 'childcare',
  'tuition': 'childcare',

  // Transfers / excluded
  'transfer': '__transfer',
  'credit card': '__transfer',
  'payment': '__transfer',
  'internal transfer': '__transfer',
};

function mapCategory(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  // Direct match
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];
  // Partial match
  for (const [key, mapped] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key)) return mapped;
  }
  return 'misc';
}

function classifyTransaction(amount: number, rawCategory: string): TransactionType {
  const norm = rawCategory.trim().toLowerCase();
  if (norm.includes('transfer') || norm.includes('payment') || norm === 'credit card') {
    return 'transfer';
  }
  if (amount > 0) {
    // Positive in Rocket Money = income or refund
    if (norm.includes('refund') || norm.includes('return') || norm.includes('reimbursement')) {
      return 'refund';
    }
    return 'income';
  }
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

    // Find columns (case-insensitive)
    const date = row['Date'] ?? row['date'] ?? row['DATE'];
    const desc = row['Description'] ?? row['description'] ?? row['Merchant'] ?? row['merchant'] ?? row['Original Description'] ?? '';
    const category = row['Category'] ?? row['category'] ?? '';
    const amountStr = row['Amount'] ?? row['amount'] ?? '';
    const account = row['Account'] ?? row['account'] ?? row['Account Name'] ?? '';
    const notes = row['Notes'] ?? row['notes'] ?? '';

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
    const transactionType = classifyTransaction(amount, category);
    const mappedCategory = mapCategory(category);

    transactions.push({
      date: isoDate,
      description: desc || 'Unknown',
      rawCategory: category || 'Uncategorized',
      mappedCategory,
      amount: Math.abs(amount), // Store as positive, type indicates direction
      account: account || 'Unknown',
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
