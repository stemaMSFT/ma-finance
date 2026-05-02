/**
 * ExpenseImportPanel — Upload Rocket Money CSV, preview, and import.
 * Shows import status, monthly breakdown, and category mapping.
 */

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '../../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────

interface Transaction {
  date: string;
  description: string;
  rawCategory: string;
  mappedCategory: string;
  amount: number;
  account: string;
  notes?: string;
  transactionType: 'expense' | 'income' | 'refund' | 'transfer';
}

interface ImportMeta {
  importedAt: string;
  filename: string;
  rowCount: number;
  dateRange: { start: string; end: string };
}

interface ImportSummary {
  totalRows: number;
  expenses: number;
  refunds: number;
  transfers: number;
  income: number;
  skipped: number;
  dateRange: { start: string; end: string };
  totalExpenseAmount: number;
  totalRefundAmount: number;
  categoryTotals: Record<string, number>;
  errors: string[];
}

// ── Colors ────────────────────────────────────────────────────────

const COLORS = {
  accent: '#6c63ff',
  teal: '#14b8a6',
  orange: '#f59e0b',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  bgCard: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  dropBg: '#f8fafc',
  dropBorder: '#cbd5e1',
};

const CATEGORY_COLORS: Record<string, string> = {
  housing: '#3b82f6',
  transportation: '#6366f1',
  utilities: '#8b5cf6',
  groceries: '#14b8a6',
  healthcare: '#ef4444',
  insurance: '#f59e0b',
  dining: '#ec4899',
  subscriptions: '#a855f7',
  shopping: '#f97316',
  entertainment: '#06b6d4',
  personalCare: '#84cc16',
  debt: '#dc2626',
  gifts: '#eab308',
  childcare: '#10b981',
  misc: '#94a3b8',
  __transfer: '#64748b',
};

// ── Styles ────────────────────────────────────────────────────────

const S = {
  card: {
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: '24px 28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 4,
  } as React.CSSProperties,
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    margin: '0 0 16px 0',
  } as React.CSSProperties,
  dropZone: (isDragging: boolean) => ({
    border: `2px dashed ${isDragging ? COLORS.accent : COLORS.dropBorder}`,
    borderRadius: 12,
    padding: '48px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    background: isDragging ? `${COLORS.accent}08` : COLORS.dropBg,
    transition: 'all 0.2s ease',
  }),
  btn: (variant: 'primary' | 'danger' | 'ghost') => ({
    padding: '10px 20px',
    border: variant === 'ghost' ? `1px solid ${COLORS.border}` : 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    color: variant === 'ghost' ? COLORS.textSecondary : '#fff',
    background: variant === 'primary' ? COLORS.accent :
      variant === 'danger' ? COLORS.red : 'transparent',
    transition: 'opacity 0.15s',
  }) as React.CSSProperties,
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    padding: '12px 16px',
    background: COLORS.dropBg,
    borderRadius: 10,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.textPrimary,
  } as React.CSSProperties,
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 12,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted,
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  td: {
    padding: '8px 12px',
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.textPrimary,
  } as React.CSSProperties,
};

// ── Component ─────────────────────────────────────────────────────

