/**
 * ExpenseImportPanel — Upload Rocket Money CSV, preview, and import.
 * Shows import status, spending trends, and category mapping.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import { COLORS as SHARED_COLORS, S as SHARED_S } from '../../theme';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────

export interface Transaction {
  date: string;
  description: string;
  rawCategory: string;
  mappedCategory: string;
  amount: number;
  account: string;
  notes?: string;
  transactionType: 'expense' | 'income' | 'refund' | 'transfer';
}

export interface ImportMeta {
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

export interface ExpenseImportPanelProps {
  transactions?: Transaction[];
  meta?: ImportMeta | null;
  onDataChange?: (data: { imported: boolean; meta: ImportMeta | null; transactions: Transaction[] }) => void;
}

// ── Colors ────────────────────────────────────────────────────────

const COLORS = {
  ...SHARED_COLORS,
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
  card: SHARED_S.card,
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

export default function ExpenseImportPanel({ transactions: propTransactions, meta: propMeta, onDataChange }: ExpenseImportPanelProps) {
  const [imported, setImported] = useState(false);
  const [meta, setMeta] = useState<ImportMeta | null>(propMeta ?? null);
  const [transactions, setTransactions] = useState<Transaction[]>(propTransactions ?? []);
  const [loading, setLoading] = useState(!propTransactions);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importCollapsed, setImportCollapsed] = useState(true);

  // Preview state
  const [preview, setPreview] = useState<Transaction[] | null>(null);
  const [previewSummary, setPreviewSummary] = useState<ImportSummary | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  // Sync from props
  useEffect(() => {
    if (propTransactions) {
      setTransactions(propTransactions);
      setImported(propTransactions.length > 0);
      setLoading(false);
    }
    if (propMeta) setMeta(propMeta);
  }, [propTransactions, propMeta]);

  // Load existing data only if not provided via props
  useEffect(() => {
    if (propTransactions) return;
    fetch('/api/expenses', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setImported(data.imported);
        setMeta(data.meta);
        setTransactions(data.transactions);
        onDataChange?.({ imported: data.imported, meta: data.meta, transactions: data.transactions });
      })
      .catch(() => setError('Failed to load expense data'))
      .finally(() => setLoading(false));
  }, [propTransactions, onDataChange]);

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
      onDataChange?.({ imported: loadData.imported, meta: loadData.meta, transactions: loadData.transactions });
    } catch {
      setError('Import failed');
    }
    setUploading(false);
  }, [previewFile, onDataChange]);

  const clearData = useCallback(async () => {
    if (!confirm('This will delete all imported expense data. Continue?')) return;
    await fetch('/api/expenses', { method: 'DELETE', credentials: 'include' });
    setImported(false);
    setMeta(null);
    setTransactions([]);
    onDataChange?.({ imported: false, meta: null, transactions: [] });
  }, [onDataChange]);

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

  // ── Imported Data View → Spending Trends ─────────────────────────

  // Compute spending analytics
  const analytics = useMemo(() => {
    if (!imported || transactions.length === 0) return null;
    const expenseTxns = transactions.filter(t => t.transactionType === 'expense');
    const refundTxns = transactions.filter(t => t.transactionType === 'refund');

    // Monthly totals
    const monthlyMap = new Map<string, number>();
    for (const t of expenseTxns) {
      const month = t.date.slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + t.amount);
    }
    for (const t of refundTxns) {
      const month = t.date.slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) - t.amount);
    }
    const monthlyData = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month,
        label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        total: Math.max(0, total),
      }));

    // Category totals & monthly averages
    const catExpenseMap = new Map<string, number>();
    const catRefundMap = new Map<string, number>();
    for (const t of expenseTxns) {
      if (t.mappedCategory === '__transfer') continue;
      catExpenseMap.set(t.mappedCategory, (catExpenseMap.get(t.mappedCategory) ?? 0) + t.amount);
    }
    for (const t of refundTxns) {
      if (t.mappedCategory === '__transfer') continue;
      catRefundMap.set(t.mappedCategory, (catRefundMap.get(t.mappedCategory) ?? 0) + t.amount);
    }
    const monthCount = monthlyMap.size || 1;
    const catData = [...catExpenseMap.entries()]
      .map(([category, total]) => ({
        category,
        total: total - (catRefundMap.get(category) ?? 0),
        monthlyAvg: (total - (catRefundMap.get(category) ?? 0)) / monthCount,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Summary stats
    const totalSpend = expenseTxns.reduce((s, t) => s + t.amount, 0);
    const totalRefunds = refundTxns.reduce((s, t) => s + t.amount, 0);
    const netSpend = totalSpend - totalRefunds;
    const avgMonthly = netSpend / monthCount;

    // Month-over-month change for most recent month
    let momChange: { current: number; previous: number; delta: number; pct: number } | null = null;
    if (monthlyData.length >= 2) {
      const current = monthlyData[monthlyData.length - 1].total;
      const previous = monthlyData[monthlyData.length - 2].total;
      momChange = { current, previous, delta: current - previous, pct: previous > 0 ? ((current - previous) / previous) * 100 : 0 };
    }

    // Year-over-year comparison
    const yearMap = new Map<string, number>();
    for (const [month, total] of monthlyMap) {
      const year = month.slice(0, 4);
      yearMap.set(year, (yearMap.get(year) ?? 0) + total);
    }
    const yearMonths = new Map<string, number>();
    for (const [month] of monthlyMap) {
      const year = month.slice(0, 4);
      yearMonths.set(year, (yearMonths.get(year) ?? 0) + 1);
    }
    const yoyData = [...yearMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, total]) => ({
        year,
        total,
        months: yearMonths.get(year) ?? 1,
        monthlyAvg: total / (yearMonths.get(year) ?? 1),
      }));

    // Actual date range from filtered data
    const dates = transactions.map(t => t.date).sort();
    const dateRange = { start: dates[0] ?? '', end: dates[dates.length - 1] ?? '' };

    return { monthlyData, catData, totalSpend, totalRefunds, netSpend, avgMonthly, monthCount, momChange, yoyData, dateRange };
  }, [imported, transactions]);

  if (imported && transactions.length > 0 && analytics) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Collapsible import/re-import UI */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={S.title}>📊 Spending Trends</h3>
              <p style={S.subtitle}>
                {analytics.dateRange.start} → {analytics.dateRange.end} • {analytics.monthCount} months
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={S.btn('ghost')} onClick={() => setImportCollapsed(!importCollapsed)}>
                {importCollapsed ? '📤 Re-import' : '✕ Close'}
              </button>
            </div>
          </div>
          {!importCollapsed && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: COLORS.dropBg }}>
              <div
                style={S.dropZone(isDragging)}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>
                  {uploading ? 'Processing...' : 'Drop CSV to re-import'}
                </p>
              </div>
              <input id="csv-file-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={onFileSelect} />
              <button style={{ ...S.btn('danger'), marginTop: 12 }} onClick={clearData}>🗑️ Clear Data</button>
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div style={S.card}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={S.stat}>
              <span style={S.statValue}>{formatCurrency(analytics.netSpend, true)}</span>
              <span style={S.statLabel}>Net Spending</span>
            </div>
            <div style={S.stat}>
              <span style={S.statValue}>{formatCurrency(analytics.avgMonthly, true)}</span>
              <span style={S.statLabel}>Avg/Month</span>
            </div>
            <div style={S.stat}>
              <span style={S.statValue}>{transactions.filter(t => t.transactionType === 'expense').length}</span>
              <span style={S.statLabel}>Transactions</span>
            </div>
            {analytics.momChange && (
              <div style={S.stat}>
                <span style={{ ...S.statValue, color: analytics.momChange.delta > 0 ? COLORS.red : COLORS.green }}>
                  {analytics.momChange.delta > 0 ? '+' : ''}{formatCurrency(analytics.momChange.delta, true)}
                </span>
                <span style={S.statLabel}>vs Last Month ({analytics.momChange.pct > 0 ? '+' : ''}{analytics.momChange.pct.toFixed(0)}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Monthly spending trend line */}
        <div style={S.card}>
          <h3 style={S.title}>Monthly Spending Trend</h3>
          <p style={S.subtitle}>Total spending over time with trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics.monthlyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(analytics.monthlyData.length / 12))} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l: string) => l} />
              <Line type="monotone" dataKey="total" stroke={COLORS.accent} strokeWidth={2} dot={false} />
              {/* Average line */}
              <Line type="monotone" dataKey={() => analytics.avgMonthly} stroke={COLORS.orange} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Average" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top spending categories */}
        <div style={S.card}>
          <h3 style={S.title}>Top Spending Categories</h3>
          <p style={S.subtitle}>Ranked by total spending, with monthly average</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analytics.catData.map((cat, i) => {
              const maxTotal = analytics.catData[0]?.total ?? 1;
              const pct = (cat.total / maxTotal) * 100;
              return (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                      #{i + 1} {cat.category}
                    </span>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      {formatCurrency(cat.monthlyAvg)}/mo • {formatCurrency(cat.total, true)} total
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: COLORS.border, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: CATEGORY_COLORS[cat.category] ?? COLORS.textMuted, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year-over-year comparison */}
        {analytics.yoyData.length > 1 && (
          <div style={S.card}>
            <h3 style={S.title}>Year-over-Year Comparison</h3>
            <p style={S.subtitle}>Average monthly spending by year</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.yoyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="monthlyAvg" name="Avg Monthly" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
