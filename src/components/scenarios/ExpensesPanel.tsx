import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency, formatPercent } from '../../utils/format';
import {
  EXPENSE_CATEGORIES,
  GROUP_LABELS,
  GROUP_ORDER,
  EXPENSE_PRESETS,
  getDefaultExpenses,
  calculateBudget,
  getGroupTotals,
  analyzeSavings,
  calculateFIREImpact,
  applyPreset,
  SAVINGS_BUCKETS,
  SAVINGS_BUCKET_GROUPS,
  SAVINGS_GROUP_ORDER,
  getDefaultAllocations,
  calculateAllocation,
} from '../../engine/expenses';
import type { ExpenseGroup, SavingsBucketGroup } from '../../engine/types';

// ── Color tokens ───────────────────────────────────────────────────
const COLORS = {
  accent: '#6c63ff',
  teal: '#14b8a6',
  orange: '#f59e0b',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  gray: '#94a3b8',
  bgCard: '#ffffff',
  bgPage: '#f8fafc',
  border: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
};

const GROUP_COLORS: Record<ExpenseGroup, string> = {
  essential: COLORS.blue,
  lifestyle: COLORS.purple,
  obligations: COLORS.orange,
  future: COLORS.teal,
};

const SAVINGS_GROUP_COLORS: Record<SavingsBucketGroup, string> = {
  tax_advantaged: COLORS.blue,
  goals: COLORS.teal,
  cash: COLORS.orange,
};

// ── Shared styles ──────────────────────────────────────────────────
const S = {
  card: {
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: '24px 28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: '-0.01em',
  } as React.CSSProperties,
  cardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  } as React.CSSProperties,
  sectionGap: { display: 'flex', flexDirection: 'column' as const, gap: 20 },
};

// ── Pill tabs ──────────────────────────────────────────────────────
const pillContainer: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  background: '#f1f5f9',
  borderRadius: 10,
  padding: 4,
  marginBottom: 24,
};

const pillBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '8px 0',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
  background: active ? COLORS.bgCard : 'transparent',
  color: active ? COLORS.accent : COLORS.textSecondary,
  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
  transition: 'all 0.15s ease',
});

// ── Helpers ────────────────────────────────────────────────────────
type TabId = 'budget' | 'breakdown' | 'savings' | 'fire';

const TABS: { id: TabId; label: string }[] = [
  { id: 'budget', label: 'Budget' },
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'savings', label: 'Savings' },
  { id: 'fire', label: 'FIRE Impact' },
];

