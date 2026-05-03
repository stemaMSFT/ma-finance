import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency, formatPercent } from '../../utils/format';
import {
  runFIREAnalysis,
  compareFIREScenarios,
  FIRE_SPENDING_TIERS,
} from '../../engine/fire';
import type { FIREConfig, FIREVariant } from '../../engine/types';
import { STEVEN_COMP, SONYA_COMP, HSA_FAMILY_LIMIT } from '../../config/household';
import { calcHouseholdTaxes } from '../../engine/taxes';

// ── Color tokens ───────────────────────────────────────────────────
const COLORS = {
  fire: '#ef4444',
  coast: '#14b8a6',
  lean: '#3b82f6',
  regular: '#22c55e',
  chubby: '#f59e0b',
  fat: '#8b5cf6',
  accent: '#6c63ff',
  gray: '#94a3b8',
  bgCard: '#ffffff',
  bgPage: '#f8fafc',
  border: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
};

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
  axisTick: { fontSize: 11, fill: COLORS.textMuted },
};

// ── Tab configuration ──────────────────────────────────────────────
const TABS = [
  { key: 'dashboard', label: '🔥 FIRE Dashboard' },
  { key: 'timeline', label: '📈 Timeline' },
  { key: 'coast', label: '🏖️ Coast FIRE' },
  { key: 'settings', label: '⚙️ Settings' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ── FIRE variant helpers ───────────────────────────────────────────
type StandardVariant = Exclude<FIREVariant, 'custom'> | 'actual';

const VARIANT_COLORS: Record<StandardVariant, string> = {
  lean: COLORS.lean,
  regular: COLORS.regular,
  chubby: COLORS.chubby,
  fat: COLORS.fat,
  actual: '#10b981',
};

const VARIANT_EMOJIS: Record<StandardVariant, string> = {
  lean: '🎒',
  regular: '🏠',
  chubby: '✨',
  fat: '👑',
  actual: '📊',
};

// ── Tooltip style (glassmorphism) ──────────────────────────────────
const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

// ── Savings-rate gauge ─────────────────────────────────────────────
function SavingsGauge({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.round(rate * 100));
  const color = pct >= 50 ? COLORS.regular : pct >= 30 ? COLORS.chubby : COLORS.fire;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference * 0.75;
  return (
    <div style={{ position: 'relative', width: 160, height: 140, margin: '0 auto', flexShrink: 0 }}>
      <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-225deg)' }}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', top: '45%', left: '50%',
        transform: 'translate(-50%, -50%)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{pct}%</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>Savings Rate</div>
      </div>
    </div>
  );
}

// ── Slider row ─────────────────────────────────────────────────────
function SliderRow({
  label, value, min, max, step = 1, format, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: COLORS.accent }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>{format(min)}</span>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>{format(max)}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function RetirementPanel() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Settings state (Steven's defaults)
  const [currentAge, setCurrentAge] = useState(27);
  const [targetRetirementAge, setTargetRetirementAge] = useState(50);
  const [currentPortfolio, setCurrentPortfolio] = useState(95_000);
  const [annualSavings, setAnnualSavings] = useState(50_000);
  const [annualExpenses, setAnnualExpenses] = useState(130_000); // chubby-specific override
  const [swr, setSwr] = useState(3.5);       // displayed as percent
  const [growthRate, setGrowthRate] = useState(7); // displayed as percent
  const [variant, setVariant] = useState<StandardVariant>('chubby');

  // Actual expense data from imports
  const [actualAnnualExpenses, setActualAnnualExpenses] = useState<number | null>(null);
  const [actualAnnualSavings, setActualAnnualSavings] = useState<number | null>(null);
  const [actualMonthCount, setActualMonthCount] = useState(0);
  const [hasActualData, setHasActualData] = useState(false);

  useEffect(() => {
    fetch('/api/expenses')
      .then((r) => r.json())
      .then((data: { imported: boolean; transactions: { date: string; amount: number; transactionType: string; mappedCategory: string }[] }) => {
        if (!data.imported || !data.transactions?.length) return;
        const filtered = data.transactions.filter(
          (t) => t.transactionType === 'expense' && t.date >= '2025-05'
        );
        if (filtered.length === 0) return;

        const months = new Set(filtered.map((t) => t.date.slice(0, 7)));
        const monthCount = Math.max(months.size, 1);
        const totalExpenses = filtered.reduce((s, t) => s + t.amount, 0);
        const annualExp = (totalExpenses / monthCount) * 12;

        // Compute take-home pay using shared tax module
        const householdTaxes = calcHouseholdTaxes(STEVEN_COMP, SONYA_COMP);
        const takeHome = householdTaxes.takeHome;
        const savings = takeHome - annualExp;

        setActualAnnualExpenses(Math.round(annualExp));
        setActualAnnualSavings(Math.round(savings));
        setActualMonthCount(monthCount);
        setHasActualData(true);

        // Update defaults with actual values
        setAnnualExpenses(Math.round(annualExp));
        setAnnualSavings(Math.round(Math.max(0, savings)));
      })
      .catch(() => {});
  }, []);

  // ── Engine config ──────────────────────────────────────────────
  const config = useMemo<FIREConfig>(() => ({
    currentAge,
    targetRetirementAge,
    currentPortfolio,
    annualSavings,
    annualExpenses: (variant === 'chubby' || variant === 'actual') ? annualExpenses : FIRE_SPENDING_TIERS[variant as Exclude<FIREVariant, 'custom'>].annualExpenses,
    safeWithdrawalRate: swr / 100,
    expectedGrowthRate: growthRate / 100,
    variant: variant === 'actual' ? 'custom' : variant,
  }), [currentAge, targetRetirementAge, currentPortfolio, annualSavings, annualExpenses, swr, growthRate, variant]);

  const result = useMemo(() => runFIREAnalysis(config), [config]);
  const scenarios = useMemo(() => compareFIREScenarios(config), [config]);

  const coastProgress = useMemo(() => {
    if (result.coastFIRENumber <= 0) return 100;
    return Math.min(100, Math.round((currentPortfolio / result.coastFIRENumber) * 100));
  }, [currentPortfolio, result.coastFIRENumber]);

  const variantColor = VARIANT_COLORS[variant];
  const variantTier = variant === 'actual'
    ? { label: 'Actual Spending', annualExpenses, description: `Based on ${actualMonthCount} months of imported data` }
    : FIRE_SPENDING_TIERS[variant as Exclude<FIREVariant, 'custom'>];

  return (
    <div className="scenario-panel" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            🔥 FIRE Planning
          </h2>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px',
            borderRadius: 20, background: variantColor + '20', color: variantColor,
            fontSize: 12, fontWeight: 600, border: `1px solid ${variantColor}40`,
          }}>
            {VARIANT_EMOJIS[variant]} {variantTier.label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
          Financial Independence, Retire Early — portfolio growth, Coast FIRE threshold,
          and your path to {variantTier.label} by age {targetRetirementAge}.
        </p>
      </div>

      {/* Pill tab bar */}
      <div style={{
        display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 12, padding: 4,
        marginBottom: 24,
      }}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                background: active ? '#fff' : 'transparent',
                color: active ? COLORS.accent : COLORS.textSecondary,
                fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── FIRE Dashboard Tab ─────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div style={S.sectionGap}>
          {/* Hero card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 18, padding: '36px 40px', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 32, flexWrap: 'wrap',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500 }}>
                {variantTier.label} Target · {formatPercent(swr, 1)} SWR
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>
                {formatCurrency(result.fireNumber, true)}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                FIRE Number · {formatCurrency(config.annualExpenses)}/yr expenses
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Coast FIRE Number</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(result.coastFIRENumber, true)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>FIRE Age</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {isFinite(result.fireAge) ? `Age ${Math.round(result.fireAge)}` : '∞'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Coast FIRE Age</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.coast }}>Age {result.coastFIREAge}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Years to FIRE</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {isFinite(result.yearsToFIRE) ? `${Math.round(result.yearsToFIRE)} yrs` : '∞'}
                  </div>
                </div>
              </div>
            </div>
            <SavingsGauge rate={result.savingsRate} />
          </div>

          {/* 4-variant comparison grid */}
          <div>
            <div style={{ ...S.cardTitle, marginBottom: 14 }}>FIRE Variant Comparison</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {scenarios.map((s) => {
                const v = s.variant as StandardVariant;
                const color = VARIANT_COLORS[v];
                const emoji = VARIANT_EMOJIS[v];
                const tier = FIRE_SPENDING_TIERS[v as Exclude<FIREVariant, 'custom'>];
                const isSelected = v === variant;
                return (
                  <div key={v} style={{
                    ...S.card,
                    borderLeft: `4px solid ${color}`,
                    position: 'relative',
                    outline: isSelected ? `2px solid ${color}` : 'none',
                    outlineOffset: 2,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s ease',
                  }} onClick={() => setVariant(v)}>
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: -10, right: 12,
                        background: color, color: '#fff', fontSize: 10, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5,
                      }}>
                        SELECTED
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 20 }}>{emoji}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? color : COLORS.textPrimary }}>{tier.label}</div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted }}>{formatCurrency(s.annualExpenses)}/yr</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: -0.5, marginBottom: 4 }}>
                      {formatCurrency(s.fireNumber, true)}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 8 }}>FIRE Number</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      Coast: {formatCurrency(s.coastFIRENumber, true)}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      FIRE Age: {isFinite(s.fireAge) ? `Age ${Math.round(s.fireAge)}` : '∞'}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      {isFinite(s.yearsToFIRE) ? `${Math.round(s.yearsToFIRE)} years away` : 'Not achievable'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Savings rate benchmarks */}
          <div style={S.card}>
            <div style={S.cardTitle}>💡 Savings Rate Context</div>
            <p style={S.cardSub}>How your {formatPercent(result.savingsRate * 100, 0)} savings rate compares to FIRE benchmarks</p>
            {[
              { label: 'Lean FIRE pace', rate: 0.25, color: COLORS.lean },
              { label: 'Regular FIRE pace', rate: 0.40, color: COLORS.regular },
              { label: 'Chubby / Fat FIRE pace', rate: 0.55, color: COLORS.chubby },
              { label: 'Your savings rate', rate: result.savingsRate, color: COLORS.fire },
            ].map((row) => (
              <div key={row.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.color }}>{formatPercent(row.rate * 100, 0)}</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(100, row.rate * 100)}%`,
                    background: row.color, borderRadius: 3, transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Timeline Tab ────────────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div style={S.sectionGap}>
          <div style={S.card}>
            <div style={S.cardTitle}>Portfolio Growth vs Coast FIRE Threshold</div>
            <p style={S.cardSub}>
              Your portfolio (green) must cross the coast line (teal) — after that, compounding alone carries
              you to the FIRE Number (red line) without new contributions.
            </p>
            <ResponsiveContainer width="100%" height={420}>
              <AreaChart data={result.portfolioTimeline} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.regular} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.regular} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCoast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.coast} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.coast} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false}
                  label={{ value: 'Age', position: 'insideBottomRight', offset: -10, style: { fontSize: 11, fill: COLORS.textMuted } }} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={68} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelFormatter={(label) => `Age ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" iconSize={8} />
                <ReferenceLine
                  y={result.fireNumber}
                  stroke={COLORS.fire}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{ value: `FIRE: ${formatCurrency(result.fireNumber, true)}`, position: 'insideTopRight', style: { fontSize: 10, fill: COLORS.fire } }}
                />
                <ReferenceLine
                  x={result.coastFIREAge}
                  stroke={COLORS.coast}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{ value: `Coast Age ${result.coastFIREAge}`, position: 'top', style: { fontSize: 10, fill: COLORS.coast } }}
                />
                {isFinite(result.fireAge) && (
                  <ReferenceLine
                    x={Math.round(result.fireAge)}
                    stroke={COLORS.fire}
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{ value: `FIRE Age ${Math.round(result.fireAge)}`, position: 'top', style: { fontSize: 10, fill: COLORS.fire } }}
                  />
                )}
                <Area type="monotone" dataKey="portfolio" name="Portfolio" stroke={COLORS.regular} fill="url(#gradPortfolio)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="coastThreshold" name="Coast Threshold" stroke={COLORS.coast} fill="url(#gradCoast)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Milestone cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {result.milestones.map((m) => (
              <div key={m.label} style={{ ...S.card, padding: '18px 20px', borderLeft: `3px solid ${m.label.startsWith('Coast') ? COLORS.coast : COLORS.fire}` }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: -0.5 }}>
                  {m.age < 999 ? `Age ${m.age}` : '∞'}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                  {formatCurrency(m.amount, true)}
                </div>
              </div>
            ))}
          </div>

          {/* 25× Rule context */}
          <div style={{ ...S.card, borderLeft: `3px solid ${COLORS.accent}` }}>
            <div style={S.cardTitle}>📐 The 25× Rule</div>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 }}>
              The 4% Safe Withdrawal Rate (Trinity Study) implies a <strong>25× multiplier</strong>: your FIRE Number
              equals annual expenses × 25. At {formatPercent(swr, 1)} SWR, the multiplier is{' '}
              <strong>{(1 / (swr / 100)).toFixed(1)}×</strong>, giving a FIRE Number of{' '}
              <strong>{formatCurrency(result.fireNumber, true)}</strong> for{' '}
              {formatCurrency(config.annualExpenses)}/yr in expenses.
            </p>
          </div>
        </div>
      )}

      {/* ── Coast FIRE Tab ──────────────────────────────────────────── */}
      {activeTab === 'coast' && (
        <div style={S.sectionGap}>
          {/* Hero */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.coast}22 0%, ${COLORS.coast}08 100%)`,
            border: `2px solid ${COLORS.coast}40`,
            borderRadius: 18, padding: '32px 36px',
          }}>
            <div style={{ fontSize: 12, color: COLORS.coast, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              🏖️ Coast FIRE Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 42, fontWeight: 800, color: COLORS.coast, letterSpacing: -1.5 }}>
                  {formatCurrency(result.coastFIRENumber, true)}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>Coast FIRE Number (today's dollars)</div>
              </div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Current Portfolio</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(currentPortfolio, true)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Coast FIRE Age</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.coast }}>Age {result.coastFIREAge}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Years to Coast</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>
                    {result.yearsToCoastFIRE > 0
                      ? `${Math.round(result.yearsToCoastFIRE)} yrs`
                      : '✅ Already coasting!'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={S.card}>
            <div style={S.cardTitle}>Progress to Coast FIRE</div>
            <p style={S.cardSub}>Current portfolio as a percentage of Coast FIRE Number</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{formatCurrency(currentPortfolio)} current</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.coast }}>{coastProgress}%</span>
            </div>
            <div style={{ height: 16, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${coastProgress}%`,
                background: coastProgress >= 100
                  ? `linear-gradient(90deg, ${COLORS.coast}, ${COLORS.regular})`
                  : `linear-gradient(90deg, ${COLORS.coast}80, ${COLORS.coast})`,
                borderRadius: 8,
                transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>$0</span>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                Coast FIRE: {formatCurrency(result.coastFIRENumber, true)}
              </span>
            </div>
            {coastProgress < 100 && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  Still need:{' '}
                  <strong style={{ color: COLORS.textPrimary }}>
                    {formatCurrency(result.coastFIRENumber - currentPortfolio, true)}
                  </strong>{' '}
                  more to reach Coast FIRE
                </span>
              </div>
            )}
          </div>

          {/* Explainer */}
          <div style={{ ...S.card, borderLeft: `4px solid ${COLORS.coast}` }}>
            <div style={S.cardTitle}>🌊 What is Coast FIRE?</div>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7, margin: '0 0 16px 0' }}>
              Coast FIRE is the portfolio value you need <strong>today</strong> such that — even if you never save
              another dollar — compounding alone grows it to{' '}
              <strong>{formatCurrency(result.fireNumber, true)}</strong> by age {targetRetirementAge}.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>Before Coast FIRE</div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6 }}>
                  Keep saving {formatCurrency(annualSavings)}/yr while the portfolio compounds toward your FIRE Number.
                </div>
              </div>
              <div style={{ background: `${COLORS.coast}12`, borderRadius: 10, padding: '14px 16px', border: `1px solid ${COLORS.coast}30` }}>
                <div style={{ fontSize: 12, color: COLORS.coast, marginBottom: 4, fontWeight: 600 }}>After Coast FIRE ✅</div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6 }}>
                  Contributions become optional. Take a lower-stress role, travel, or pursue passion projects —
                  let compounding do the rest.
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: 13, color: '#166534' }}>
                📐 Formula: Coast FIRE = {formatCurrency(result.fireNumber, true)} ÷ (1 + {formatPercent(growthRate, 0)})^
                {targetRetirementAge - currentAge} = <strong>{formatCurrency(result.coastFIRENumber, true)}</strong>
              </span>
            </div>
          </div>

          {/* Coast threshold chart */}
          <div style={S.card}>
            <div style={S.cardTitle}>Coast Threshold Curve</div>
            <p style={S.cardSub}>
              The coast threshold declines as you approach retirement — your portfolio only needs to stay above it.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={result.portfolioTimeline} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradCoastSmall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.coast} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.coast} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPortSmall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.regular} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.regular} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={68} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelFormatter={(label) => `Age ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="portfolio" name="Your Portfolio" stroke={COLORS.regular} fill="url(#gradPortSmall)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="coastThreshold" name="Coast Threshold" stroke={COLORS.coast} fill="url(#gradCoastSmall)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Settings Tab ────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div style={S.sectionGap}>
          {/* Profile */}
          <div style={S.card}>
            <div style={S.cardTitle}>👤 Your Profile</div>
            <p style={S.cardSub}>Age and retirement horizon</p>
            <SliderRow
              label="Current Age"
              value={currentAge} min={18} max={70} step={1}
              format={(v) => `${v} yrs`}
              onChange={setCurrentAge}
            />
            <SliderRow
              label="Target Retirement Age"
              value={targetRetirementAge} min={currentAge + 1} max={80} step={1}
              format={(v) => `${v} yrs`}
              onChange={setTargetRetirementAge}
            />
          </div>

          {/* Portfolio & Savings */}
          <div style={S.card}>
            <div style={S.cardTitle}>💰 Portfolio &amp; Savings</div>
            <p style={S.cardSub}>Current invested assets and total annual contributions (401k + match + brokerage)</p>
            <SliderRow
              label="Current Portfolio"
              value={currentPortfolio} min={0} max={1_000_000} step={5_000}
              format={(v) => formatCurrency(v, true)}
              onChange={setCurrentPortfolio}
            />
            <SliderRow
              label="Annual Savings"
              value={annualSavings} min={0} max={200_000} step={1_000}
              format={(v) => formatCurrency(v, true)}
              onChange={setAnnualSavings}
            />
            {hasActualData && (
              <div style={{ fontSize: 11, color: '#14b8a6', marginTop: -10, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                📊 Based on actual data (May 2025+, {actualMonthCount} month{actualMonthCount !== 1 ? 's' : ''})
              </div>
            )}
          </div>

          {/* FIRE Variant selector */}
          <div style={S.card}>
            <div style={S.cardTitle}>🔥 FIRE Variant</div>
            <p style={S.cardSub}>Select your target lifestyle tier — determines annual expenses and FIRE Number</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
              {(Object.keys(FIRE_SPENDING_TIERS) as Exclude<FIREVariant, 'custom'>[]).map((v) => {
                const active = variant === v;
                const color = VARIANT_COLORS[v];
                const tier = FIRE_SPENDING_TIERS[v];
                return (
                  <button key={v} onClick={() => setVariant(v)} style={{
                    padding: '12px 16px', borderRadius: 10, border: '2px solid',
                    borderColor: active ? color : COLORS.border,
                    background: active ? color + '12' : '#fff',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: active ? color : COLORS.textPrimary }}>
                      {VARIANT_EMOJIS[v]} {tier.label}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{tier.description}</div>
                  </button>
                );
              })}
              {/* Actual variant button */}
              <button onClick={() => setVariant('actual')} style={{
                padding: '12px 16px', borderRadius: 10, border: '2px solid',
                borderColor: variant === 'actual' ? VARIANT_COLORS.actual : COLORS.border,
                background: variant === 'actual' ? VARIANT_COLORS.actual + '12' : '#fff',
                cursor: hasActualData ? 'pointer' : 'not-allowed',
                textAlign: 'left', transition: 'all 0.15s ease',
                opacity: hasActualData ? 1 : 0.5,
                gridColumn: '1 / -1',
              }} disabled={!hasActualData}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: variant === 'actual' ? VARIANT_COLORS.actual : COLORS.textPrimary }}>
                    📊 Actual Spending
                  </div>
                  {hasActualData && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: '#dcfce7', color: '#166534',
                    }}>
                      LIVE DATA
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                  {hasActualData
                    ? `${formatCurrency(actualAnnualExpenses ?? 0)}/yr — from ${actualMonthCount} months of imported transactions`
                    : 'Import transactions to enable actual-based projections'}
                </div>
              </button>
            </div>
            {(variant === 'chubby' || variant === 'actual') && (
              <>
                <SliderRow
                  label={variant === 'actual' ? 'Annual Expenses (Actual — adjustable)' : 'Annual Expenses (Chubby FIRE — adjustable)'}
                  value={annualExpenses} min={50_000} max={250_000} step={1_000}
                  format={(v) => formatCurrency(v, true)}
                  onChange={setAnnualExpenses}
                />
                {variant === 'actual' && hasActualData && (
                  <div style={{ fontSize: 11, color: '#14b8a6', marginTop: -10, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    📊 Based on actual data (May 2025+, {actualMonthCount} month{actualMonthCount !== 1 ? 's' : ''})
                  </div>
                )}
              </>
            )}
          </div>

          {/* Financial Assumptions */}
          <div style={S.card}>
            <div style={S.cardTitle}>📊 Financial Assumptions</div>
            <p style={S.cardSub}>Adjust for sensitivity analysis</p>
            <SliderRow
              label="Expected Growth Rate (nominal)"
              value={growthRate} min={3} max={12} step={0.25}
              format={(v) => `${v.toFixed(2)}%`}
              onChange={setGrowthRate}
            />
            <SliderRow
              label="Safe Withdrawal Rate (SWR)"
              value={swr} min={2} max={6} step={0.25}
              format={(v) => `${v.toFixed(2)}%`}
              onChange={setSwr}
            />
            <div style={{ marginTop: 12, padding: '12px 16px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
                <strong>💡 Note:</strong> The 4% rule works historically for 30-year horizons. At {formatPercent(swr, 1)} SWR
                your FIRE Number is <strong>{formatCurrency(result.fireNumber, true)}</strong>. Lower SWR = more conservative = larger FIRE Number.
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ ...S.card, background: '#f8fafc' }}>
            <div style={S.cardTitle}>📋 Configuration Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 10, marginTop: 10 }}>
              {[
                { label: 'Current Age', value: `${currentAge} yrs` },
                { label: 'Retire At', value: `${targetRetirementAge} yrs` },
                { label: 'Years to Target', value: `${targetRetirementAge - currentAge} yrs` },
                { label: 'Current Portfolio', value: formatCurrency(currentPortfolio, true) },
                { label: 'Annual Savings', value: formatCurrency(annualSavings, true) },
                { label: 'Annual Expenses', value: formatCurrency(config.annualExpenses, true) },
                { label: 'FIRE Number', value: formatCurrency(result.fireNumber, true) },
                { label: 'SWR', value: `${swr}%` },
                { label: 'Growth Rate', value: `${growthRate}%` },
              ].map((item) => (
                <div key={item.label} style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, marginTop: 2 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
