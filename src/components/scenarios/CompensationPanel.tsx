import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { COLORS as SHARED_COLORS, S as SHARED_S } from '../../theme';
import GlassTooltip from '../shared/GlassTooltip';
import CurrencyInput from '../shared/CurrencyInput';
import PercentInput from '../shared/PercentInput';
import InputGroup from '../shared/InputGroup';
import BreakdownChart from '../charts/BreakdownChart';
import { calcCompensation, type PersonComp } from '../../engine/mockEngine';
import { formatCurrency, formatPercent } from '../../utils/format';
import { createDefaultConfig, projectCompensationGrowth } from '../../engine/projection';
import { STEVEN_COMP, SONYA_COMP } from '../../config/household';

// ── Color tokens (extends shared theme) ────────────────────────────
const COLORS = {
  ...SHARED_COLORS,
  steven: '#6c63ff',
  partner: '#14b8a6',
  base: '#22c55e',
  optimistic: '#8b5cf6',
  conservative: '#3b82f6',
  bgPage: '#f8fafc',
};

const S = { ...SHARED_S };

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
  const [steven, setSteven] = useState<PersonComp>(STEVEN_COMP);
  const [partner, setPartner] = useState<PersonComp>(SONYA_COMP);
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
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500, marginBottom: 6 }}>
              Household Total Compensation
            </div>
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>
              {formatCurrency(householdTotal)}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
              {formatCurrency(householdTotal / 12, true)}/mo gross
            </div>
          </div>

          {/* Side-by-side person cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {([
              { name: 'Steven', comp: stevenComp, inputs: steven, color: COLORS.steven },
              { name: 'Sonya', comp: partnerComp, inputs: partner, color: COLORS.partner },
            ] as const).map(({ name, comp, inputs, color }) => (
              <div key={name} style={{
                ...S.card, borderTop: `3px solid ${color}`, padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>👤 {name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                    {householdTotal > 0 ? formatPercent((comp.totalComp / householdTotal) * 100, 0) : '—'} of household
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: -1, marginBottom: 16 }}>
                  {formatCurrency(comp.totalComp)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Base', value: comp.baseSalary },
                    { label: 'Bonus', value: comp.bonusAmount },
                    { label: 'RSUs', value: comp.rsuAnnual },
                    { label: 'ESPP Benefit', value: comp.esppBenefit },
                    { label: '401k Match', value: comp.employer401kMatch },
                    { label: '401k Contrib', value: inputs.employee401kContribution },
                  ].map((m) => (
                    <div key={m.label} style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: m.value > 0 ? COLORS.textPrimary : COLORS.textMuted }}>
                        {m.value > 0 ? formatCurrency(m.value, true) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Combined benefits summary */}
          <div style={S.card}>
            <div style={S.cardTitle}>Combined Household Benefits</div>
            <p style={S.cardSub}>Both MSFT employees — doubled tax-advantaged limits and employer benefits</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                {
                  label: '401k Contributions',
                  steven: steven.employee401kContribution,
                  partner: partner.employee401kContribution,
                  note: '2× the $24.5k limit',
                  color: COLORS.accent,
                },
                {
                  label: 'Employer 401k Match',
                  steven: stevenComp.employer401kMatch,
                  partner: partnerComp.employer401kMatch,
                  note: 'Free money from MSFT',
                  color: COLORS.base,
                },
                {
                  label: 'RSU Annual Vest',
                  steven: stevenComp.rsuAnnual,
                  partner: partnerComp.rsuAnnual,
                  note: 'Combined equity compensation',
                  color: COLORS.optimistic,
                },
                {
                  label: 'ESPP Benefit',
                  steven: stevenComp.esppBenefit,
                  partner: partnerComp.esppBenefit,
                  note: '15% stock discount × 2',
                  color: COLORS.teal,
                },
              ].map((b) => {
                const total = b.steven + b.partner;
                return (
                  <div key={b.label} style={{
                    padding: '16px 18px', background: `${b.color}08`,
                    borderRadius: 10, borderLeft: `3px solid ${b.color}`,
                  }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      {b.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 4 }}>
                      {formatCurrency(total, true)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>
                      <span style={{ color: COLORS.steven }}>S: {formatCurrency(b.steven, true)}</span>
                      <span style={{ color: COLORS.textMuted }}>+</span>
                      <span style={{ color: COLORS.partner }}>So: {formatCurrency(b.partner, true)}</span>
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>{b.note}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stacked household comp by component */}
          <div style={S.card}>
            <div style={S.cardTitle}>Household Income Stack</div>
            <p style={S.cardSub}>How each component contributes to total household comp</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={[
                  { name: 'Base Salary', Steven: stevenComp.baseSalary, Sonya: partnerComp.baseSalary },
                  { name: 'Bonus', Steven: stevenComp.bonusAmount, Sonya: partnerComp.bonusAmount },
                  { name: 'RSUs', Steven: stevenComp.rsuAnnual, Sonya: partnerComp.rsuAnnual },
                  { name: 'ESPP', Steven: stevenComp.esppBenefit, Sonya: partnerComp.esppBenefit },
                  { name: '401k Match', Steven: stevenComp.employer401kMatch, Sonya: partnerComp.employer401kMatch },
                ].filter(d => d.Steven + d.Sonya > 0)}
                layout="vertical"
                margin={{ top: 8, right: 30, left: 90, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: COLORS.textPrimary, fontWeight: 500 }} axisLine={false} tickLine={false} width={85} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(108,99,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="Steven" name="Steven" stackId="comp" fill={COLORS.steven} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Sonya" name="Sonya" stackId="comp" fill={COLORS.partner} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Household comp waterfall — total comp buildup */}
          <div style={S.card}>
            <div style={S.cardTitle}>Total Comp Buildup</div>
            <p style={S.cardSub}>How household comp stacks up from base to total</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={(() => {
                  const items = [
                    { name: 'Base (2×)', value: stevenComp.baseSalary + partnerComp.baseSalary, color: COLORS.accent },
                    { name: 'Bonus (2×)', value: stevenComp.bonusAmount + partnerComp.bonusAmount, color: COLORS.teal },
                    { name: 'RSUs (2×)', value: stevenComp.rsuAnnual + partnerComp.rsuAnnual, color: COLORS.optimistic },
                    { name: 'ESPP (2×)', value: stevenComp.esppBenefit + partnerComp.esppBenefit, color: COLORS.orange },
                    { name: '401k Match (2×)', value: stevenComp.employer401kMatch + partnerComp.employer401kMatch, color: COLORS.base },
                  ].filter(i => i.value > 0);
                  let running = 0;
                  const data = items.map(i => {
                    const d = { name: i.name, base: running, value: i.value, color: i.color };
                    running += i.value;
                    return d;
                  });
                  data.push({ name: 'Total', base: 0, value: running, color: COLORS.textPrimary });
                  return data;
                })()}
                margin={{ top: 8, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.textSecondary }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={68} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'base') return [null, null];
                    return [formatCurrency(value), 'Amount'];
                  }}
                  cursor={{ fill: 'rgba(108,99,255,0.04)' }}
                />
                <Bar dataKey="base" stackId="waterfall" fill="transparent" />
                <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
                  {(() => {
                    const items = [
                      { value: stevenComp.baseSalary + partnerComp.baseSalary, color: COLORS.accent },
                      { value: stevenComp.bonusAmount + partnerComp.bonusAmount, color: COLORS.teal },
                      { value: stevenComp.rsuAnnual + partnerComp.rsuAnnual, color: COLORS.optimistic },
                      { value: stevenComp.esppBenefit + partnerComp.esppBenefit, color: COLORS.orange },
                      { value: stevenComp.employer401kMatch + partnerComp.employer401kMatch, color: COLORS.base },
                    ].filter(i => i.value > 0);
                    items.push({ value: 0, color: COLORS.textPrimary });
                    return items.map((item, idx) => (
                      <Cell key={idx} fill={item.color} />
                    ));
                  })()}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Breakdown Tab ──────────────────────────────────────── */}
      {activeTab === 'breakdown' && !isRecalculating && (
        <div style={S.sectionGap}>

          {/* Side-by-side inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Steven inputs */}
            <div style={S.sectionGap}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                background: `${COLORS.steven}10`, borderRadius: 10, borderLeft: `3px solid ${COLORS.steven}`,
              }}>
                <span style={{ fontSize: 14 }}>👤</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.steven }}>Steven</span>
                <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 'auto' }}>{formatCurrency(stevenComp.totalComp, true)} total</span>
              </div>
              <InputGroup title="Cash Comp" helpText="Base salary and bonus target.">
                <CurrencyInput label="Base Salary" value={steven.baseSalary} onChange={(v) => updateSteven('baseSalary', v)} step={5000} />
                <PercentInput label="Bonus Target %" value={steven.bonusTargetPercent} onChange={(v) => updateSteven('bonusTargetPercent', v)} min={0} max={100} helpText="Target bonus as % of base" />
                <CurrencyInput label="RSU Annual Grant" value={steven.rsuAnnual} onChange={(v) => updateSteven('rsuAnnual', v)} helpText="Total RSU value vesting per year" />
              </InputGroup>
              <InputGroup title="401(k)" tooltip="MSFT matches 50% of your full contribution.">
                <PercentInput label="Match Rate" value={steven.employer401kMatchPercent} onChange={(v) => updateSteven('employer401kMatchPercent', v)} min={0} max={100} helpText="50 = 50¢ per dollar" />
                <PercentInput label="Match Limit (% of salary)" value={steven.employer401kMatchLimit} onChange={(v) => updateSteven('employer401kMatchLimit', v)} min={0} max={100} />
              </InputGroup>
              <InputGroup title="ESPP" tooltip="Buy MSFT stock at 15% discount.">
                <PercentInput label="Discount %" value={steven.esppDiscountPercent} onChange={(v) => updateSteven('esppDiscountPercent', v)} min={0} max={25} />
                <PercentInput label="Contribution %" value={steven.esppContributionPercent} onChange={(v) => updateSteven('esppContributionPercent', v)} min={0} max={15} />
              </InputGroup>
            </div>

            {/* Partner inputs */}
            <div style={S.sectionGap}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                background: `${COLORS.partner}10`, borderRadius: 10, borderLeft: `3px solid ${COLORS.partner}`,
              }}>
                <span style={{ fontSize: 14 }}>👤</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.partner }}>Sonya</span>
                <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 'auto' }}>{formatCurrency(partnerComp.totalComp, true)} total</span>
              </div>
              <InputGroup title="Cash Comp" helpText="Base salary and bonus target.">
                <CurrencyInput label="Base Salary" value={partner.baseSalary} onChange={(v) => updatePartner('baseSalary', v)} step={5000} />
                <PercentInput label="Bonus Target %" value={partner.bonusTargetPercent} onChange={(v) => updatePartner('bonusTargetPercent', v)} min={0} max={100} helpText="Target bonus as % of base" />
                <CurrencyInput label="RSU Annual Grant" value={partner.rsuAnnual} onChange={(v) => updatePartner('rsuAnnual', v)} helpText="Total RSU value vesting per year" />
              </InputGroup>
              <InputGroup title="401(k)" tooltip="MSFT matches 50% of your full contribution.">
                <PercentInput label="Match Rate" value={partner.employer401kMatchPercent} onChange={(v) => updatePartner('employer401kMatchPercent', v)} min={0} max={100} helpText="50 = 50¢ per dollar" />
                <PercentInput label="Match Limit (% of salary)" value={partner.employer401kMatchLimit} onChange={(v) => updatePartner('employer401kMatchLimit', v)} min={0} max={100} />
              </InputGroup>
              <InputGroup title="ESPP" tooltip="Buy MSFT stock at 15% discount.">
                <PercentInput label="Discount %" value={partner.esppDiscountPercent} onChange={(v) => updatePartner('esppDiscountPercent', v)} min={0} max={25} />
                <PercentInput label="Contribution %" value={partner.esppContributionPercent} onChange={(v) => updatePartner('esppContributionPercent', v)} min={0} max={15} />
              </InputGroup>
            </div>
          </div>

          {/* Combined summary table */}
          <div style={S.card}>
            <div style={S.cardTitle}>Household Comp Summary</div>
            <p style={S.cardSub}>All values are annual</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>Component</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: COLORS.steven, fontWeight: 600 }}>Steven</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: COLORS.partner, fontWeight: 600 }}>Sonya</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: COLORS.textPrimary, fontWeight: 700 }}>Household</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Base Salary', s: stevenComp.baseSalary, p: partnerComp.baseSalary },
                  { label: 'Bonus', s: stevenComp.bonusAmount, p: partnerComp.bonusAmount },
                  { label: 'RSUs', s: stevenComp.rsuAnnual, p: partnerComp.rsuAnnual },
                  { label: 'ESPP Benefit', s: stevenComp.esppBenefit, p: partnerComp.esppBenefit },
                  { label: '401k Match', s: stevenComp.employer401kMatch, p: partnerComp.employer401kMatch },
                ].map((row) => (
                  <tr key={row.label} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '10px 12px', color: COLORS.textPrimary }}>{row.label}</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: COLORS.textPrimary }}>{formatCurrency(row.s)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: COLORS.textPrimary }}>{formatCurrency(row.p)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(row.s + row.p)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${COLORS.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: COLORS.textPrimary }}>Total Comp</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: COLORS.steven }}>{formatCurrency(stevenComp.totalComp)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: COLORS.partner }}>{formatCurrency(partnerComp.totalComp)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 800, color: COLORS.textPrimary, fontSize: 15 }}>{formatCurrency(householdTotal)}</td>
                </tr>
              </tbody>
            </table>
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
                <Tooltip content={<GlassTooltip />} cursor={{ strokeDasharray: '3 3' }} />
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
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(108,99,255,0.04)' }} />
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
                <Tooltip content={<GlassTooltip />} cursor={{ strokeDasharray: '3 3' }} />
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
                <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(108,99,255,0.04)' }} />
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
