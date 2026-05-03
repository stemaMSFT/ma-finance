/**
 * CashFlowPanel — Full financial waterfall from gross income to surplus.
 * Shows where all household money goes: income → deductions → taxes → expenses → surplus.
 */

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  Sankey, Rectangle,
} from 'recharts';
import { calcCompensation, type PersonComp } from '../../engine/mockEngine';
import { EXPENSE_CATEGORIES } from '../../engine/expenses';
import { formatCurrency, formatPercent } from '../../utils/format';
import { STEVEN_COMP, SONYA_COMP, HSA_FAMILY_LIMIT } from '../../config/household';
import { calcHouseholdTaxes } from '../../engine/taxes';
import { useExpenseData } from '../../hooks/useExpenseData';

// ── Component ─────────────────────────────────────────────────────

export default function CashFlowPanel() {
  const { transactions, loading } = useExpenseData();

  // ── Compensation Calculations ─────────────────────────────────
  const steven = useMemo(() => calcCompensation(STEVEN_COMP), []);
  const sonya = useMemo(() => calcCompensation(SONYA_COMP), []);

  const grossIncome = steven.totalComp + sonya.totalComp;
  const combinedBase = steven.baseSalary + sonya.baseSalary;
  const combinedBonus = steven.bonusAmount + sonya.bonusAmount;
  const combinedRSU = steven.rsuAnnual + sonya.rsuAnnual;
  const combinedESPP = steven.esppBenefit + sonya.esppBenefit;
  const combined401kMatch = steven.employer401kMatch + sonya.employer401kMatch;

  // ── Deductions & Taxes ────────────────────────────────────────
  const taxes = calcHouseholdTaxes(STEVEN_COMP, SONYA_COMP);
  const { preTax401k, preTaxHSA, federalIncomeTax, stevenFICA, sonyaFICA, totalFICA, totalTaxes, effectiveTaxRate } = taxes;
  const totalPreTaxDeductions = preTax401k + preTaxHSA;
  const cashIncome = taxes.totalCashIncome;
  const takeHomePay = taxes.takeHome;

  // ── Expenses from Imported Data ───────────────────────────────
  const expenseData = useMemo(() => {
    const filtered = transactions.filter(
      (t) => t.transactionType === 'expense' && t.date >= '2025-05'
    );

    // Count distinct months
    const months = new Set(filtered.map((t) => t.date.slice(0, 7)));
    const monthCount = Math.max(months.size, 1);

    // Group by category
    const byCategory: Record<string, number> = {};
    for (const t of filtered) {
      const cat = t.mappedCategory || 'misc';
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    }

    // Monthly averages sorted by amount
    const categories = Object.entries(byCategory)
      .map(([id, total]) => ({
        id,
        monthly: total / monthCount,
        annual: (total / monthCount) * 12,
      }))
      .sort((a, b) => b.monthly - a.monthly);

    const totalMonthly = categories.reduce((sum, c) => sum + c.monthly, 0);
    return { categories, totalMonthly, totalAnnual: totalMonthly * 12, monthCount };
  }, [transactions]);

  // ── Recent Transactions by Category (most recent month) ─────
  const recentTransactions = useMemo(() => {
    const filtered = transactions.filter(
      t => t.transactionType === 'expense' && t.date >= '2025-05'
    );
    if (!filtered.length) return {};

    const months = [...new Set(filtered.map(t => t.date.slice(0, 7)))].sort().reverse();
    const recentMonth = months[0];

    const byCategory: Record<string, Array<{ date: string; description: string; amount: number }>> = {};
    for (const t of filtered.filter(t => t.date.startsWith(recentMonth))) {
      const cat = t.mappedCategory || 'misc';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({
        date: t.date,
        description: t.description || 'Unknown',
        amount: t.amount,
      });
    }
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort((a, b) => b.amount - a.amount);
    }
    return { month: recentMonth, byCategory };
  }, [transactions]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Bottom Line ───────────────────────────────────────────────
  const monthlySurplus = takeHomePay / 12 - expenseData.totalMonthly;
  const annualSurplus = takeHomePay - expenseData.totalAnnual;
  const totalSaved = totalPreTaxDeductions + Math.max(0, annualSurplus);
  const savingsRateOfGross = cashIncome > 0 ? (totalSaved / cashIncome) * 100 : 0;

  // ── Sankey Diagram Data ────────────────────────────────────────
  const sankeyData = useMemo(() => {
    const stevenPay = STEVEN_COMP.baseSalary + (STEVEN_COMP.baseSalary * STEVEN_COMP.bonusTargetPercent / 100);
    const sonyaPay = SONYA_COMP.baseSalary + (SONYA_COMP.baseSalary * SONYA_COMP.bonusTargetPercent / 100);
    const totalPay = stevenPay + sonyaPay;
    const stevenShare = totalPay > 0 ? stevenPay / totalPay : 0.5;
    const sonyaShare = 1 - stevenShare;

    // Build expense nodes: top 8 + "Other"
    const sorted = [...expenseData.categories].sort((a, b) => b.annual - a.annual);
    const top8 = sorted.slice(0, 8);
    const otherTotal = sorted.slice(8).reduce((s, c) => s + c.annual, 0);
    const surplus = Math.max(0, annualSurplus);
    const negativeSurplus = annualSurplus < 0;

    const nodes: Array<{ name: string }> = [
      // 0, 1: income sources
      { name: "Steven's Pay" },
      { name: "Sonya's Pay" },
      // 2-6: deductions/taxes/take-home
      { name: '401k' },
      { name: 'HSA' },
      { name: 'Federal Tax' },
      { name: 'FICA' },
      { name: 'Take-Home' },
    ];

    // 7+: expense categories
    const expenseNodes: Array<{ name: string; annual: number }> = [];
    for (const c of top8) {
      const { label, icon } = getCategoryInfo(c.id);
      expenseNodes.push({ name: `${icon} ${label}`, annual: c.annual });
    }
    if (otherTotal > 0) {
      expenseNodes.push({ name: '📦 Other Expenses', annual: otherTotal });
    }
    if (surplus > 0 || negativeSurplus) {
      expenseNodes.push({ name: negativeSurplus ? '🔴 Deficit' : '✅ Surplus', annual: negativeSurplus ? 0 : surplus });
    }

    for (const en of expenseNodes) {
      nodes.push({ name: en.name });
    }

    const TAKE_HOME_IDX = 6;
    const links: Array<{ source: number; target: number; value: number }> = [];
    const minVal = 100; // minimum link value for visibility

    // Column 1 → Column 2: Steven's Pay and Sonya's Pay to deductions/taxes/take-home
    const steven401k = Math.round(preTax401k * stevenShare);
    const sonya401k = preTax401k - steven401k;
    const stevenHSA = Math.round(preTaxHSA * stevenShare);
    const sonyaHSA = preTaxHSA - stevenHSA;
    const stevenFedTax = Math.round(federalIncomeTax * stevenShare);
    const sonyaFedTax = federalIncomeTax - stevenFedTax;
    const stevenTakeHome = Math.round(stevenPay - steven401k - stevenHSA - stevenFedTax - stevenFICA);
    const sonyaTakeHome = Math.round(sonyaPay - sonya401k - sonyaHSA - sonyaFedTax - sonyaFICA);

    // Steven links
    if (steven401k > minVal) links.push({ source: 0, target: 2, value: steven401k });
    if (stevenHSA > minVal) links.push({ source: 0, target: 3, value: stevenHSA });
    if (stevenFedTax > minVal) links.push({ source: 0, target: 4, value: stevenFedTax });
    if (stevenFICA > minVal) links.push({ source: 0, target: 5, value: Math.round(stevenFICA) });
    if (stevenTakeHome > minVal) links.push({ source: 0, target: TAKE_HOME_IDX, value: stevenTakeHome });

    // Sonya links
    if (sonya401k > minVal) links.push({ source: 1, target: 2, value: sonya401k });
    if (sonyaHSA > minVal) links.push({ source: 1, target: 3, value: sonyaHSA });
    if (sonyaFedTax > minVal) links.push({ source: 1, target: 4, value: sonyaFedTax });
    if (sonyaFICA > minVal) links.push({ source: 1, target: 5, value: Math.round(sonyaFICA) });
    if (sonyaTakeHome > minVal) links.push({ source: 1, target: TAKE_HOME_IDX, value: sonyaTakeHome });

    // Column 2 → Column 3: Take-Home to expenses + surplus
    for (let i = 0; i < expenseNodes.length; i++) {
      const val = expenseNodes[i].annual;
      if (val > minVal) {
        links.push({ source: TAKE_HOME_IDX, target: 7 + i, value: Math.round(val) });
      }
    }

    return { nodes, links, negativeSurplus };
  }, [expenseData, annualSurplus, preTax401k, preTaxHSA, federalIncomeTax, stevenFICA, sonyaFICA]);

  // ── Waterfall Chart Data ──────────────────────────────────────
  const waterfallData = [
    { name: 'Cash Income', value: cashIncome, type: 'income' },
    { name: 'Pre-Tax Deductions', value: -totalPreTaxDeductions, type: 'deduction' },
    { name: 'Taxes', value: -totalTaxes, type: 'tax' },
    { name: 'Take-Home', value: takeHomePay, type: 'subtotal' },
    { name: 'Expenses', value: -expenseData.totalAnnual, type: 'expense' },
    { name: 'Surplus', value: annualSurplus, type: 'surplus' },
  ];

  const colorMap: Record<string, string> = {
    income: '#10b981',
    deduction: '#3b82f6',
    tax: '#f97316',
    subtotal: '#6366f1',
    expense: '#64748b',
    surplus: annualSurplus >= 0 ? '#059669' : '#dc2626',
  };

  // ── Helper: get category label ────────────────────────────────
  function getCategoryInfo(id: string) {
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === id);
    return { label: cat?.label || id, icon: cat?.icon || '📦' };
  }

  function formatMonth(yyyymm: string): string {
    const [year, month] = yyyymm.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  if (loading) {
    return <div className="panel-loading">Loading cash flow data...</div>;
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>💸 Cash Flow Waterfall</h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Where every dollar goes — from gross income to surplus
      </p>

      {/* ── Sankey Money Flow Diagram ─────────────────────────────── */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>💸 Money Flow</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
          How every dollar flows from paychecks to final destinations
        </p>
        <ResponsiveContainer width="100%" height={500}>
          <Sankey
            data={{ nodes: sankeyData.nodes, links: sankeyData.links }}
            nodeWidth={10}
            nodePadding={24}
            margin={{ top: 20, right: 200, bottom: 20, left: 200 }}
            node={<SankeyNode />}
            link={<SankeyLink />}
          >
            <Tooltip content={<SankeyTooltip />} />
          </Sankey>
        </ResponsiveContainer>
        {sankeyData.negativeSurplus && (
          <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
            ⚠️ Expenses exceed take-home pay — surplus shown as zero in the flow diagram
          </p>
        )}
      </div>

      {/* ── Waterfall Chart ─────────────────────────────────────── */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Annual Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatCurrency(Math.abs(v))} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {waterfallData.map((entry, i) => (
                <Cell key={i} fill={colorMap[entry.type]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
          {[
            { label: 'Income', color: '#10b981' },
            { label: 'Deductions', color: '#3b82f6' },
            { label: 'Taxes', color: '#f97316' },
            { label: 'Expenses', color: '#64748b' },
            { label: 'Surplus', color: '#059669' },
          ].map((l) => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: l.color, display: 'inline-block' }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Section 1: Gross Income ────────────────────────────── */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Section 1: Household Income</h3>
        <div style={bigNumber}>{formatCurrency(cashIncome)}<span style={perYear}>/year cash</span></div>
        <div style={gridStyle}>
          <IncomeRow label="Combined Base Salary" value={combinedBase} />
          <IncomeRow label="Combined Bonus (10% target)" value={combinedBonus} />
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Non-Cash / Deferred Compensation</div>
          <div style={gridStyle}>
            <IncomeRow label="RSUs (vesting)" value={combinedRSU} />
            <IncomeRow label="ESPP Benefit" value={combinedESPP} />
            <IncomeRow label="401k Employer Match" value={combined401kMatch} />
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
            Total comp incl. non-cash: {formatCurrency(grossIncome)}
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
          Steven: {formatCurrency(steven.totalComp)} | Sonya: {formatCurrency(sonya.totalComp)}
        </div>
      </div>

      {/* ── Section 2: Deductions & Taxes ──────────────────────── */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Section 2: Deductions & Taxes</h3>

        <div style={{ marginBottom: 16 }}>
          <h4 style={subHeading}>Pre-Tax Deductions</h4>
          <div style={gridStyle}>
            <FlowRow label="401k Contributions (2×$24,500)" value={preTax401k} color="#3b82f6" negative />
            <FlowRow label="HSA (Family)" value={preTaxHSA} color="#3b82f6" negative />
          </div>
          <div style={subtotalRow}>
            Adjusted Gross Income: <strong>{formatCurrency(cashIncome - totalPreTaxDeductions)}</strong>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h4 style={subHeading}>Taxes</h4>
          <div style={gridStyle}>
            <FlowRow label="Federal Income Tax" value={federalIncomeTax} color="#f97316" negative />
            <FlowRow label="FICA (SS + Medicare)" value={totalFICA} color="#f97316" negative />
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Effective rate: {formatPercent(effectiveTaxRate * 100)}
          </div>
        </div>

        <div style={{ ...subtotalRow, background: '#eef2ff', borderRadius: 8, padding: '12px 16px' }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>💵 Take-Home Pay</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#4f46e5' }}>
            {formatCurrency(takeHomePay)}/yr ({formatCurrency(takeHomePay / 12)}/mo)
          </span>
        </div>
      </div>

      {/* ── Section 3: Expenses ────────────────────────────────── */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Section 3: Where Money Goes (Actual Expenses)</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
          Based on {expenseData.monthCount} month(s) of imported data (May 2025+)
        </p>

        {expenseData.categories.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No expense data available. Import transactions to see actuals.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px 16px', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: '#94a3b8' }}>CATEGORY</span>
              <span style={{ fontWeight: 600, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>MONTHLY</span>
              <span style={{ fontWeight: 600, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>ANNUAL</span>
            </div>
            <div>
              {expenseData.categories.map((c) => {
                const { label, icon } = getCategoryInfo(c.id);
                return (
                  <div key={c.id}>
                    <div
                      onClick={() => toggleCategory(c.id)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: '6px 16px',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '8px 0',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <span style={{ fontSize: 13 }}>
                        <span style={{ marginRight: 6 }}>{expandedCategories.has(c.id) ? '▾' : '▸'}</span>
                        {icon} {label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
                        {formatCurrency(c.monthly)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: '#64748b' }}>
                        {formatCurrency(c.annual)}
                      </span>
                    </div>
                    {expandedCategories.has(c.id) && recentTransactions.byCategory?.[c.id] && (
                      <div style={{
                        padding: '8px 0 12px 28px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        margin: '4px 0 8px',
                      }}>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px', fontWeight: 600 }}>
                          {formatMonth(recentTransactions.month!)} transactions ({recentTransactions.byCategory[c.id].length})
                        </p>
                        {recentTransactions.byCategory[c.id].map((t, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '3px 8px',
                            fontSize: 12,
                            color: '#475569',
                            borderBottom: i < recentTransactions.byCategory[c.id].length - 1 ? '1px solid #e2e8f0' : 'none',
                          }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                              {t.description}
                            </span>
                            <span style={{ marginLeft: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {formatCurrency(t.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ ...subtotalRow, marginTop: 12, borderTop: '2px solid #e2e8f0', paddingTop: 12 }}>
              <span style={{ fontWeight: 700 }}>Total Expenses</span>
              <span>
                <strong>{formatCurrency(expenseData.totalMonthly)}</strong>/mo &nbsp;|&nbsp;
                <strong>{formatCurrency(expenseData.totalAnnual)}</strong>/yr
              </span>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: expenseData.totalAnnual > takeHomePay ? '#dc2626' : '#059669' }}>
              {expenseData.totalAnnual > takeHomePay
                ? `⚠️ Spending exceeds take-home by ${formatCurrency(expenseData.totalAnnual - takeHomePay)}/yr`
                : `✅ Spending is ${formatCurrency(takeHomePay - expenseData.totalAnnual)}/yr below take-home`}
            </div>
          </>
        )}
      </div>

      {/* ── Section 4: Bottom Line ─────────────────────────────── */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Section 4: The Bottom Line</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}>
          <MetricCard
            label="Monthly Surplus"
            value={formatCurrency(monthlySurplus)}
            color={monthlySurplus >= 0 ? '#059669' : '#dc2626'}
          />
          <MetricCard
            label="Annual Surplus"
            value={formatCurrency(annualSurplus)}
            color={annualSurplus >= 0 ? '#059669' : '#dc2626'}
          />
          <MetricCard
            label="Savings Rate (of gross)"
            value={formatPercent(savingsRateOfGross)}
            color="#4f46e5"
          />
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
          <p style={{ margin: 0, fontSize: 14, color: '#166534' }}>
            <strong>💡 After 401k + HSA + expenses:</strong> You have approximately{' '}
            <strong>{formatCurrency(Math.max(0, annualSurplus))}/yr</strong> ({formatCurrency(Math.max(0, monthlySurplus))}/mo)
            available for additional savings, investments, or discretionary goals beyond your pre-tax accounts.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sankey Custom Components ──────────────────────────────────────

const SANKEY_NODE_COLORS: Record<string, string> = {
  "Steven's Pay": '#10b981',
  "Sonya's Pay": '#10b981',
  '401k': '#3b82f6',
  'HSA': '#3b82f6',
  'Federal Tax': '#f97316',
  'FICA': '#f97316',
  'Take-Home': '#6366f1',
  '🔴 Deficit': '#dc2626',
  '✅ Surplus': '#059669',
};

function getSankeyNodeColor(name: string): string {
  if (SANKEY_NODE_COLORS[name]) return SANKEY_NODE_COLORS[name];
  return '#64748b'; // expense categories
}

function getSankeyLinkColor(targetName: string): { stroke: string; opacity: number } {
  if (targetName === '401k' || targetName === 'HSA') return { stroke: '#3b82f6', opacity: 0.3 };
  if (targetName === 'Federal Tax' || targetName === 'FICA') return { stroke: '#f97316', opacity: 0.3 };
  if (targetName === 'Take-Home') return { stroke: '#6366f1', opacity: 0.25 };
  if (targetName === '✅ Surplus') return { stroke: '#059669', opacity: 0.3 };
  return { stroke: '#64748b', opacity: 0.2 };
}

function SankeyNode(props: any) {
  const { x, y, width, height, index, payload } = props;
  if (!payload) return null;
  const color = getSankeyNodeColor(payload.name);
  const chartWidth = props.containerWidth || 960;
  const isLeft = x < chartWidth / 3;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={2} />
      <text
        x={isLeft ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isLeft ? 'end' : 'start'}
        dominantBaseline="middle"
        fontSize={12}
        fontWeight={500}
        fill="#334155"
      >
        {payload.name}
      </text>
      <text
        x={isLeft ? x - 6 : x + width + 6}
        y={y + height / 2 + 15}
        textAnchor={isLeft ? 'end' : 'start'}
        dominantBaseline="middle"
        fontSize={11}
        fill="#94a3b8"
      >
        {formatCurrency(payload.value)}
      </text>
    </g>
  );
}

function SankeyLink(props: any) {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload } = props;
  if (!payload) return null;
  const targetName = payload.target?.name || '';
  const { stroke, opacity } = getSankeyLinkColor(targetName);

  return (
    <path
      d={`
        M${sourceX},${sourceY + linkWidth / 2}
        C${sourceControlX},${sourceY + linkWidth / 2}
          ${targetControlX},${targetY + linkWidth / 2}
          ${targetX},${targetY + linkWidth / 2}
        L${targetX},${targetY - linkWidth / 2}
        C${targetControlX},${targetY - linkWidth / 2}
          ${sourceControlX},${sourceY - linkWidth / 2}
          ${sourceX},${sourceY - linkWidth / 2}
        Z
      `}
      fill={stroke}
      fillOpacity={opacity}
      stroke={stroke}
      strokeOpacity={opacity + 0.1}
      strokeWidth={0.5}
    />
  );
}

function SankeyTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload?.payload || payload[0]?.payload;
  if (!data) return null;

  const name = data.source?.name && data.target?.name
    ? `${data.source.name} → ${data.target.name}`
    : data.name || '';
  const value = data.value || 0;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{name}</div>
      <div style={{ color: '#475569' }}>{formatCurrency(value)}</div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function IncomeRow({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
        {formatCurrency(value)}
      </span>
    </>
  );
}

function FlowRow({ label, value, color, negative }: { label: string; value: number; color: string; negative?: boolean }) {
  return (
    <>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span style={{ textAlign: 'right', fontWeight: 600, color }}>
        {negative ? '−' : ''}{formatCurrency(value)}
      </span>
    </>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 12,
  color: '#1e293b',
};

const subHeading: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 8,
};

const bigNumber: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  color: '#10b981',
  marginBottom: 16,
};

const perYear: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 400,
  color: '#64748b',
  marginLeft: 4,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '6px 24px',
  alignItems: 'center',
};

const subtotalRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 14,
};
