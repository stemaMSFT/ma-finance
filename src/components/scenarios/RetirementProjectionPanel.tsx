import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { formatCurrency, formatPercent } from '../../utils/format';
import {
  createDefaultConfig,
  projectRetirementTimeline,
  projectCompensationGrowth,
  calculateRetirementReadiness,
  runScenarioComparison,
  TRACK_PROMOTIONS,
  TRACK_MERIT_RATES,
  DEFAULT_TRACK_WEIGHTS,
} from '../../engine/projection';
import type {
  VelocityTrack,
  ProjectionConfig,
  YearlyProjection,
  CompYearProjection,
  RetirementReadiness,
  ScenarioComparison,
  SSClaimAge,
} from '../../engine/types';

// ── Color tokens ───────────────────────────────────────────────────
const COLORS = {
  conservative: '#3b82f6',
  base: '#22c55e',
  optimistic: '#8b5cf6',
  accent: '#6c63ff',
  teal: '#14b8a6',
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

// Shared style fragments
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

// ── Settings types ─────────────────────────────────────────────────
interface ProjectionSettings {
  retirementAge: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  ssClaimingAge: SSClaimAge;
  safeWithdrawalRate: number; // percentage, e.g. 4.0
  includePromotions: boolean;
  max401k: boolean;
  velocityTrack: VelocityTrack;
}

const DEFAULT_SETTINGS: ProjectionSettings = {
  retirementAge: 65,
  riskProfile: 'moderate',
  ssClaimingAge: 67,
  safeWithdrawalRate: 4.0,
  includePromotions: true,
  max401k: true,
  velocityTrack: 'fast',
};

// Map risk profile to market return override
function riskToReturn(risk: ProjectionSettings['riskProfile']): number | undefined {
  switch (risk) {
    case 'conservative': return 0.055;
    case 'aggressive': return 0.085;
    default: return undefined; // use glide path
  }
}

// Build a ProjectionConfig from UI settings
function buildConfig(settings: ProjectionSettings): ProjectionConfig {
  const promotions = settings.includePromotions
    ? TRACK_PROMOTIONS[settings.velocityTrack]
    : [];
  return createDefaultConfig({
    retirementAge: settings.retirementAge,
    ssClaimAge: settings.ssClaimingAge,
    safeWithdrawalRate: settings.safeWithdrawalRate / 100,
    velocityTrack: settings.velocityTrack,
    promotions,
    overrideMarketReturn: riskToReturn(settings.riskProfile),
    overrideMeritRate: settings.includePromotions
      ? TRACK_MERIT_RATES[settings.velocityTrack]
      : TRACK_MERIT_RATES.slow,
  });
}

// ── Chart tooltip ──────────────────────────────────────────────────
const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; fill?: string; dataKey?: string }[];
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)', border: `1px solid ${COLORS.border}`,
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      backdropFilter: 'blur(6px)', minWidth: 160,
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 6px 0' }}>Age {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ fontSize: 12, color: COLORS.textSecondary, margin: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill || COLORS.accent, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{p.name}</span>
          <strong style={{ color: COLORS.textPrimary }}>{formatCurrency(p.value, true)}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Tab types ──────────────────────────────────────────────────────
type ProjectionTab = 'overview' | 'projection' | 'compensation' | 'scenarios' | 'settings';

const TAB_CONFIG: { id: ProjectionTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'projection', label: 'Projection', icon: '📈' },
  { id: 'compensation', label: 'Compensation', icon: '💰' },
  { id: 'scenarios', label: 'Scenarios', icon: '🔄' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// ── Gauge component ────────────────────────────────────────────────
function ReadinessGauge({ percent, label }: { percent: number; label?: string }) {
  const clamp = Math.min(100, Math.max(0, percent));
  const color = clamp >= 90 ? COLORS.base : clamp >= 70 ? COLORS.orange : COLORS.red;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (clamp / 100) * circumference * 0.75;

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
        position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{clamp}%</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{label ?? 'Readiness'}</div>
      </div>
    </div>
  );
}

