import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import CurrencyInput from '../shared/CurrencyInput';
import PercentInput from '../shared/PercentInput';
import NumberInput from '../shared/NumberInput';
import InputGroup from '../shared/InputGroup';
import { monthlyPayment, futureValue } from '../../engine/projections';
import { compareRenovationVsSave } from '../../engine/housing';
import type { RenovationInput } from '../../engine/types';
import { formatCurrency, formatPercent } from '../../utils/format';

// ── Color tokens ───────────────────────────────────────────────────
const COLORS = {
  renovate: '#22c55e',
  invest: '#6c63ff',
  neutral: '#3b82f6',
  accent: '#6c63ff',
  orange: '#f59e0b',
  red: '#ef4444',
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

// ── Tab config ─────────────────────────────────────────────────────
type RenovTab = 'overview' | 'analysis' | 'projection' | 'settings';

const TABS: { key: RenovTab; label: string }[] = [
  { key: 'overview', label: '🏠 Overview' },
  { key: 'analysis', label: '📊 Analysis' },
  { key: 'projection', label: '📈 Projection' },
  { key: 'settings', label: '⚙️ Settings' },
];

// ── Financing type ─────────────────────────────────────────────────
type FinancingType = 'cash' | 'heloc' | 'personal_loan';

const FINANCING_OPTIONS: { key: FinancingType; icon: string; label: string; sub: string }[] = [
  { key: 'cash', icon: '💵', label: 'Cash', sub: 'No interest, immediate impact' },
  { key: 'heloc', icon: '🏠', label: 'HELOC', sub: 'Tax-deductible interest, lower rate' },
  { key: 'personal_loan', icon: '🏦', label: 'Personal Loan', sub: 'No collateral required' },
];

// ── Glassmorphism tooltip ──────────────────────────────────────────
const TooltipStyle = {
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

// ── Main component ─────────────────────────────────────────────────
export default function RenovationPanel() {
  const [activeTab, setActiveTab] = useState<RenovTab>('overview');

  // Inputs
  const [projectName, setProjectName] = useState('Kitchen Remodel');
  const [projectCost, setProjectCost] = useState(85_000);
  const [expectedValueAdd, setExpectedValueAdd] = useState(60_000);
  const [financing, setFinancing] = useState<FinancingType>('cash');
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanTermYears, setLoanTermYears] = useState(10);
  const [urgency, setUrgency] = useState(0);
  const [altReturn, setAltReturn] = useState(7);
  const [projectionYears, setProjectionYears] = useState(10);

  const calc = useMemo(() => {
    const rateDecimal = loanRate / 100;
    const altReturnDecimal = altReturn / 100;
    const isFinanced = financing !== 'cash';

    // Renovation cost analysis
    const loanMonthly = isFinanced
      ? monthlyPayment(projectCost, rateDecimal, loanTermYears)
      : 0;
    const totalLoanCost = isFinanced ? loanMonthly * loanTermYears * 12 : projectCost;
    const totalInterest = isFinanced ? totalLoanCost - projectCost : 0;
    const renovationROI =
      projectCost > 0 ? ((expectedValueAdd - projectCost) / projectCost) * 100 : 0;

    // Financing scenarios
    const cashMonthly = 0;
    const cashTotalCost = projectCost;
    const cashInterest = 0;

    const helocRate = 0.085;
    const helocMonthly = monthlyPayment(projectCost, helocRate, 10);
    const helocTotalCost = helocMonthly * 10 * 12;
    const helocInterest = helocTotalCost - projectCost;

    const plRate = 0.12;
    const plMonthly = monthlyPayment(projectCost, plRate, 5);
    const plTotalCost = plMonthly * 5 * 12;
    const plInterest = plTotalCost - projectCost;

    // Opportunity cost: what if you invested the money instead?
    const investmentGrowth = futureValue(projectCost, altReturnDecimal, projectionYears);
    const opportunityCost = investmentGrowth - projectCost;

    // Net benefit of renovating vs investing
    const renovateNetValue = expectedValueAdd - (isFinanced ? totalInterest : 0);
    const investNetValue = investmentGrowth;
    const netBenefit = renovateNetValue - investNetValue;

    // Year-by-year comparison
    const timeline: { year: number; renovate: number; invest: number }[] = [];
    let breakEvenYear: number | null = null;
    for (let y = 0; y <= projectionYears; y++) {
      const investVal = futureValue(projectCost, altReturnDecimal, y);
      const renovateVal =
        expectedValueAdd * Math.pow(1.03, y) -
        (isFinanced ? Math.min(loanMonthly * 12 * y, totalLoanCost) - projectCost : 0);
      timeline.push({
        year: y,
        renovate: Math.round(renovateVal),
        invest: Math.round(investVal),
      });
      if (
        breakEvenYear === null &&
        y > 0 &&
        Math.round(renovateVal) >= Math.round(investVal) &&
        netBenefit < 0
      ) {
        breakEvenYear = y;
      }
    }

    // Annual cost breakdown for stacked bar (interest vs principal by year)
    const annualBreakdown: { year: string; principal: number; interest: number }[] = [];
    if (isFinanced) {
      let balance = projectCost;
      const monthRate = rateDecimal / 12;
      for (let y = 1; y <= Math.min(loanTermYears, projectionYears); y++) {
        let yearInterest = 0;
        let yearPrincipal = 0;
        for (let m = 0; m < 12; m++) {
          const intPart = balance * monthRate;
          const prinPart = loanMonthly - intPart;
          yearInterest += intPart;
          yearPrincipal += prinPart;
          balance = Math.max(0, balance - prinPart);
        }
        annualBreakdown.push({
          year: `Yr ${y}`,
          principal: Math.round(yearPrincipal),
          interest: Math.round(yearInterest),
        });
      }
    }

    const renovationInput: RenovationInput = {
      projectName,
      projectCost,
      expectedValueAdd,
      financing,
      loanRate: rateDecimal,
      loanTermYears,
      urgency,
      alternativeSavingsReturn: altReturnDecimal,
    };
    const engineResult = compareRenovationVsSave(renovationInput, altReturnDecimal);

    return {
      loanMonthly,
      totalLoanCost,
      totalInterest,
      renovationROI,
      investmentGrowth,
      opportunityCost,
      renovateNetValue,
      investNetValue,
      netBenefit,
      timeline,
      breakEvenYear,
      annualBreakdown,
      isFinanced,
      engineResult,
      cashMonthly,
      cashTotalCost,
      cashInterest,
      helocMonthly,
      helocTotalCost,
      helocInterest,
      plMonthly,
      plTotalCost,
      plInterest,
    };
  }, [
    projectName, projectCost, expectedValueAdd, financing,
    loanRate, loanTermYears, urgency, altReturn, projectionYears,
  ]);

  const renovWins = calc.netBenefit >= 0;

  return (
    <div
      className="scenario-panel"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 22, fontWeight: 700, color: COLORS.textPrimary,
          margin: '0 0 4px 0', letterSpacing: '-0.02em',
        }}>
          🔨 Renovate vs. Save
        </h2>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
          Should you renovate now or invest the cash? Compare renovation ROI against market
          returns over your time horizon.
        </p>
      </div>

      {/* Pill tab bar */}
      <div style={{
        display: 'flex', gap: 2, background: '#f1f5f9',
        borderRadius: 12, padding: 4, marginBottom: 24,
      }}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                background: active ? '#fff' : 'transparent',
                color: active ? COLORS.accent : COLORS.textSecondary,
                fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={S.sectionGap}>

          {/* Hero card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 18, padding: '32px 36px', color: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{
              fontSize: 11, color: '#94a3b8', textTransform: 'uppercase',
              letterSpacing: 1.2, fontWeight: 500, marginBottom: 6,
            }}>
              {projectName}
            </div>
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>
              {formatCurrency(projectCost)}
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Value Add</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(expectedValueAdd, true)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>ROI</div>
                <div style={{
                  fontSize: 20, fontWeight: 700,
                  color: calc.renovationROI >= 0 ? COLORS.renovate : COLORS.red,
                }}>
                  {formatPercent(calc.renovationROI, 1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Net Benefit</div>
                <div style={{
                  fontSize: 20, fontWeight: 700,
                  color: renovWins ? COLORS.renovate : COLORS.red,
                }}>
                  {renovWins ? '+' : ''}{formatCurrency(calc.netBenefit, true)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Verdict</div>
                <div style={{
                  fontSize: 16, fontWeight: 700, marginTop: 2,
                  color: renovWins ? COLORS.renovate : '#f87171',
                  background: renovWins ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  padding: '2px 10px', borderRadius: 20, display: 'inline-block',
                }}>
                  {renovWins ? '🏠 Renovate Wins' : '📈 Invest Wins'}
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-side scenario cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Renovate card */}
            <div style={{
              ...S.card,
              borderLeft: `4px solid ${COLORS.renovate}`,
              background: renovWins ? 'rgba(34,197,94,0.04)' : COLORS.bgCard,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🏠</span>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>Renovate</div>
                {renovWins && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                    color: COLORS.renovate, background: 'rgba(34,197,94,0.12)',
                    padding: '2px 8px', borderRadius: 20,
                  }}>
                    WINNER
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Project Cost', value: formatCurrency(projectCost) },
                  { label: 'Value Added', value: formatCurrency(expectedValueAdd) },
                  {
                    label: 'Financing Cost',
                    value: calc.isFinanced ? formatCurrency(calc.totalInterest) : 'None',
                  },
                  {
                    label: `Net Gain (${projectionYears}yr)`,
                    value: formatCurrency(calc.renovateNetValue),
                    bold: true,
                    color: COLORS.renovate,
                  },
                ].map((row) => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 13, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8,
                  }}>
                    <span style={{ color: COLORS.textSecondary }}>{row.label}</span>
                    <span style={{
                      fontWeight: row.bold ? 700 : 500,
                      color: row.color ?? COLORS.textPrimary,
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invest card */}
            <div style={{
              ...S.card,
              borderLeft: `4px solid ${COLORS.invest}`,
              background: !renovWins ? 'rgba(108,99,255,0.04)' : COLORS.bgCard,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>📈</span>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>Invest Instead</div>
                {!renovWins && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                    color: COLORS.invest, background: 'rgba(108,99,255,0.12)',
                    padding: '2px 8px', borderRadius: 20,
                  }}>
                    WINNER
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Capital Invested', value: formatCurrency(projectCost) },
                  { label: 'Alt Return Rate', value: formatPercent(altReturn, 1) + '/yr' },
                  { label: 'Opportunity Cost', value: formatCurrency(calc.opportunityCost) },
                  {
                    label: `Portfolio Value (${projectionYears}yr)`,
                    value: formatCurrency(calc.investmentGrowth),
                    bold: true,
                    color: COLORS.invest,
                  },
                ].map((row) => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 13, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8,
                  }}>
                    <span style={{ color: COLORS.textSecondary }}>{row.label}</span>
                    <span style={{
                      fontWeight: row.bold ? 700 : 500,
                      color: row.color ?? COLORS.textPrimary,
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Net benefit prominently */}
          <div style={{
            ...S.card,
            background: renovWins
              ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)',
            borderColor: renovWins ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            textAlign: 'center',
            padding: '28px 36px',
          }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
              Net Benefit of {renovWins ? 'Renovating' : 'Investing'} over {projectionYears} years
            </div>
            <div style={{
              fontSize: 42, fontWeight: 800, letterSpacing: -2,
              color: renovWins ? COLORS.renovate : COLORS.red,
            }}>
              {formatCurrency(Math.abs(calc.netBenefit))}
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 8 }}>
              {renovWins
                ? `Renovating leaves you ${formatCurrency(Math.abs(calc.netBenefit), true)} better off than investing`
                : `Investing leaves you ${formatCurrency(Math.abs(calc.netBenefit), true)} better off than renovating`}
            </div>
          </div>
        </div>
      )}

      {/* ── Analysis Tab ──────────────────────────────────────────── */}
      {activeTab === 'analysis' && (
        <div style={S.sectionGap}>

          {/* Financing comparison table */}
          <div style={S.card}>
            <div style={S.cardTitle}>Financing Comparison</div>
            <p style={S.cardSub}>Side-by-side cost of financing {formatCurrency(projectCost)} three ways</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    {['Method', 'Monthly Payment', 'Total Cost', 'Total Interest'].map((h) => (
                      <th key={h} style={{
                        padding: '10px 12px', textAlign: h === 'Method' ? 'left' : 'right',
                        fontSize: 11, fontWeight: 600, color: COLORS.textMuted,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      icon: '💵', label: 'Cash',
                      monthly: calc.cashMonthly,
                      total: calc.cashTotalCost,
                      interest: calc.cashInterest,
                      active: financing === 'cash',
                    },
                    {
                      icon: '🏠', label: 'HELOC (8.5%, 10yr)',
                      monthly: calc.helocMonthly,
                      total: calc.helocTotalCost,
                      interest: calc.helocInterest,
                      active: financing === 'heloc',
                    },
                    {
                      icon: '🏦', label: 'Personal Loan (12%, 5yr)',
                      monthly: calc.plMonthly,
                      total: calc.plTotalCost,
                      interest: calc.plInterest,
                      active: financing === 'personal_loan',
                    },
                  ].map((row) => (
                    <tr
                      key={row.label}
                      style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        background: row.active ? 'rgba(108,99,255,0.05)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '14px 12px', color: COLORS.textPrimary, fontWeight: row.active ? 700 : 400 }}>
                        <span style={{ marginRight: 6 }}>{row.icon}</span>
                        {row.label}
                        {row.active && (
                          <span style={{
                            marginLeft: 8, fontSize: 10, color: COLORS.accent,
                            background: 'rgba(108,99,255,0.12)', padding: '1px 7px', borderRadius: 20, fontWeight: 600,
                          }}>
                            selected
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', color: COLORS.textPrimary, fontWeight: 500 }}>
                        {row.monthly > 0 ? formatCurrency(row.monthly) : '—'}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', color: COLORS.textPrimary, fontWeight: 500 }}>
                        {formatCurrency(row.total)}
                      </td>
                      <td style={{
                        padding: '14px 12px', textAlign: 'right', fontWeight: 500,
                        color: row.interest > 0 ? COLORS.red : COLORS.renovate,
                      }}>
                        {row.interest > 0 ? formatCurrency(row.interest) : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROI calculation card */}
          <div style={S.card}>
            <div style={S.cardTitle}>ROI Calculation</div>
            <p style={S.cardSub}>How the renovation stacks up on return</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              {[
                {
                  label: 'Project Cost', value: formatCurrency(projectCost),
                  accent: COLORS.neutral, sub: 'total investment',
                },
                {
                  label: 'Value Add', value: formatCurrency(expectedValueAdd),
                  accent: COLORS.renovate, sub: 'home value increase',
                },
                {
                  label: 'Gross ROI', value: formatPercent(calc.renovationROI, 1),
                  accent: calc.renovationROI >= 0 ? COLORS.renovate : COLORS.red,
                  sub: 'value add vs cost',
                },
                {
                  label: 'Net After Financing',
                  value: formatCurrency(calc.renovateNetValue),
                  accent: COLORS.accent,
                  sub: calc.isFinanced ? `incl. ${formatCurrency(calc.totalInterest, true)} interest` : 'no financing cost',
                },
              ].map((m) => (
                <div key={m.label} style={{
                  ...S.card, borderLeft: `3px solid ${m.accent}`, padding: '18px 20px',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginTop: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {calc.renovationROI < 0 && (
              <div style={{
                marginTop: 16, padding: '14px 18px', background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
                fontSize: 13, color: COLORS.textPrimary, display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <strong>Negative ROI:</strong> This project costs {formatCurrency(projectCost)} but
                  only adds {formatCurrency(expectedValueAdd)} in value. You'd lose{' '}
                  {formatCurrency(projectCost - expectedValueAdd)} on the renovation itself before
                  considering opportunity cost.
                </div>
              </div>
            )}
          </div>

          {/* Opportunity cost card */}
          <div style={S.card}>
            <div style={S.cardTitle}>Opportunity Cost</div>
            <p style={S.cardSub}>
              What {formatCurrency(projectCost, true)} grows to at {formatPercent(altReturn, 1)}/yr
              over {projectionYears} years if invested instead
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              {[
                {
                  label: 'Capital Today', value: formatCurrency(projectCost),
                  accent: COLORS.neutral,
                },
                {
                  label: `Value in ${projectionYears}yr`, value: formatCurrency(calc.investmentGrowth),
                  accent: COLORS.invest,
                },
                {
                  label: 'Investment Gain', value: formatCurrency(calc.opportunityCost),
                  accent: COLORS.invest,
                },
              ].map((m) => (
                <div key={m.label} style={{
                  ...S.card, borderLeft: `3px solid ${m.accent}`, padding: '18px 20px',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Projection Tab ───────────────────────────────────────── */}
      {activeTab === 'projection' && (
        <div style={S.sectionGap}>

          {/* Dual-line value growth chart */}
          <div style={S.card}>
            <div style={S.cardTitle}>{projectionYears}-Year Value Growth Comparison</div>
            <p style={S.cardSub}>
              Renovation value (3% annual appreciation) vs investment portfolio growth
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={calc.timeline} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis
                  dataKey="year"
                  tickFormatter={(v: number) => `Yr ${v}`}
                  tick={S.axisTick}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v, true)}
                  tick={S.axisTick}
                  width={72}
                />
                <Tooltip
                  contentStyle={TooltipStyle}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(v: number) => `Year ${v}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
                {calc.breakEvenYear !== null && (
                  <ReferenceLine
                    x={calc.breakEvenYear}
                    stroke={COLORS.orange}
                    strokeDasharray="4 4"
                    label={{
                      value: `Break-even Yr ${calc.breakEvenYear}`,
                      position: 'top',
                      fontSize: 11,
                      fill: COLORS.orange,
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="renovate"
                  name="🏠 Renovate"
                  stroke={COLORS.renovate}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="invest"
                  name="📈 Invest"
                  stroke={COLORS.invest}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Shaded area chart */}
          <div style={S.card}>
            <div style={S.cardTitle}>Cumulative Value — Area View</div>
            <p style={S.cardSub}>Visualize the gap between renovation value and investment growth</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={calc.timeline} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorRenovate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.renovate} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={COLORS.renovate} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.invest} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={COLORS.invest} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis
                  dataKey="year"
                  tickFormatter={(v: number) => `Yr ${v}`}
                  tick={S.axisTick}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v, true)}
                  tick={S.axisTick}
                  width={72}
                />
                <Tooltip
                  contentStyle={TooltipStyle}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(v: number) => `Year ${v}`}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Area
                  type="monotone"
                  dataKey="renovate"
                  name="🏠 Renovate"
                  stroke={COLORS.renovate}
                  strokeWidth={2}
                  fill="url(#colorRenovate)"
                />
                <Area
                  type="monotone"
                  dataKey="invest"
                  name="📈 Invest"
                  stroke={COLORS.invest}
                  strokeWidth={2}
                  fill="url(#colorInvest)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stacked bar — annual cost breakdown (only if financed) */}
          {calc.isFinanced && calc.annualBreakdown.length > 0 && (
            <div style={S.card}>
              <div style={S.cardTitle}>Annual Payment Breakdown</div>
              <p style={S.cardSub}>Principal vs interest paid each year of the loan</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={calc.annualBreakdown}
                  margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="year" tick={S.axisTick} />
                  <YAxis
                    tickFormatter={(v: number) => formatCurrency(v, true)}
                    tick={S.axisTick}
                    width={72}
                  />
                  <Tooltip
                    contentStyle={TooltipStyle}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="principal" name="Principal" stackId="a" fill={COLORS.renovate} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="interest" name="Interest" stackId="a" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Settings Tab ─────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div style={S.sectionGap}>

          {/* Project details */}
          <InputGroup title="Project Details" helpText="Describe the renovation you're considering.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.textSecondary }}>
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Kitchen Remodel"
                style={{
                  padding: '10px 14px', borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 14, color: COLORS.textPrimary,
                  outline: 'none', background: '#fff',
                }}
              />
            </div>
            <CurrencyInput
              label="Project Cost"
              value={projectCost}
              onChange={setProjectCost}
              step={5000}
            />
            <CurrencyInput
              label="Expected Value Add"
              value={expectedValueAdd}
              onChange={setExpectedValueAdd}
              step={5000}
              helpText="How much the renovation increases your home value"
            />
            <NumberInput
              label="Urgency"
              value={urgency}
              onChange={setUrgency}
              min={0}
              max={10}
              suffix="yrs"
              helpText="0 = needed now, higher = can wait"
            />
          </InputGroup>

          {/* Financing type selector */}
          <div style={S.card}>
            <div style={S.cardTitle}>Financing Method</div>
            <p style={S.cardSub}>Cash pays upfront with no interest. HELOC or personal loan spreads the cost but adds interest.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {FINANCING_OPTIONS.map((opt) => {
                const active = financing === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setFinancing(opt.key)}
                    style={{
                      padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                      border: active
                        ? `2px solid ${COLORS.accent}`
                        : `1px solid ${COLORS.border}`,
                      background: active ? 'rgba(108,99,255,0.06)' : '#fff',
                      textAlign: 'left', transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                    <div style={{
                      fontSize: 14, fontWeight: active ? 700 : 600,
                      color: active ? COLORS.accent : COLORS.textPrimary,
                      marginBottom: 3,
                    }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>{opt.sub}</div>
                  </button>
                );
              })}
            </div>

            {financing !== 'cash' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <PercentInput
                  label="Loan Rate"
                  value={loanRate}
                  onChange={setLoanRate}
                  min={1}
                  max={25}
                  step={0.25}
                  decimals={2}
                  helpText={
                    financing === 'heloc'
                      ? 'HELOCs typically 7–10%'
                      : 'Personal loans typically 8–15%'
                  }
                />
                <NumberInput
                  label="Loan Term"
                  value={loanTermYears}
                  onChange={setLoanTermYears}
                  min={1}
                  max={30}
                  suffix="yrs"
                />
              </div>
            )}
          </div>

          {/* Investment alternative */}
          <InputGroup title="Investment Alternative">
            <PercentInput
              label="Alternative Return Rate"
              value={altReturn}
              onChange={setAltReturn}
              min={1}
              max={15}
              step={0.5}
              helpText="Expected return if you invest the cash instead"
            />
            <NumberInput
              label="Comparison Horizon"
              value={projectionYears}
              onChange={setProjectionYears}
              min={1}
              max={30}
              suffix="yrs"
              helpText="How far out to project both scenarios"
            />
          </InputGroup>

          {/* Live summary */}
          <div style={{
            ...S.card,
            background: renovWins
              ? 'rgba(34,197,94,0.04)'
              : 'rgba(108,99,255,0.04)',
            border: `1px solid ${renovWins ? 'rgba(34,197,94,0.25)' : 'rgba(108,99,255,0.25)'}`,
          }}>
            <div style={S.cardTitle}>Current Settings Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginTop: 12 }}>
              {[
                { label: 'Project', value: projectName },
                { label: 'Cost', value: formatCurrency(projectCost) },
                { label: 'Value Add', value: formatCurrency(expectedValueAdd) },
                { label: 'Financing', value: FINANCING_OPTIONS.find((o) => o.key === financing)?.label ?? financing },
                { label: 'Alt Return', value: formatPercent(altReturn, 1) + '/yr' },
                { label: 'Horizon', value: `${projectionYears} years` },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