const sliderTrack = (color: string, pct: number): React.CSSProperties => ({
  WebkitAppearance: 'none',
  appearance: 'none' as React.CSSProperties['appearance'],
  width: '100%',
  height: 6,
  borderRadius: 3,
  outline: 'none',
  cursor: 'pointer',
  background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, ${COLORS.border} ${pct}%, ${COLORS.border} 100%)`,
});

const numberInput: React.CSSProperties = {
  width: 130,
  padding: '8px 12px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  color: COLORS.textPrimary,
  background: COLORS.bgCard,
  outline: 'none',
};

// ── Component ──────────────────────────────────────────────────────
export default function ExpensesPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('budget');
  const [expenses, setExpenses] = useState<Record<string, number>>(getDefaultExpenses);
  const [activePreset, setActivePreset] = useState('current');

  // Income inputs
  const [stevenIncome, setStevenIncome] = useState(210_000);
  const [spouseIncome, setSpouseIncome] = useState(120_000);
  const householdIncome = stevenIncome + spouseIncome;

  // FIRE params
  const [currentPortfolio, setCurrentPortfolio] = useState(95_000);
  const [currentAge] = useState(27);
  const [targetRetirementAge, setTargetRetirementAge] = useState(50);

  // Savings allocation buckets
  const [allocations, setAllocations] = useState<Record<string, number>>(getDefaultAllocations);

  // ── Derived data ────────────────────────────────────────────────
  const budget = useMemo(() => calculateBudget(expenses), [expenses]);
  const groupTotals = useMemo(() => getGroupTotals(expenses), [expenses]);
  const savings = useMemo(
    () => analyzeSavings(householdIncome, expenses),
    [householdIncome, expenses],
  );
  const fireImpact = useMemo(
    () =>
      calculateFIREImpact(
        budget.totalAnnual,
        savings.annualSavings,
        currentPortfolio,
        currentAge,
        targetRetirementAge,
      ),
    [budget.totalAnnual, savings.annualSavings, currentPortfolio, currentAge, targetRetirementAge],
  );

  // Scenarios: cut expenses by 10 / 20 / 30%
  const fireScenarios = useMemo(() => {
    const cuts = [0, 0.1, 0.2, 0.3] as const;
    return cuts.map((cut) => {
      const adjAnnual = budget.totalAnnual * (1 - cut);
      const adjSavings = savings.afterTaxIncome - adjAnnual;
      const impact = calculateFIREImpact(
        adjAnnual,
        adjSavings,
        currentPortfolio,
        currentAge,
        targetRetirementAge,
      );
      return { cut, adjAnnual, adjSavings, ...impact };
    });
  }, [budget.totalAnnual, savings.afterTaxIncome, currentPortfolio, currentAge, targetRetirementAge]);

  // ── Helpers ──────────────────────────────────────────────────────
  const handleSlider = (catId: string, value: number) => {
    setExpenses((prev) => ({ ...prev, [catId]: value }));
    setActivePreset(''); // clear preset when manually adjusting
  };

  const handlePreset = (presetId: string) => {
    setExpenses(applyPreset(presetId));
    setActivePreset(presetId);
  };

  // Pie chart data
  const pieData = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({
        name: GROUP_LABELS[g],
        value: groupTotals[g],
        color: GROUP_COLORS[g],
      })),
    [groupTotals],
  );

  // Bar chart data (categories sorted by amount desc)
  const barData = useMemo(
    () =>
      [...EXPENSE_CATEGORIES]
        .sort((a, b) => (expenses[b.id] ?? 0) - (expenses[a.id] ?? 0))
        .map((cat) => ({
          name: `${cat.icon} ${cat.label}`,
          value: expenses[cat.id] ?? 0,
          color: GROUP_COLORS[cat.group],
        })),
    [expenses],
  );

  // Savings waterfall data
  const waterfallData = useMemo(() => {
    const s = savings;
    return [
      { name: 'Gross Income', value: s.grossHouseholdIncome, color: COLORS.green },
      { name: 'Taxes', value: s.estimatedTaxes, color: COLORS.red },
      { name: 'Expenses', value: s.totalAnnualExpenses, color: COLORS.orange },
      { name: 'Savings', value: Math.max(0, s.annualSavings), color: COLORS.accent },
    ];
  }, [savings]);

  // Insight: $100/mo savings impact
  const insightDelta = useMemo(() => {
    const baseYears = fireImpact.yearsToFIRE;
    const boostedSavings = savings.annualSavings + 1200; // $100/mo extra
    const boosted = calculateFIREImpact(
      budget.totalAnnual - 1200,
      boostedSavings,
      currentPortfolio,
      currentAge,
      targetRetirementAge,
    );
    const monthsSaved = Math.max(0, (baseYears - boosted.yearsToFIRE) * 12);
    return { annualExtra: 1200, monthsSaved: Math.round(monthsSaved) };
  }, [fireImpact, savings.annualSavings, budget.totalAnnual, currentPortfolio, currentAge, targetRetirementAge]);

  // ── Custom tooltip ──────────────────────────────────────────────
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string } }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{d.payload.name}</div>
        <div style={{ color: COLORS.textSecondary }}>{formatCurrency(d.value)}/mo</div>
      </div>
    );
  };

  // ── Render: Budget Tab ──────────────────────────────────────────
  const renderBudget = () => (
    <div style={S.sectionGap}>
      {/* Preset selector */}
      <div style={S.card}>
        <div style={S.cardTitle}>Spending Preset</div>
        <p style={S.cardSub}>Quick-set all categories to a lifestyle level</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXPENSE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              style={{
                padding: '7px 16px',
                border: activePreset === p.id ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
                background: activePreset === p.id ? `${COLORS.accent}10` : COLORS.bgCard,
                color: activePreset === p.id ? COLORS.accent : COLORS.textSecondary,
                transition: 'all 0.15s ease',
              }}
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category sliders grouped */}
      {GROUP_ORDER.map((group) => {
        const cats = EXPENSE_CATEGORIES.filter((c) => c.group === group);
        const color = GROUP_COLORS[group];
        const groupTotal = groupTotals[group];
        return (
          <div key={group} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={S.cardTitle}>{GROUP_LABELS[group]}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color }}>{formatCurrency(groupTotal)}/mo</div>
            </div>
            <p style={{ ...S.cardSub, borderBottom: `2px solid ${color}`, paddingBottom: 12 }}>
              {cats.length} categories
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {cats.map((cat) => {
                const val = expenses[cat.id] ?? 0;
                const pct = cat.max > cat.min ? ((val - cat.min) / (cat.max - cat.min)) * 100 : 0;
                return (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                        {cat.icon} {cat.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 13, color: COLORS.textMuted }}>$</span>
                        <input
                          type="number"
                          min={cat.min}
                          max={cat.max}
                          step={cat.step}
                          value={val}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (!isNaN(n)) handleSlider(cat.id, Math.max(cat.min, Math.min(cat.max, n)));
                          }}
                          style={{
                            width: 80,
                            padding: '4px 8px',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 700,
                            color,
                            fontVariantNumeric: 'tabular-nums',
                            background: COLORS.bgCard,
                            outline: 'none',
                            textAlign: 'right',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 2px ${color}22`; }}
                          onBlur={(e) => { e.target.style.borderColor = COLORS.border; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={cat.min}
                      max={cat.max}
                      step={cat.step}
                      value={val}
                      onChange={(e) => handleSlider(cat.id, Number(e.target.value))}
                      style={sliderTrack(color, pct)}
                    />
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{cat.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Sticky summary bar */}
      <div
        style={{
          ...S.card,
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `2px solid ${COLORS.accent}`,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Monthly</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(budget.totalMonthly)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Annual</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(budget.totalAnnual)}</div>
        </div>
        {householdIncome > 0 && (
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings Rate</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.green }}>
              {formatPercent(savings.savingsRate * 100)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Breakdown Tab ───────────────────────────────────────
  const renderBreakdown = () => (
    <div style={S.sectionGap}>
      {/* Donut chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>Spending by Group</div>
        <p style={S.cardSub}>Monthly allocation across expense groups</p>
        <div style={{ position: 'relative', width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12 }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div
            style={{
              position: 'absolute',
              top: '42%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Monthly</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>
              {formatCurrency(budget.totalMonthly)}
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>Category Breakdown</div>
        <p style={S.cardSub}>All 15 categories sorted by monthly spend</p>
        <div style={{ width: '100%', height: Math.max(400, barData.length * 32) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 120, right: 20, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => formatCurrency(v, true)}
                tick={{ fontSize: 11, fill: COLORS.textMuted }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: COLORS.textSecondary }}
                width={115}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ── Render: Savings Tab ─────────────────────────────────────────
  const renderSavings = () => {
    const s = savings;
    const effectiveTaxRate = s.grossHouseholdIncome > 0 ? s.estimatedTaxes / s.grossHouseholdIncome : 0;
    const allocation = calculateAllocation(s.annualSavings, allocations);

    // Warnings
    const combined401k = (allocations['traditional_401k'] ?? 0) + (allocations['roth_401k'] ?? 0);
    const warnings: string[] = [];
    if (combined401k > 24_500) {
      warnings.push(`⚠️ Traditional 401k + Roth 401k = ${formatCurrency(combined401k)} exceeds the combined $24,500 limit.`);
    }
    for (const bucket of SAVINGS_BUCKETS) {
      if (bucket.annualLimit !== null && (allocations[bucket.id] ?? 0) > bucket.annualLimit) {
        warnings.push(`⚠️ ${bucket.label} allocation of ${formatCurrency(allocations[bucket.id])} exceeds the ${formatCurrency(bucket.annualLimit)} annual limit.`);
      }
    }
    if (allocation.totalAllocated > allocation.availableSavings) {
      warnings.push(`🚨 Total allocated (${formatCurrency(allocation.totalAllocated)}) exceeds available savings (${formatCurrency(allocation.availableSavings)}) by ${formatCurrency(allocation.totalAllocated - allocation.availableSavings)}.`);
    }

    // Group totals for stacked bar
    const groupAllocTotals: Record<SavingsBucketGroup, number> = { tax_advantaged: 0, goals: 0, cash: 0 };
    for (const b of SAVINGS_BUCKETS) {
      groupAllocTotals[b.group] += allocations[b.id] ?? 0;
    }

    return (
      <div style={S.sectionGap}>
        {/* Hero numbers */}
        <div style={S.card}>
          <div style={S.cardTitle}>Income → Expenses → Savings</div>
          <p style={S.cardSub}>The fundamental equation of financial independence</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Gross income */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Gross Household Income</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.green }}>
                {formatCurrency(s.grossHouseholdIncome)}
              </span>
            </div>

            {/* Taxes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                Estimated Taxes ({formatPercent(effectiveTaxRate * 100)} effective)
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.red }}>
                −{formatCurrency(s.estimatedTaxes)}
              </span>
            </div>

            <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: '2px 0' }} />

            {/* After-tax */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>After-Tax Income</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>
                {formatCurrency(s.afterTaxIncome)}
              </span>
            </div>

            {/* Expenses */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Total Annual Expenses</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.orange }}>
                −{formatCurrency(s.totalAnnualExpenses)}
              </span>
            </div>

            <div style={{ borderTop: `2px solid ${COLORS.accent}`, margin: '4px 0' }} />

            {/* Annual savings — hero */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>Annual Savings</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: COLORS.accent }}>
                {formatCurrency(s.annualSavings)}
              </span>
            </div>

            {/* Rates */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  % of Gross
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>
                  {formatPercent(s.savingsRate * 100)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  % of After-Tax
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>
                  {formatPercent(s.afterTaxSavingsRate * 100)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Monthly Savings
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>
                  {formatCurrency(s.monthlySavings)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Income inputs */}
        <div style={S.card}>
          <div style={S.cardTitle}>Household Income</div>
          <p style={S.cardSub}>Edit to model different income scenarios</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Steven&apos;s Income</span>
              <input
                type="number"
                value={stevenIncome}
                onChange={(e) => setStevenIncome(Number(e.target.value) || 0)}
                style={numberInput}
                step={5000}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Spouse&apos;s Income</span>
              <input
                type="number"
                value={spouseIncome}
                onChange={(e) => setSpouseIncome(Number(e.target.value) || 0)}
                style={numberInput}
                step={5000}
              />
            </label>
          </div>
        </div>

        {/* Waterfall visual */}
        <div style={S.card}>
          <div style={S.cardTitle}>Annual Cash Flow</div>
          <p style={S.cardSub}>Visual breakdown of where your income goes</p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ left: 10, right: 10, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.textSecondary }} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={{ fontSize: 11, fill: COLORS.textMuted }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                  {waterfallData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight */}
        <div
          style={{
            ...S.card,
            background: `${COLORS.accent}08`,
            borderLeft: `3px solid ${COLORS.accent}`,
          }}
        >
          <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6 }}>
            💡 Every <strong>$100/mo</strong> you cut from expenses adds{' '}
            <strong style={{ color: COLORS.green }}>{formatCurrency(insightDelta.annualExtra)}</strong> to your annual savings
            and shaves <strong style={{ color: COLORS.accent }}>{insightDelta.monthsSaved} months</strong> off your FIRE timeline.
          </div>
        </div>

        {/* ── Savings Allocation ────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>Where Your Savings Go</div>
          <p style={S.cardSub}>Allocate your {formatCurrency(s.annualSavings)}/yr savings across buckets</p>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {warnings.map((w, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: `${COLORS.red}08`,
                    border: `1px solid ${COLORS.red}30`,
                    fontSize: 13,
                    color: COLORS.red,
                    lineHeight: 1.5,
                  }}
                >
                  {w}
                </div>
              ))}
            </div>
          )}

          {SAVINGS_GROUP_ORDER.map((group) => {
            const groupBuckets = SAVINGS_BUCKETS.filter((b) => b.group === group);
            const groupColor = SAVINGS_GROUP_COLORS[group];
            return (
              <div key={group} style={{ marginBottom: 24 }}>
                {/* Group header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                    paddingBottom: 8,
                    borderBottom: `2px solid ${groupColor}20`,
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 18,
                      borderRadius: 2,
                      background: groupColor,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: groupColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {SAVINGS_BUCKET_GROUPS[group]}
                  </span>
                  <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 'auto' }}>
                    {formatCurrency(groupBuckets.reduce((sum, b) => sum + (allocations[b.id] ?? 0), 0))}/yr
                  </span>
                </div>

                {/* Bucket rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {groupBuckets.map((bucket) => {
                    const val = allocations[bucket.id] ?? 0;
                    const monthly = val / 12;
                    const limitPct = bucket.annualLimit ? Math.min(100, (val / bucket.annualLimit) * 100) : null;
                    const overLimit = bucket.annualLimit !== null && val > bucket.annualLimit;

                    return (
                      <div key={bucket.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Icon + label */}
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{bucket.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{bucket.label}</div>
                            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>{bucket.description}</div>
                          </div>

                          {/* Amount input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>$</span>
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => {
                                const newVal = Number(e.target.value) || 0;
                                setAllocations((prev) => ({ ...prev, [bucket.id]: newVal }));
                              }}
                              style={{ ...numberInput, width: 110 }}
                              step={500}
                              min={0}
                            />
                            <span style={{ fontSize: 11, color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                              {formatCurrency(monthly)}/mo
                            </span>
                          </div>
                        </div>

                        {/* Limit progress bar */}
                        {bucket.annualLimit !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 30 }}>
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                background: COLORS.border,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(limitPct ?? 0, 100)}%`,
                                  height: '100%',
                                  borderRadius: 3,
                                  background: overLimit ? COLORS.red : groupColor,
                                  transition: 'width 0.2s ease',
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: overLimit ? COLORS.red : COLORS.textMuted,
                                whiteSpace: 'nowrap',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {formatCurrency(val)} / {formatCurrency(bucket.annualLimit)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Allocation Summary ──────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>Allocation Summary</div>
          <p style={S.cardSub}>How your savings are distributed</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Total allocated */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Total Allocated</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>
                {formatCurrency(allocation.totalAllocated)}
              </span>
            </div>

            {/* Unallocated */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                {allocation.unallocated >= 0 ? 'Unallocated' : 'Over-allocated'}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: allocation.unallocated >= 0 ? COLORS.green : COLORS.red,
                }}
              >
                {allocation.unallocated >= 0 ? '' : '−'}{formatCurrency(Math.abs(allocation.unallocated))}
              </span>
            </div>

            <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: '2px 0' }} />

            {/* Stacked bar */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8 }}>
                Allocation by Category
              </div>
              {allocation.totalAllocated > 0 ? (
                <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden' }}>
                  {SAVINGS_GROUP_ORDER.map((g) => {
                    const pct = (groupAllocTotals[g] / allocation.totalAllocated) * 100;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={g}
                        style={{
                          width: `${pct}%`,
                          background: SAVINGS_GROUP_COLORS[g],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#fff',
                          transition: 'width 0.3s ease',
                          minWidth: pct > 5 ? undefined : 0,
                          overflow: 'hidden',
                        }}
                        title={`${SAVINGS_BUCKET_GROUPS[g]}: ${formatCurrency(groupAllocTotals[g])} (${pct.toFixed(0)}%)`}
                      >
                        {pct >= 12 ? `${pct.toFixed(0)}%` : ''}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ height: 24, borderRadius: 6, background: COLORS.border }} />
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                {SAVINGS_GROUP_ORDER.map((g) => (
                  <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: SAVINGS_GROUP_COLORS[g] }} />
                    <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
                      {SAVINGS_BUCKET_GROUPS[g]} — {formatCurrency(groupAllocTotals[g])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: FIRE Impact Tab ─────────────────────────────────────
  const renderFIRE = () => (
    <div style={S.sectionGap}>
      {/* Current FIRE numbers */}
      <div style={S.card}>
        <div style={S.cardTitle}>Your FIRE Numbers</div>
        <p style={S.cardSub}>Based on current expenses and derived savings</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'FIRE Number', value: formatCurrency(fireImpact.fireNumber, true), color: COLORS.accent, sub: `Annual expenses / 3.5% SWR` },
            { label: 'Coast FIRE', value: formatCurrency(fireImpact.coastFIRENumber, true), color: COLORS.teal, sub: 'Need invested now, then $0 savings' },
            { label: 'Years to FIRE', value: isFinite(fireImpact.yearsToFIRE) ? `${fireImpact.yearsToFIRE.toFixed(1)} yrs` : '∞', color: COLORS.blue, sub: 'At current savings rate' },
            { label: 'FIRE Age', value: isFinite(fireImpact.fireAge) ? `Age ${Math.round(fireImpact.fireAge)}` : 'N/A', color: COLORS.purple, sub: `Currently age ${currentAge}` },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: `${item.color}08`,
                borderRadius: 10,
                padding: '16px 18px',
                borderLeft: `3px solid ${item.color}`,
              }}
            >
              <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario comparison table */}
      <div style={S.card}>
        <div style={S.cardTitle}>What If You Cut Expenses?</div>
        <p style={S.cardSub}>Impact of reducing monthly spending on your FIRE timeline</p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Scenario', 'Monthly Expenses', 'FIRE Number', 'Years to FIRE', 'FIRE Age'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderBottom: `2px solid ${COLORS.border}`,
                      fontSize: 11,
                      fontWeight: 700,
                      color: COLORS.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fireScenarios.map((row) => {
                const isCurrent = row.cut === 0;
                return (
                  <tr
                    key={row.cut}
                    style={{
                      background: isCurrent ? `${COLORS.accent}06` : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: isCurrent ? 700 : 500, color: COLORS.textPrimary }}>
                      {isCurrent ? 'Current' : `−${formatPercent(row.cut * 100, 0)}`}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: COLORS.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(row.adjAnnual / 12)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: COLORS.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(row.fireNumber, true)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: COLORS.blue, fontVariantNumeric: 'tabular-nums' }}>
                      {isFinite(row.yearsToFIRE) ? `${row.yearsToFIRE.toFixed(1)} yrs` : '∞'}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: COLORS.purple, fontVariantNumeric: 'tabular-nums' }}>
                      {isFinite(row.fireAge) ? `Age ${Math.round(row.fireAge)}` : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editable FIRE params */}
      <div style={S.card}>
        <div style={S.cardTitle}>FIRE Parameters</div>
        <p style={S.cardSub}>Adjust portfolio and retirement targets</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Current Portfolio</span>
            <input
              type="number"
              value={currentPortfolio}
              onChange={(e) => setCurrentPortfolio(Number(e.target.value) || 0)}
              style={numberInput}
              step={5000}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Target Retirement Age</span>
            <input
              type="number"
              value={targetRetirementAge}
              onChange={(e) => setTargetRetirementAge(Number(e.target.value) || 50)}
              style={numberInput}
              min={currentAge + 1}
              max={70}
            />
          </label>
        </div>
      </div>

      {/* FIRE insight */}
      <div
        style={{
          ...S.card,
          background: `${COLORS.accent}08`,
          borderLeft: `3px solid ${COLORS.accent}`,
        }}
      >
        <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6 }}>
          🔥 Reducing expenses by <strong>$500/mo</strong> would move your FIRE date{' '}
          <strong style={{ color: COLORS.accent }}>
            {(() => {
              const boostedSavings = savings.annualSavings + 6000;
              const boosted = calculateFIREImpact(
                budget.totalAnnual - 6000,
                boostedSavings,
                currentPortfolio,
                currentAge,
                targetRetirementAge,
              );
              const diff = fireImpact.yearsToFIRE - boosted.yearsToFIRE;
              return isFinite(diff) && diff > 0 ? `${diff.toFixed(1)} years earlier` : 'significantly earlier';
            })()}
          </strong>.
        </div>
      </div>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px 36px', maxWidth: 960, margin: '0 auto', background: COLORS.bgPage, minHeight: '100vh' }}>
      {/* Page header */}
      <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 4, letterSpacing: '-0.02em' }}>
        Expense Budget
      </h1>
      <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '0 0 28px 0' }}>
        Track spending, maximize savings, accelerate FIRE
      </p>

      {/* Pill tabs */}
      <div style={pillContainer}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={pillBtn(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'budget' && renderBudget()}
      {activeTab === 'breakdown' && renderBreakdown()}
      {activeTab === 'savings' && renderSavings()}
      {activeTab === 'fire' && renderFIRE()}
    </div>
  );
}