// ── Promotion timeline (engine-driven) ─────────────────────────────
function PromotionTimeline({ track, includePromotions }: { track: VelocityTrack; includePromotions: boolean }) {
  const promos = includePromotions ? TRACK_PROMOTIONS[track] : [];
  const steps = [
    { level: 'L62', age: '27 (now)', active: true },
    ...promos.map(p => ({ level: `L${p.toLevel}`, age: `Age ${p.atAge}`, active: false })),
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 12, flexWrap: 'wrap' }}>
      {steps.map((s, i) => (
        <div key={s.level + i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            textAlign: 'center', padding: '10px 18px', borderRadius: 10,
            background: s.active ? COLORS.accent + '14' : COLORS.bgPage,
            border: `2px solid ${s.active ? COLORS.accent : COLORS.border}`,
            minWidth: 88, transition: 'all 0.2s ease',
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: s.active ? COLORS.accent : COLORS.textPrimary }}>{s.level}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>{s.age}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 28, height: 2, background: COLORS.border, flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Velocity track badge ───────────────────────────────────────────
function TrackBadge({ track }: { track: VelocityTrack }) {
  const cfg: Record<VelocityTrack, { bg: string; fg: string; label: string; emoji: string }> = {
    fast: { bg: '#dcfce7', fg: '#166534', label: 'Fast Track', emoji: '🚀' },
    average: { bg: '#dbeafe', fg: '#1e40af', label: 'Average Track', emoji: '📊' },
    slow: { bg: '#fef3c7', fg: '#92400e', label: 'Slow Track', emoji: '🐢' },
  };
  const c = cfg[track];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px',
      borderRadius: 20, background: c.bg, color: c.fg, fontSize: 12, fontWeight: 600,
      letterSpacing: '0.01em',
    }}>
      {c.emoji} {c.label}
    </span>
  );
}

