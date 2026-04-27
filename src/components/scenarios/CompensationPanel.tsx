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
} from 'recharts';
import CurrencyInput from '../shared/CurrencyInput';
import PercentInput from '../shared/PercentInput';
import InputGroup from '../shared/InputGroup';
import BreakdownChart from '../charts/BreakdownChart';
import ComparisonChart from '../charts/ComparisonChart';
import { calcCompensation, type PersonComp } from '../../engine/mockEngine';
import { formatCurrency, formatPercent } from '../../utils/format';
import { createDefaultConfig, projectCompensationGrowth } from '../../engine/projection';

// ── Color tokens ───────────────────────────────────────────────────
const COLORS = {
  steven: '#6c63ff',
  partner: '#14b8a6',
  accent: '#6c63ff',
  base: '#22c55e',
  optimistic: '#8b5cf6',
  conservative: '#3b82f6',
  orange: '#f59e0b',
  red: '#ef4444',
  teal: '#14b8a6',
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

// ── Data constants ─────────────────────────────────────────────────

const DEFAULT_STEVEN: PersonComp = {
  baseSalary: 158_412,
  bonusTargetPercent: 10,
  rsuAnnual: 18_000,
  employer401kMatchPercent: 50,
  employer401kMatchLimit: 100,
  employee401kContribution: 24_500,
  esppDiscountPercent: 15,
  esppContributionPercent: 10,
};

const DEFAULT_PARTNER: PersonComp = {
  baseSalary: 120_000,
  bonusTargetPercent: 10,
  rsuAnnual: 0,
  employer401kMatchPercent: 50,
  employer401kMatchLimit: 6,
  employee401kContribution: 24_500,
  esppDiscountPercent: 0,
  esppContributionPercent: 0,
};

interface CompHistoryEntry {
  fy: string;
  baseMidpoint: number;
  bonus: number;
  stock: number;
  totalComp: number;
  level: string;
  yoyGrowth: number | null;
}

const COMP_HISTORY: CompHistoryEntry[] = [
  { fy: 'FY22', baseMidpoint: 119_860, bonus: 13_000, stock: 134_400, totalComp: 267_260, level: 'L59→L60', yoyGrowth: null },
  { fy: 'FY23', baseMidpoint: 129_740, bonus: 18_000, stock: 16_800, totalComp: 164_540, level: 'L60', yoyGrowth: -38.4 },
  { fy: 'FY24', baseMidpoint: 142_869, bonus: 24_400, stock: 25_200, totalComp: 192_469, level: 'L61', yoyGrowth: 17.0 },
  { fy: 'FY25', baseMidpoint: 158_412, bonus: 14_500, stock: 18_000, totalComp: 190_912, level: 'L62', yoyGrowth: -0.8 },
];

const BASE_PROGRESSION = [
  { label: 'FY22 Start', base: 110_500 },
  { label: 'FY22 Mid', base: 119_340 },
  { label: 'FY22 End', base: 129_740 },
  { label: 'FY24 Start', base: 140_119 },
  { label: 'FY24 Mid', base: 145_619 },
  { label: 'FY25', base: 158_412 },
];

// ── Shared sub-components ──────────────────────────────────────────

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; fill?: string }[];
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)', border: `1px solid ${COLORS.border}`,
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      backdropFilter: 'blur(6px)', minWidth: 160,
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 6px 0' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ fontSize: 12, color: COLORS.textSecondary, margin: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill || COLORS.accent, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{p.name}</span>
          <strong style={{ color: COLORS.textPrimary }}>{formatCurrency(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

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
      Calculating…
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ── Tab types ──────────────────────────────────────────────────────

type CompTab = 'overview' | 'breakdown' | 'history' | 'projections';

const TAB_CONFIG: { id: CompTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'breakdown', label: 'Breakdown', icon: '🧩' },
  { id: 'history', label: 'History', icon: '📈' },
  { id: 'projections', label: 'Projections', icon: '🔭' },
];

// ── Main component ─────────────────────────────────────────────────

export default function CompensationPanel() {
  const [activeTab, setActiveTab] = useState<CompTab>('overview');
  const [activePerson, setActivePerson] = useState<'steven' | 'partner'>('steven');
  const [steven, setSteven] = useState<PersonComp>(DEFAULT_STEVEN);
  const [partner, setPartner] = useState<PersonComp>(DEFAULT_PARTNER);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Brief loading flash on input change
  useEffect(() => {
    setIsRecalculating(true);
    const t = setTimeout(() => setIsRecalculating(false), 100);
    return () => clearTimeout(t);
  }, [steven, partner]);

  const stevenComp = useMemo(() => calcCompensation(steven), [steven]);
  const partnerComp = useMemo(() => calcCompensation(partner), [partner]);
  const householdTotal = stevenComp.totalComp + partnerComp.totalComp;

  const updateSteven = (key: keyof PersonComp, val: number) =>
    setSteven((p) => ({ ...p, [key]: val }));
  const updatePartner = (key: keyof PersonComp, val: number) =>
    setPartner((p) => ({ ...p, [key]: val }));

  const activeComp = activePerson === 'steven' ? stevenComp : partnerComp;
  const activeInputs = activePerson === 'steven' ? steven : partner;
  const activeUpdate = activePerson === 'steven' ? updateSteven : updatePartner;

  const combinedChartData = [
    { name: 'Base Salary', Steven: stevenComp.baseSalary, Partner: partnerComp.baseSalary },
    { name: 'Bonus', Steven: stevenComp.bonusAmount, Partner: partnerComp.bonusAmount },
    { name: 'RSUs', Steven: stevenComp.rsuAnnual, Partner: partnerComp.rsuAnnual },
    { name: 'ESPP', Steven: stevenComp.esppBenefit, Partner: partnerComp.esppBenefit },
    { name: '401k Match', Steven: stevenComp.employer401kMatch, Partner: partnerComp.employer401kMatch },
  ].filter((d) => d.Steven + d.Partner > 0);

  // Projections tab — forward-looking comp from engine
  const compProjection = useMemo(() => {
    const cfg = createDefaultConfig();
    return projectCompensationGrowth(cfg).slice(0, 15); // next 15 years
  }, []);

  return (
    <div className="scenario-panel" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          💰 Compensation
        </h2>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
          Household comp overview, per-person breakdown, career history, and forward projections.
        </p>
      </div>

      {/* Pill tab bar */}
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

          {/* Hero household card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 18, padding: '32px 36px', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)', flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500, marginBottom: 6 }}>
                Household Total Compensation
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>
                {formatCurrency(householdTotal)}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>
                Steven {formatCurrency(stevenComp.totalComp, true)} + Partner {formatCurrency(partnerComp.totalComp, true)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Combined Base</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(steven.baseSalary + partner.baseSalary, true)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Steven Share</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatPercent((stevenComp.totalComp / householdTotal) * 100, 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Partner Share</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatPercent((partnerComp.totalComp / householdTotal) * 100, 0)}</div>
              </div>
            </div>
          </div>

          {/* Per-person metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {[
              { label: "Steven's Total Comp", value: formatCurrency(stevenComp.totalComp), sub: `${formatCurrency(stevenComp.baseSalary, true)} base`, accent: COLORS.steven },
              { label: "Partner's Total Comp", value: formatCurrency(partnerComp.totalComp), sub: `${formatCurrency(partnerComp.baseSalary, true)} base`, accent: COLORS.partner },
              { label: "Steven's Bonus", value: formatCurrency(stevenComp.bonusAmount), sub: `${formatPercent(steven.bonusTargetPercent, 0)} of base`, accent: COLORS.orange },
              { label: "Steven's RSUs + ESPP", value: formatCurrency(stevenComp.rsuAnnual + stevenComp.esppBenefit), sub: 'equity & ESPP benefit', accent: COLORS.optimistic },
              { label: 'Total 401k Match', value: formatCurrency(stevenComp.employer401kMatch + partnerComp.employer401kMatch), sub: 'combined employer match', accent: COLORS.base },
              { label: 'Monthly Household', value: formatCurrency(householdTotal / 12, true), sub: 'gross est. per month', accent: COLORS.conservative },
            ].map((m) => (
              <div key={m.label} style={{ ...S.card, borderLeft: `3px solid ${m.accent}`, padding: '18px 20px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>{m.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginTop: 4 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Comparison chart */}
          <div style={S.card}>
            <div style={S.cardTitle}>Household Comp Comparison</div>
            <p style={S.cardSub}>Side-by-side breakdown by comp component</p>
            <ComparisonChart
              data={combinedChartData}
              bars={[
                { dataKey: 'Steven', label: 'Steven', color: COLORS.steven },
                { dataKey: 'Partner', label: 'Partner', color: COLORS.partner },
              ]}
              xKey="name"
              height={280}
            />
          </div>
        </div>
      )}

      {/* ── Breakdown Tab ──────────────────────────────────────── */}
      {activeTab === 'breakdown' && !isRecalculating && (
        <div style={S.sectionGap}>

          {/* Person selector */}
          <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 10, padding: 3, maxWidth: 300 }}>
            {(['steven', 'partner'] as const).map((p) => {
              const active = activePerson === p;
              return (
                <button key={p} onClick={() => setActivePerson(p)}
                  style={{
                    flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none',
                    background: active ? '#fff' : 'transparent',
                    color: active ? (p === 'steven' ? COLORS.steven : COLORS.partner) : COLORS.textSecondary,
                    fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  👤 {p === 'steven' ? 'Steven' : 'Partner'}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Inputs */}
            <div style={S.sectionGap}>
              <InputGroup
                title={activePerson === 'steven' ? 'Steven' : 'Partner'}
                helpText="Enter compensation details to see your full picture."
              >
                <CurrencyInput
                  label="Base Salary"
                  value={activeInputs.baseSalary}
                  onChange={(v) => activeUpdate('baseSalary', v)}
                  step={5000}
                />
                <PercentInput
                  label="Bonus Target %"
                  value={activeInputs.bonusTargetPercent}
                  onChange={(v) => activeUpdate('bonusTargetPercent', v)}
                  min={0} max={100}
                  helpText="Target bonus as % of base salary"
                />
                <CurrencyInput
                  label="RSU Annual Grant Value"
                  value={activeInputs.rsuAnnual}
                  onChange={(v) => activeUpdate('rsuAnnual', v)}
                  helpText="Total RSU value vesting in one year"
                />
              </InputGroup>

              <InputGroup
                title="401(k) Match"
                tooltip="Employer match is essentially free money — always contribute enough to capture the full match."
              >
                <PercentInput
                  label="Employer Match Rate"
                  value={activeInputs.employer401kMatchPercent}
                  onChange={(v) => activeUpdate('employer401kMatchPercent', v)}
                  min={0} max={100}
                  helpText="e.g. 50 = 50¢ per dollar you contribute"
                />
                <PercentInput
                  label="Match Limit (% of salary)"
                  value={activeInputs.employer401kMatchLimit}
                  onChange={(v) => activeUpdate('employer401kMatchLimit', v)}
                  min={0} max={100}
                  helpText="Max % of salary the employer will match on"
                />
              </InputGroup>

              <InputGroup
                title="ESPP"
                tooltip="ESPP lets you buy company stock at a discount — typically 10–15% below market. It's often the highest guaranteed return available."
              >
                <PercentInput
                  label="ESPP Discount %"
                  value={activeInputs.esppDiscountPercent}
                  onChange={(v) => activeUpdate('esppDiscountPercent', v)}
                  min={0} max={25}
                />
                <PercentInput
                  label="ESPP Contribution % of Salary"
                  value={activeInputs.esppContributionPercent}
                  onChange={(v) => activeUpdate('esppContributionPercent', v)}
                  min={0} max={15}
                />
              </InputGroup>
            </div>

            {/* Charts + table */}
            <div style={S.sectionGap}>
              {/* Total comp hero */}
              <div style={{
                ...S.card,
                background: `linear-gradient(135deg, ${activePerson === 'steven' ? '#6c63ff' : '#14b8a6'}18 0%, ${COLORS.bgCard} 100%)`,
                borderLeft: `4px solid ${activePerson === 'steven' ? COLORS.steven : COLORS.partner}`,
                padding: '20px 24px',
              }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, marginBottom: 4 }}>
                  Total Compensation
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: -1 }}>
                  {formatCurrency(activeComp.totalComp)}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Base', value: activeComp.baseSalary },
                    { label: 'Bonus', value: activeComp.bonusAmount },
                    { label: 'RSUs', value: activeComp.rsuAnnual },
                    { label: '401k', value: activeComp.employer401kMatch },
                  ].map((m) => (
                    <div key={m.label}>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{formatCurrency(m.value, true)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie chart */}
              <div style={S.card}>
                <div style={S.cardTitle}>Comp Breakdown</div>
                <BreakdownChart
                  data={activeComp.breakdown}
                  centerLabel="Total Comp"
                  centerValue={formatCurrency(activeComp.totalComp, true)}
                  height={260}
                />
              </div>

              {/* Detail table */}
              <div style={S.card}>
                <div style={S.cardTitle}>Comp Detail</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
                  <tbody>
                    {activeComp.breakdown.map((row) => (
                      <tr key={row.name} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: COLORS.textPrimary }}>{row.name}</span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 500, color: COLORS.textPrimary }}>
                          {formatCurrency(row.value)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px 0 10px 16px', color: COLORS.textMuted, fontSize: 11 }}>
                          {activeComp.totalComp > 0
                            ? formatPercent((row.value / activeComp.totalComp) * 100, 1)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ padding: '10px 0', fontWeight: 700, color: COLORS.textPrimary }}>Total</td>
                      <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 700, color: COLORS.textPrimary }}>
                        {formatCurrency(activeComp.totalComp)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 0 10px 16px', color: COLORS.textMuted, fontSize: 11 }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── History Tab ────────────────────────────────────────── */}
      {activeTab === 'history' && !isRecalculating && (
        <div style={S.sectionGap}>

          {/* Level milestone cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {COMP_HISTORY.map((h) => (
              <div key={h.fy} style={{
                ...S.card, padding: '16px 18px', textAlign: 'center',
                borderLeft: `3px solid ${COLORS.accent}`,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>{h.level}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>{h.fy}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, marginTop: 6 }}>
                  {formatCurrency(h.totalComp, true)}
                </div>
                {h.yoyGrowth !== null && (
                  <div style={{ fontSize: 11, color: h.yoyGrowth >= 0 ? COLORS.base : COLORS.red, marginTop: 4, fontWeight: 500 }}>
                    {h.yoyGrowth >= 0 ? '↑' : '↓'} {Math.abs(h.yoyGrowth).toFixed(1)}% YoY
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Base salary progression */}
          <div style={S.card}>
            <div style={S.cardTitle}>Base Salary Progression</div>
            <p style={S.cardSub}>$110.5k → $158.4k · +43% over 4 years (L59 → L62)</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={BASE_PROGRESSION} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v, true)}
                  tick={S.axisTick} axisLine={false} tickLine={false} width={68}
                  domain={[100_000, 170_000]}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine y={158_412} stroke={COLORS.accent} strokeDasharray="4 3"
                  label={{ value: 'Current', position: 'right', fontSize: 10, fill: COLORS.accent }} />
                <Line
                  type="monotone" dataKey="base" name="Base Salary"
                  stroke={COLORS.accent} strokeWidth={3}
                  dot={{ fill: COLORS.accent, r: 5 }} activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Total comp stacked bars */}
          <div style={S.card}>
            <div style={S.cardTitle}>Total Compensation by Fiscal Year</div>
            <p style={S.cardSub}>Base + Bonus + Stock · FY22 includes $120k on-hire grant</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={COMP_HISTORY} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="fy" tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={68} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,99,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="baseMidpoint" name="Base Salary" stackId="c" fill={COLORS.accent} />
                <Bar dataKey="bonus" name="Bonus" stackId="c" fill={COLORS.teal} />
                <Bar dataKey="stock" name="Stock" stackId="c" fill={COLORS.base} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detail table */}
          <div style={S.card}>
            <div style={S.cardTitle}>Comp History Detail</div>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                    {['FY', 'Level', 'Base', 'Bonus', 'Stock', 'Total'].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i < 2 ? 'left' : 'right',
                        padding: '8px 12px', fontSize: 11,
                        color: COLORS.textMuted, fontWeight: 600,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMP_HISTORY.map((h) => (
                    <tr key={h.fy} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '10px 12px', color: COLORS.textPrimary, fontWeight: 500 }}>{h.fy}</td>
                      <td style={{ padding: '10px 12px', color: COLORS.textSecondary }}>{h.level}</td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: COLORS.textPrimary }}>{formatCurrency(h.baseMidpoint)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: COLORS.textPrimary }}>{formatCurrency(h.bonus)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: COLORS.textPrimary }}>{formatCurrency(h.stock)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(h.totalComp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Projections Tab ────────────────────────────────────── */}
      {activeTab === 'projections' && !isRecalculating && (
        <div style={S.sectionGap}>

          {/* Projection summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
            {compProjection.slice(0, 4).map((yr) => (
              <div key={yr.age} style={{ ...S.card, borderLeft: `3px solid ${COLORS.accent}`, padding: '16px 20px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(yr.totalComp, true)}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginTop: 4 }}>Age {yr.age} · L{yr.level}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{formatCurrency(yr.baseSalary, true)} base</div>
              </div>
            ))}
          </div>

          {/* Comp trajectory area chart */}
          <div style={S.card}>
            <div style={S.cardTitle}>Compensation Trajectory</div>
            <p style={S.cardSub}>
              Projected total comp over the next 15 years — fast-track velocity model (promotion-aware)
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={compProjection} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradTotalComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBaseComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false}
                  label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: COLORS.textMuted }} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={68} />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                {compProjection.filter((yr) => yr.promotedThisYear).map((yr) => (
                  <ReferenceLine key={yr.age} x={yr.age} stroke={COLORS.orange} strokeDasharray="4 3"
                    label={{ value: `L${yr.level}`, position: 'insideTopRight', fontSize: 9, fill: COLORS.orange }} />
                ))}
                <Area type="monotone" dataKey="totalComp" name="Total Comp" stroke={COLORS.accent} fill="url(#gradTotalComp)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="baseSalary" name="Base Salary" stroke={COLORS.teal} fill="url(#gradBaseComp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stacked comp components */}
          <div style={S.card}>
            <div style={S.cardTitle}>Comp Components by Age</div>
            <p style={S.cardSub}>Base salary, bonus, and stock award composition over time</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={compProjection} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="age" tick={S.axisTick} axisLine={false} tickLine={false} interval={2} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={68} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,99,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="baseSalary" name="Base Salary" stackId="c" fill={COLORS.accent} />
                <Bar dataKey="bonus" name="Bonus" stackId="c" fill={COLORS.teal} />
                <Bar dataKey="stockAward" name="Stock Award" stackId="c" fill={COLORS.base} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            ...S.card, background: '#fffbeb', borderLeft: `3px solid ${COLORS.orange}`, padding: '14px 18px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>ℹ️ Projection model</div>
            <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
              Powered by the fast-track velocity model from the projection engine.
              Assumes Steven continues on the L62→L63→L64 fast-track path.
              See the Retirement Projection panel for conservative/base/optimistic scenarios.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
