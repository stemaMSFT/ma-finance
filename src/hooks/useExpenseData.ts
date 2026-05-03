import { useState, useEffect, useMemo } from 'react';

const ACTUALS_START = '2025-05';

export interface Transaction {
  date: string;
  amount: number;
  transactionType: string;
  mappedCategory: string;
  description?: string;
}

export interface ExpenseData {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  annualExpenses: number;
  monthlyAvg: number;
  monthCount: number;
  byCategory: Record<string, number>;
  hasData: boolean;
}

export function useExpenseData(): ExpenseData {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/expenses')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { imported?: boolean; transactions?: Transaction[] }) => {
        if (!cancelled) {
          if (data.imported && data.transactions?.length) {
            setTransactions(data.transactions);
          }
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const computed = useMemo(() => {
    const filtered = transactions.filter(
      t => t.date >= ACTUALS_START && t.transactionType === 'expense' && t.amount > 0
    );

    const months = new Set(filtered.map(t => t.date.slice(0, 7)));
    const monthCount = Math.max(months.size, 1);
    const totalExpenses = filtered.reduce((s, t) => s + t.amount, 0);
    const annualExpenses = (totalExpenses / monthCount) * 12;
    const monthlyAvg = totalExpenses / monthCount;

    const byCategory: Record<string, number> = {};
    for (const t of filtered) {
      const cat = t.mappedCategory || 'misc';
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    }
    // Annualize category amounts
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat] = (byCategory[cat] / monthCount) * 12;
    }

    return {
      annualExpenses: Math.round(annualExpenses),
      monthlyAvg: Math.round(monthlyAvg),
      monthCount,
      byCategory,
      hasData: filtered.length > 0,
    };
  }, [transactions]);

  return {
    transactions,
    loading,
    error,
    ...computed,
  };
}