// ── Loading indicator ──────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '28px 0', color: COLORS.textMuted, fontSize: 13,
    }}>
      <div style={{
        width: 20, height: 20, border: `3px solid ${COLORS.border}`,
        borderTopColor: COLORS.accent, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Recalculating projections…
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ── Toggle switch ──────────────────────────────────────────────────
function Toggle({ on, onToggle, label, sub }: { on: boolean; onToggle: () => void; label: string; sub: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 0' }}>
      <div onClick={onToggle} role="switch" aria-checked={on}
        style={{
          width: 44, height: 24, borderRadius: 12, padding: 2, cursor: 'pointer',
          background: on ? COLORS.accent : '#cbd5e1',
          transition: 'background 0.2s ease', position: 'relative', flexShrink: 0,
        }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transform: on ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.textPrimary }}>{label}</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{sub}</div>
      </div>
    </label>
  );
}

// ── Segmented button group ─────────────────────────────────────────
function SegmentedGroup<T extends string | number>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (v: T) => React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button key={String(opt)} onClick={() => onChange(opt)}
            style={{
              flex: 1, padding: '10px 10px', borderRadius: 10, border: '2px solid',
              borderColor: active ? COLORS.accent : COLORS.border,
              background: active ? COLORS.accent + '10' : '#fff',
              color: active ? COLORS.accent : COLORS.textSecondary,
              fontWeight: active ? 600 : 400, cursor: 'pointer', fontSize: 13,
              transition: 'all 0.15s ease', textTransform: 'capitalize',
            }}>
            {renderLabel ? renderLabel(opt) : String(opt)}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function RetirementProjectionPanel() {
  const [activeTab, setActiveTab] = useState<ProjectionTab>('overview');
  const [settings, setSettings] = useState<ProjectionSettings>(DEFAULT_SETTINGS);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Actual expense data
  const [actualAnnualExpenses, setActualAnnualExpenses] = useState<number | null>(null);
  const [actualMonthCount, setActualMonthCount] = useState(0);

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
        setActualAnnualExpenses(Math.round(annualExp));
        setActualMonthCount(monthCount);
      })
      .catch(() => {});
  }, []);

  const updateSetting = <K extends keyof ProjectionSettings>(key: K, value: ProjectionSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  // Brief loading flash on settings change
  useEffect(() => {
    setIsRecalculating(true);
    const t = setTimeout(() => setIsRecalculating(false), 120);
    return () => clearTimeout(t);
  }, [settings]);

  // ── Engine-driven computations ───────────────────────────────
  const config = useMemo(() => buildConfig(settings), [settings]);

  const timeline = useMemo(
    () => projectRetirementTimeline(config),
    [config],
  );

  const compData = useMemo(
    () => projectCompensationGrowth(config),
    [config],
  );

  const readiness = useMemo(
    () => calculateRetirementReadiness(timeline, config),
    [timeline, config],
  );

  const scenarios = useMemo(
    () => runScenarioComparison(config),
    [config],
  );

  // ── Derived chart data ───────────────────────────────────────
  const projectionChartData = useMemo(() => {
    const conProj = scenarios.conservative.projection;
    const baseProj = scenarios.base.projection;
    const optProj = scenarios.optimistic.projection;
    const maxLen = Math.max(conProj.length, baseProj.length, optProj.length);
    const data: { age: number; conservative: number; base: number; optimistic: number; event?: string }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const b = baseProj[i];
      const c = conProj[i];
      const o = optProj[i];
      if (!b) continue;
      let event: string | undefined;
      if (b.milestones.length > 0) event = b.milestones[0];
      data.push({
        age: b.age,
        conservative: c?.endingBalance ?? 0,
        base: b.endingBalance,
        optimistic: o?.endingBalance ?? 0,
        event,
      });
    }
    return data;
  }, [scenarios]);

  const contribData = useMemo(() =>
    timeline.map(yr => ({
      age: yr.age,
      employee401k: yr.employee401kContrib,
      employerMatch: yr.employerMatch,
      espp: yr.esppBenefit,
      investmentReturns: yr.investmentReturn,
    })),
    [timeline],
  );

  const compChartData = useMemo(() => {
    const slowComp = projectCompensationGrowth(
      createDefaultConfig({ ...config, promotions: TRACK_PROMOTIONS.slow, overrideMeritRate: TRACK_MERIT_RATES.slow }),
    );
    const fastComp = projectCompensationGrowth(
      createDefaultConfig({ ...config, promotions: TRACK_PROMOTIONS.fast, overrideMeritRate: TRACK_MERIT_RATES.fast }),
    );
    return compData.map((yr, i) => ({
      age: yr.age,
      basePay: yr.baseSalary,
      bonus: yr.bonus,
      stock: yr.stockAward,
      totalComp: yr.totalComp,
      level: `L${yr.level}`,
      conservativeTotal: slowComp[i]?.totalComp ?? yr.totalComp,
      optimisticTotal: fastComp[i]?.totalComp ?? yr.totalComp,
      promoted: yr.promotedThisYear,
    }));
  }, [compData, config]);

  const milestoneAges = useMemo(() => {
    const ages: { age: number; label: string }[] = [];
    for (const yr of scenarios.base.projection) {
      if (yr.milestones.length > 0) {
        ages.push({ age: yr.age, label: yr.milestones[0]! });
      }
    }
    return ages;
  }, [scenarios]);

  const readinessPercent = useMemo(() => {
    if (readiness.targetPortfolio <= 0) return 100;
    return Math.min(100, Math.round((readiness.projectedPortfolio / readiness.targetPortfolio) * 100));
  }, [readiness]);

  const yearsUntilRetirement = settings.retirementAge - 27;

  const spendingReadiness = useMemo(() => {
    if (actualAnnualExpenses === null) return null;
    const yearsToRetirement = settings.retirementAge - 27;
    const inflationRate = 0.03;
    const spendingAtRetirement = actualAnnualExpenses * Math.pow(1 + inflationRate, yearsToRetirement);
    const portfolioNeeded = spendingAtRetirement / (settings.safeWithdrawalRate / 100);
    const projectedPortfolio = readiness.projectedPortfolio;
    const funded = portfolioNeeded > 0 ? Math.min(100, Math.round((projectedPortfolio / portfolioNeeded) * 100)) : 100;
    return {
      currentAnnual: actualAnnualExpenses,
      atRetirement: Math.round(spendingAtRetirement),
      portfolioNeeded: Math.round(portfolioNeeded),
      funded,
      monthCount: actualMonthCount,
    };
  }, [actualAnnualExpenses, actualMonthCount, settings.retirementAge, settings.safeWithdrawalRate, readiness.projectedPortfolio]);

  return (
    <div className="scenario-panel" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            Retirement Projection
          </h2>
          <TrackBadge track={settings.velocityTrack} />
        </div>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
          Powered by the three-track velocity model &mdash; portfolio growth, comp trajectory,
          and retirement readiness from the projection engine.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 12, padding: 4,
        marginBottom: 24,
      }}>
        {TAB_CONFIG.map((t) => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                background: active ? '#fff' : 'transparent',
                color: active ? COLORS.accent : COLORS.textSecondary,
                fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {isRecalculating && <LoadingOverlay />}

      {/* ── Overview Tab ───────────────────────────────────────── */}
      {activeTab === 'overview' && !isRecalculating && (
        <div style={S.sectionGap}>
          {/* Actual spending info card */}
          {spendingReadiness ? (
            <div style={{
              ...S.card,
              borderLeft: '4px solid #10b981',
              background: '#f0fdf4',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={S.cardTitle}>📊 Actual Spending Analysis</div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                  background: '#dcfce7', color: '#166534',
                }}>
                  LIVE DATA
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Current Annual Spending</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(spendingReadiness.currentAnnual)}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Based on {spendingReadiness.monthCount} month{spendingReadiness.monthCount !== 1 ? 's' : ''} of data</div>
                </div>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Projected at Retirement (Age {settings.retirementAge})</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(spendingReadiness.atRetirement)}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>With 3% annual inflation</div>
                </div>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Portfolio Needed to Sustain</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{formatCurrency(spendingReadiness.portfolioNeeded, true)}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>At {formatPercent(settings.safeWithdrawalRate, 1)} SWR</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              ...S.card,
              borderLeft: `4px solid ${COLORS.orange}`,
              background: '#fffbeb',
              padding: '16px 20px',
            }}>
              <div style={{ fontSize: 13, color: '#78350f', display: 'flex', alignItems: 'center', gap: 6 }}>
                💡 Import transactions for actual-based projections
              </div>
            </div>
          )}
          {/* Hero metric */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 18, padding: '36px 40px', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500 }}>
                Projected Portfolio at {settings.retirementAge}
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>
                {formatCurrency(readiness.projectedPortfolio, true)}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>🔵 Conservative: {formatCurrency(scenarios.conservative.readiness.projectedPortfolio, true)}</span>
                <span>🟣 Optimistic: {formatCurrency(scenarios.optimistic.readiness.projectedPortfolio, true)}</span>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Monthly Income</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(readiness.totalRetirementIncome / 12)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Years to Retire</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{yearsUntilRetirement}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Success</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{formatPercent(readiness.successProbability * 100, 0)}</div>
                </div>
              </div>
            </div>
            <ReadinessGauge percent={readinessPercent} label="On Track" />
          </div>

          {/* Metric cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {[
              { label: 'Annual Retirement Income', value: formatCurrency(readiness.totalRetirementIncome), sub: `${formatCurrency(readiness.swrIncome)} SWR + ${formatCurrency(readiness.ssAnnualIncome)} SS`, accent: COLORS.base },
              { label: 'Replacement Ratio', value: formatPercent(readiness.replacementRatio * 100, 0), sub: 'of final working comp', accent: COLORS.optimistic },
              { label: 'Portfolio (Today\'s $)', value: formatCurrency(readiness.projectedPortfolioReal, true), sub: 'inflation-adjusted', accent: COLORS.conservative },
              { label: 'Years of Income', value: readiness.yearsUntilDepletion ? `${readiness.yearsUntilDepletion} yrs` : '30+ yrs', sub: `at ${formatPercent(settings.safeWithdrawalRate, 1)} SWR`, accent: COLORS.teal },
            ].map((m) => (
              <div key={m.label} style={{
                ...S.card, borderLeft: `3px solid ${m.accent}`, padding: '18px 20px',
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>{m.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginTop: 4 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {readiness.warnings.length > 0 && (
            <div style={{
              ...S.card, borderLeft: `3px solid ${COLORS.orange}`, background: '#fffbeb',
              padding: '16px 20px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>⚠️ Warnings</div>
              {readiness.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>• {w}</div>
              ))}
            </div>
          )}

          {/* Retirement Readiness: Two Perspectives */}
          {spendingReadiness && (
            <div style={S.card}>
              <div style={S.cardTitle}>🎯 Retirement Readiness — Two Perspectives</div>
              <p style={S.cardSub}>Comparing income replacement vs. actual lifestyle sustenance</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Income Replacement */}
                <div style={{
                  padding: '20px 24px', borderRadius: 12, background: COLORS.bgPage,
                  border: `2px solid ${COLORS.border}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 12 }}>
                    💼 Based on 80% Income Replacement
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.base, marginBottom: 4 }}>
                    {readinessPercent}%
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                    Target: {formatCurrency(readiness.targetPortfolio, true)} portfolio
                    <br />
                    Projected: {formatCurrency(readiness.projectedPortfolio, true)}
                    <br />
                    Monthly income: {formatCurrency(readiness.totalRetirementIncome / 12)}
                  </div>
                </div>
                {/* Actual Spending */}
                <div style={{
                  padding: '20px 24px', borderRadius: 12,
                  background: '#f0fdf420',
                  border: '2px solid #10b98140',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                      📊 Based on Actual Spending + Inflation
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 8,
                      background: '#dcfce7', color: '#166534',
                    }}>
                      ACTUAL
                    </span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
                    {spendingReadiness.funded}%
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                    Current spending: {formatCurrency(spendingReadiness.currentAnnual)}/yr
                    <br />
                    At retirement: {formatCurrency(spendingReadiness.atRetirement)}/yr (3% inflation)
                    <br />
                    Portfolio needed: {formatCurrency(spendingReadiness.portfolioNeeded, true)} ({formatPercent(settings.safeWithdrawalRate, 1)} SWR)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Career Progression */}
          <div style={S.card}>
            <div style={S.cardTitle}>Career Progression</div>
            <PromotionTimeline track={settings.velocityTrack} includePromotions={settings.includePromotions} />
          </div>

          {/* Mini portfolio preview */}
          <div style={S.card}>
            <div style={S.cardTitle}>Portfolio Growth Preview</div>
            <p style={S.cardSub}>Base-case ending balance by age</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeline} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.base} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.base} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="endingBalance" name="Portfolio" stroke={COLORS.base} fill="url(#gradBase)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Projection Tab ─────────────────────────────────────── */}
      {activeTab === 'projection' && !isRecalculating && (
        <div style={S.sectionGap}>
          <div style={S.card}>
            <div style={S.cardTitle}>Portfolio Balance &mdash; Three Scenarios</div>
            <p style={S.cardSub}>
              Conservative (slow track, 5.5%), Base (weighted 3-track), Optimistic (fast track, 7.5%)
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={projectionChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradConMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.conservative} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={COLORS.conservative} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBaseMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.base} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.base} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.optimistic} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={COLORS.optimistic} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                {milestoneAges.map(m => (
                  <ReferenceLine key={m.age} x={m.age} stroke={COLORS.textMuted} strokeDasharray="3 3"
                    label={{ value: m.label.length > 20 ? m.label.slice(0, 18) + '…' : m.label, position: 'insideTopRight', fontSize: 9, fill: COLORS.textMuted }} />
                ))}
                <ReferenceLine x={settings.retirementAge} stroke={COLORS.accent} strokeDasharray="6 3"
                  label={{ value: `Retire @ ${settings.retirementAge}`, position: 'top', fontSize: 10, fill: COLORS.accent }} />
                <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke={COLORS.optimistic} fill="url(#gradOpt)" strokeWidth={2} />
                <Area type="monotone" dataKey="base" name="Base Case" stroke={COLORS.base} fill="url(#gradBaseMain)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="conservative" name="Conservative" stroke={COLORS.conservative} fill="url(#gradConMain)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Annual Contributions &amp; Growth</div>
            <p style={S.cardSub}>Employee 401k, employer match, ESPP benefit, and investment returns by age</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contribData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false} interval={4} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,99,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="investmentReturns" name="Investment Returns" stackId="c" fill={COLORS.base} />
                <Bar dataKey="employerMatch" name="Employer Match" stackId="c" fill={COLORS.teal} />
                <Bar dataKey="espp" name="ESPP Benefit" stackId="c" fill={COLORS.optimistic} />
                <Bar dataKey="employee401k" name="Employee 401k" stackId="c" fill={COLORS.accent} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Compensation Tab ───────────────────────────────────── */}
      {activeTab === 'compensation' && !isRecalculating && (
        <div style={S.sectionGap}>
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={S.cardTitle}>Total Compensation Trajectory</div>
              <TrackBadge track={settings.velocityTrack} />
            </div>
            <p style={S.cardSub}>
              Base + bonus + stock with promotion markers ({settings.includePromotions ? 'promotions on' : 'flat career'})
            </p>
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={compChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradCompCon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.conservative} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={COLORS.conservative} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCompOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.optimistic} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={COLORS.optimistic} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                {settings.includePromotions && TRACK_PROMOTIONS[settings.velocityTrack].map(p => (
                  <ReferenceLine key={p.atAge} x={p.atAge} stroke={COLORS.accent} strokeDasharray="4 4"
                    label={{ value: `→L${p.toLevel}`, position: 'top', fontSize: 9, fill: COLORS.accent }} />
                ))}
                <Area type="monotone" dataKey="optimisticTotal" name="Optimistic (fast)" stroke={COLORS.optimistic} fill="url(#gradCompOpt)" strokeWidth={1.5} strokeDasharray="4 3" />
                <Area type="monotone" dataKey="totalComp" name="Selected Track" stroke={COLORS.base} fill="none" strokeWidth={2.5} />
                <Area type="monotone" dataKey="conservativeTotal" name="Conservative (slow)" stroke={COLORS.conservative} fill="url(#gradCompCon)" strokeWidth={1.5} strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 16 }}>
              <div style={{ ...S.cardTitle, fontSize: 14, marginBottom: 12 }}>Compensation Breakdown by Age</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={compChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={65} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,99,255,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="basePay" name="Base Salary" stackId="comp" fill={COLORS.accent} />
                  <Bar dataKey="bonus" name="Bonus" stackId="comp" fill={COLORS.teal} />
                  <Bar dataKey="stock" name="Stock Awards" stackId="comp" fill={COLORS.base} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Scenarios Tab ──────────────────────────────────────── */}
      {activeTab === 'scenarios' && !isRecalculating && (
        <div style={S.sectionGap}>
          <div style={S.card}>
            <div style={S.cardTitle}>Scenario Comparison</div>
            <p style={S.cardSub}>Side-by-side analysis from the three-track velocity model</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>Metric</th>
                    <th style={{ textAlign: 'right', padding: '12px 14px', fontSize: 12, color: COLORS.conservative, fontWeight: 600 }}>🔵 Conservative</th>
                    <th style={{ textAlign: 'right', padding: '12px 14px', fontSize: 12, color: COLORS.base, fontWeight: 600 }}>🟢 Base Case</th>
                    <th style={{ textAlign: 'right', padding: '12px 14px', fontSize: 12, color: COLORS.optimistic, fontWeight: 600 }}>🟣 Optimistic</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { label: 'Portfolio at Retirement', con: scenarios.conservative.readiness.projectedPortfolio, base: scenarios.base.readiness.projectedPortfolio, opt: scenarios.optimistic.readiness.projectedPortfolio, fmt: 'currency' as const },
                    { label: 'Annual Income (SWR)', con: scenarios.conservative.readiness.swrIncome, base: scenarios.base.readiness.swrIncome, opt: scenarios.optimistic.readiness.swrIncome, fmt: 'currency' as const },
                    { label: 'SS Annual Income', con: scenarios.conservative.readiness.ssAnnualIncome, base: scenarios.base.readiness.ssAnnualIncome, opt: scenarios.optimistic.readiness.ssAnnualIncome, fmt: 'currency' as const },
                    { label: 'Total Retirement Income', con: scenarios.conservative.readiness.totalRetirementIncome, base: scenarios.base.readiness.totalRetirementIncome, opt: scenarios.optimistic.readiness.totalRetirementIncome, fmt: 'currency' as const },
                    { label: 'Monthly Income', con: scenarios.conservative.readiness.totalRetirementIncome / 12, base: scenarios.base.readiness.totalRetirementIncome / 12, opt: scenarios.optimistic.readiness.totalRetirementIncome / 12, fmt: 'currency' as const },
                    { label: 'Replacement Ratio', con: scenarios.conservative.readiness.replacementRatio, base: scenarios.base.readiness.replacementRatio, opt: scenarios.optimistic.readiness.replacementRatio, fmt: 'percent' as const },
                    { label: 'Success Probability', con: scenarios.conservative.readiness.successProbability, base: scenarios.base.readiness.successProbability, opt: scenarios.optimistic.readiness.successProbability, fmt: 'percent' as const },
                  ] as const).map((row) => (
                    <tr key={row.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', color: COLORS.textPrimary, fontWeight: 500 }}>{row.label}</td>
                      {([row.con, row.base, row.opt] as const).map((val, ci) => (
                        <td key={ci} style={{
                          textAlign: 'right', padding: '12px 14px',
                          color: [COLORS.conservative, COLORS.base, COLORS.optimistic][ci],
                          fontWeight: ci === 1 ? 600 : 400,
                        }}>
                          {row.fmt === 'currency' ? formatCurrency(val, true) : formatPercent(val * 100, 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Terminal Portfolio Comparison</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { scenario: 'Conservative', value: scenarios.conservative.readiness.projectedPortfolio },
                  { scenario: 'Base Case', value: scenarios.base.readiness.projectedPortfolio },
                  { scenario: 'Optimistic', value: scenarios.optimistic.readiness.projectedPortfolio },
                ]}
                margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="scenario" tick={{ fontSize: 13, fill: COLORS.textPrimary, fontWeight: 500 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,99,255,0.04)' }} />
                <Bar dataKey="value" name="Portfolio" radius={[0, 8, 8, 0]}>
                  <Cell fill={COLORS.conservative} />
                  <Cell fill={COLORS.base} />
                  <Cell fill={COLORS.optimistic} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Key Differentiating Levers</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 14 }}>
              {[
                { lever: 'Velocity Track', con: 'Slow', base: 'Weighted', opt: 'Fast' },
                { lever: 'Market Returns', con: '5.5%', base: 'Glide path', opt: '7.5%' },
                { lever: 'Merit Rate', con: `${(TRACK_MERIT_RATES.slow * 100).toFixed(1)}%`, base: 'Weighted', opt: `${(TRACK_MERIT_RATES.fast * 100).toFixed(1)}%` },
                { lever: 'Promotions', con: 'L62→L63', base: 'L62→L64', opt: 'L62→L65' },
                { lever: 'SWR', con: '3.0%', base: `${(config.safeWithdrawalRate * 100).toFixed(1)}%`, opt: '4.0%' },
                { lever: 'Retirement Age', con: String(settings.retirementAge), base: String(settings.retirementAge), opt: String(settings.retirementAge) },
              ].map((r) => (
                <div key={r.lever} style={{
                  padding: '12px 14px', borderRadius: 10, background: COLORS.bgPage,
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 8 }}>{r.lever}</div>
                  <div style={{ fontSize: 11, color: COLORS.conservative, lineHeight: 1.8 }}>🔵 {r.con}</div>
                  <div style={{ fontSize: 11, color: COLORS.base, fontWeight: 500, lineHeight: 1.8 }}>🟢 {r.base}</div>
                  <div style={{ fontSize: 11, color: COLORS.optimistic, lineHeight: 1.8 }}>🟣 {r.opt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Tab ───────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={S.card}>
            <div style={S.cardTitle}>Retirement Age</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
              <input type="range" min={55} max={75} value={settings.retirementAge}
                onChange={(e) => updateSetting('retirementAge', Number(e.target.value))}
                style={{ flex: 1, accentColor: COLORS.accent, height: 6 }} />
              <span style={{ fontSize: 26, fontWeight: 700, color: COLORS.accent, minWidth: 48, textAlign: 'right' }}>
                {settings.retirementAge}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>
              <span>55 (early)</span><span>65 (standard)</span><span>75 (late)</span>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Risk Profile</div>
            <SegmentedGroup
              options={['conservative', 'moderate', 'aggressive'] as const}
              value={settings.riskProfile}
              onChange={(v) => updateSetting('riskProfile', v)}
            />
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 10 }}>
              Market return: {settings.riskProfile === 'conservative' ? '5.5% flat' : settings.riskProfile === 'aggressive' ? '8.5% flat' : 'Lifecycle glide path'}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Velocity Track</div>
            <SegmentedGroup
              options={['fast', 'average', 'slow'] as const}
              value={settings.velocityTrack}
              onChange={(v) => updateSetting('velocityTrack', v)}
              renderLabel={(v) => (
                <div>
                  <div>{v === 'fast' ? '🚀' : v === 'average' ? '📊' : '🐢'} {v}</div>
                  <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>
                    {v === 'fast' ? 'Top 10–15%' : v === 'average' ? 'Median' : 'Bottom 30%'}
                  </div>
                </div>
              )}
            />
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 10 }}>
              Merit: {formatPercent(TRACK_MERIT_RATES[settings.velocityTrack] * 100, 1)} · Promos: {TRACK_PROMOTIONS[settings.velocityTrack].length}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Social Security Claiming Age</div>
            <SegmentedGroup
              options={[62, 67, 70] as const}
              value={settings.ssClaimingAge}
              onChange={(v) => updateSetting('ssClaimingAge', v as SSClaimAge)}
              renderLabel={(age) => (
                <div>
                  <div>Age {age}</div>
                  <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>
                    {age === 62 ? 'Reduced (70%)' : age === 67 ? 'Full benefit' : 'Maximum (124%)'}
                  </div>
                </div>
              )}
            />
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Safe Withdrawal Rate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
              <input type="range" min={25} max={50} value={settings.safeWithdrawalRate * 10}
                onChange={(e) => updateSetting('safeWithdrawalRate', Number(e.target.value) / 10)}
                style={{ flex: 1, accentColor: COLORS.accent, height: 6 }} />
              <span style={{ fontSize: 26, fontWeight: 700, color: COLORS.accent, minWidth: 56, textAlign: 'right' }}>
                {settings.safeWithdrawalRate.toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>
              <span>2.5% (very safe)</span><span>3.5% (standard)</span><span>5.0% (aggressive)</span>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Projection Assumptions</div>
            <div style={{ marginTop: 8 }}>
              <Toggle on={settings.includePromotions}
                onToggle={() => updateSetting('includePromotions', !settings.includePromotions)}
                label="Include Promotions"
                sub={`Model ${TRACK_PROMOTIONS[settings.velocityTrack].length} promotions on ${settings.velocityTrack} track`}
              />
              <Toggle on={settings.max401k}
                onToggle={() => updateSetting('max401k', !settings.max401k)}
                label="Max 401k Contributions"
                sub="$23,500/yr + $7,500 catch-up at 50 + $5k super catch-up 60-63"
              />
            </div>
          </div>

          <div style={{
            ...S.card, background: '#f0fdf4', borderColor: '#bbf7d0',
          }}>
            <div style={{ ...S.cardTitle, color: '#166534' }}>Active Configuration</div>
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              {[
                ['Retirement Age', String(settings.retirementAge)],
                ['Risk Profile', settings.riskProfile],
                ['Velocity Track', settings.velocityTrack],
                ['SS Claiming', `Age ${settings.ssClaimingAge}`],
                ['Withdrawal Rate', `${settings.safeWithdrawalRate.toFixed(1)}%`],
                ['Promotions', settings.includePromotions ? `Yes (${TRACK_PROMOTIONS[settings.velocityTrack].length})` : 'No'],
                ['Max 401k', settings.max401k ? 'Yes' : 'No'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                  <span style={{ color: '#4b5563' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#166534', textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