export default function ExpenseImportPanel() {
  const [imported, setImported] = useState(false);
  const [meta, setMeta] = useState<ImportMeta | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Preview state
  const [preview, setPreview] = useState<Transaction[] | null>(null);
  const [previewSummary, setPreviewSummary] = useState<ImportSummary | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  // Load existing data
  useEffect(() => {
    fetch('/api/expenses', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setImported(data.imported);
        setMeta(data.meta);
        setTransactions(data.transactions);
      })
      .catch(() => setError('Failed to load expense data'))
      .finally(() => setLoading(false));
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/expenses/import?dryRun=true', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      setPreview(data.preview);
      setPreviewSummary(data.summary);
      setPreviewFile(file);
    } catch {
      setError('Failed to upload file');
    }
    setUploading(false);
  }, []);

  const confirmImport = useCallback(async () => {
    if (!previewFile) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', previewFile);

    try {
      const res = await fetch('/api/expenses/import?dryRun=false', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Import failed');
        setUploading(false);
        return;
      }

      // Reload data
      const loadRes = await fetch('/api/expenses', { credentials: 'include' });
      const loadData = await loadRes.json();
      setImported(loadData.imported);
      setMeta(loadData.meta);
      setTransactions(loadData.transactions);
      setPreview(null);
      setPreviewSummary(null);
      setPreviewFile(null);
    } catch {
      setError('Import failed');
    }
    setUploading(false);
  }, [previewFile]);

  const clearData = useCallback(async () => {
    if (!confirm('This will delete all imported expense data. Continue?')) return;
    await fetch('/api/expenses', { method: 'DELETE', credentials: 'include' });
    setImported(false);
    setMeta(null);
    setTransactions([]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (loading) {
    return <div style={S.card}><p style={{ color: COLORS.textMuted }}>Loading...</p></div>;
  }

  // ── Preview Mode ────────────────────────────────────────────────

  if (preview && previewSummary) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={S.card}>
          <h3 style={S.title}>📋 Import Preview</h3>
          <p style={S.subtitle}>
            Review before importing — {previewFile?.name}
          </p>

          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={S.stat}>
              <span style={S.statValue}>{previewSummary.expenses}</span>
              <span style={S.statLabel}>Expenses</span>
            </div>
            <div style={S.stat}>
              <span style={S.statValue}>{previewSummary.refunds}</span>
              <span style={S.statLabel}>Refunds</span>
            </div>
            <div style={S.stat}>
              <span style={S.statValue}>{previewSummary.transfers}</span>
              <span style={S.statLabel}>Transfers</span>
            </div>
            <div style={S.stat}>
              <span style={S.statValue}>{previewSummary.income}</span>
              <span style={S.statLabel}>Income</span>
            </div>
            <div style={S.stat}>
              <span style={{ ...S.statValue, color: COLORS.red }}>
                {formatCurrency(previewSummary.totalExpenseAmount)}
              </span>
              <span style={S.statLabel}>Total Spending</span>
            </div>
            <div style={S.stat}>
              <span style={{ ...S.statValue, color: COLORS.green }}>
                {formatCurrency(previewSummary.totalRefundAmount)}
              </span>
              <span style={S.statLabel}>Refunds</span>
            </div>
          </div>

          <p style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
            Date range: {previewSummary.dateRange.start} → {previewSummary.dateRange.end}
          </p>

          {previewSummary.errors.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.red, margin: '0 0 4px 0' }}>
                ⚠️ {previewSummary.skipped} rows skipped:
              </p>
              {previewSummary.errors.map((e, i) => (
                <p key={i} style={{ fontSize: 11, color: COLORS.red, margin: 0 }}>{e}</p>
              ))}
            </div>
          )}

          {/* Sample rows */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Description</th>
                  <th style={S.th}>Category</th>
                  <th style={S.th}>Mapped To</th>
                  <th style={S.th}>Amount</th>
                  <th style={S.th}>Type</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 15).map((t, i) => (
                  <tr key={i}>
                    <td style={S.td}>{t.date}</td>
                    <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={S.td}>{t.rawCategory}</td>
                    <td style={S.td}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        background: `${CATEGORY_COLORS[t.mappedCategory] ?? COLORS.textMuted}18`,
                        color: CATEGORY_COLORS[t.mappedCategory] ?? COLORS.textMuted,
                        fontWeight: 600,
                      }}>
                        {t.mappedCategory}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 600, color: t.transactionType === 'expense' ? COLORS.red : COLORS.green }}>
                      {t.transactionType === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                    <td style={S.td}>{t.transactionType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              style={S.btn('primary')}
              onClick={confirmImport}
              disabled={uploading}
            >
              {uploading ? 'Importing...' : `✓ Import ${previewSummary.totalRows} transactions`}
            </button>
            <button
              style={S.btn('ghost')}
              onClick={() => { setPreview(null); setPreviewSummary(null); setPreviewFile(null); }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Imported Data View ──────────────────────────────────────────

  if (imported && transactions.length > 0) {
    const expenses = transactions.filter(t => t.transactionType === 'expense');
    const refunds = transactions.filter(t => t.transactionType === 'refund');

    // Monthly totals
    const monthlyMap = new Map<string, number>();
    for (const t of expenses) {
      const month = t.date.slice(0, 7); // YYYY-MM
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + t.amount);
    }
    for (const t of refunds) {
      const month = t.date.slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) - t.amount);
    }
    const monthlyData = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        total: Math.max(0, total),
      }));

    // Category totals (expenses only)
    const catMap = new Map<string, number>();
    for (const t of expenses) {
      catMap.set(t.mappedCategory, (catMap.get(t.mappedCategory) ?? 0) + t.amount);
    }
    const catData = [...catMap.entries()]
      .filter(([cat]) => cat !== '__transfer')
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([category, total]) => ({ category, total }));

    const totalSpend = expenses.reduce((s, t) => s + t.amount, 0);
    const totalRefunds = refunds.reduce((s, t) => s + t.amount, 0);
    const netSpend = totalSpend - totalRefunds;
    const monthCount = monthlyMap.size || 1;
    const avgMonthly = netSpend / monthCount;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Summary */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={S.title}>📊 Expense History</h3>
              <p style={S.subtitle}>
                Imported from {meta?.filename} • {meta?.dateRange.start} → {meta?.dateRange.end}
              </p>
            </div>
            <button style={S.btn('ghost')} onClick={() => { setImported(false); }}>
              Re-import
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={S.stat}>
              <span style={S.statValue}>{formatCurrency(netSpend, true)}</span>
              <span style={S.statLabel}>Net Spending</span>
            </div>
            <div style={S.stat}>
              <span style={S.statValue}>{formatCurrency(avgMonthly, true)}</span>
              <span style={S.statLabel}>Avg/Month</span>
            </div>
            <div style={S.stat}>
              <span style={S.statValue}>{expenses.length}</span>
              <span style={S.statLabel}>Transactions</span>
            </div>
            <div style={S.stat}>
              <span style={S.statValue}>{monthCount}</span>
              <span style={S.statLabel}>Months</span>
            </div>
          </div>
        </div>

        {/* Monthly chart */}
        <div style={S.card}>
          <h3 style={S.title}>Monthly Spending</h3>
          <p style={S.subtitle}>Net expenses by month (after refunds)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="total" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div style={S.card}>
          <h3 style={S.title}>Top Categories</h3>
          <p style={S.subtitle}>Spending by mapped category</p>
          <ResponsiveContainer width="100%" height={Math.max(200, catData.length * 36)}>
            <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 8, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {catData.map((entry, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? COLORS.textMuted} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Clear data */}
        <div style={{ textAlign: 'right' }}>
          <button style={S.btn('danger')} onClick={clearData}>
            🗑️ Clear Imported Data
          </button>
        </div>
      </div>
    );
  }

  // ── Upload UI ───────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={S.card}>
        <h3 style={S.title}>📤 Import Rocket Money Expenses</h3>
        <p style={S.subtitle}>
          Upload your Rocket Money CSV export to see real spending data. Export from
          Rocket Money → Transactions → Export.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: COLORS.red, margin: 0 }}>❌ {error}</p>
          </div>
        )}

        <div
          style={S.dropZone(isDragging)}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('csv-file-input')?.click()}
        >
          <p style={{ fontSize: 32, margin: '0 0 8px 0' }}>📄</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 4px 0' }}>
            {uploading ? 'Processing...' : 'Drop your CSV file here'}
          </p>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>
            or click to browse • Max 5MB
          </p>
        </div>

        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={onFileSelect}
        />

        <div style={{ marginTop: 20, padding: 16, background: COLORS.dropBg, borderRadius: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, margin: '0 0 8px 0' }}>
            Expected CSV format:
          </p>
          <code style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
            Date, Description, Category, Amount, Account<br />
            2024-04-02, Netflix, Entertainment, -15.99, Chase Checking
          </code>
        </div>
      </div>
    </div>
  );
}
