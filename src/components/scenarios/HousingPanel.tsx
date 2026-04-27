import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import BreakdownChart from '../charts/BreakdownChart';
import CurrencyInput from '../shared/CurrencyInput';
import PercentInput from '../shared/PercentInput';
import InputGroup from '../shared/InputGroup';
import {
  calculateMonthlyHousingCost,
  getEastsideDefaults,
  calculateDTI,
  getLoanType,
  getMortgageRate,
} from '../../engine/housing';
import { monthlyPayment, futureValue } from '../../engine/projections';
import {
  EASTSIDE_MARKET_DATA,
  EASTSIDE_CITIES,
  CONFORMING_LOAN_LIMIT_KING_COUNTY,
} from '../../engine/constants';
import type { EastsideCity, PropertyType, HousingInput } from '../../engine/types';
import { formatCurrency, formatPercent } from '../../utils/format';

// ── Color tokens ───────────────────────────────────────────────────
const COLORS = {
  conservative: '#22c55e',
  comfortable: '#3b82f6',
  stretch: '#f59e0b',
  danger: '#ef4444',
  kirkland: '#6c63ff',
  redmond: '#14b8a6',
  bellevue: '#f59e0b',
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

// ── Tab config ─────────────────────────────────────────────────────
type HousingTab = 'affordability' | 'costs' | 'market' | 'settings';

const TABS: { key: HousingTab; label: string }[] = [
  { key: 'affordability', label: '🏠 Affordability' },
  { key: 'costs', label: '💰 Monthly Costs' },
  { key: 'market', label: '📊 Market Insights' },
  { key: 'settings', label: '⚙️ Settings' },
];

// ── Scenario config ─────────────────────────────────────────────────
const SCENARIOS = [
  {
    label: 'Conservative',
    description: '1-income resilience',
    priceMin: 1_000_000,
    priceMax: 1_200_000,
    color: COLORS.conservative,
  },
  {
    label: 'Comfortable',
    description: 'Dual income optimized',
    priceMin: 1_200_000,
    priceMax: 1_500_000,
    color: COLORS.comfortable,
  },
  {
    label: 'Stretch',
    description: 'RSU/bonus dependent',
    priceMin: 1_500_000,
    priceMax: 1_800_000,
    color: COLORS.stretch,
  },
];

// ── City personality info ───────────────────────────────────────────
const CITY_INFO: Record<EastsideCity, {
  color: string;
  emoji: string;
  headline: string;
  highlights: string[];
}> = {
  kirkland: {
    color: COLORS.kirkland,
    emoji: '🌊',
    headline: 'Lakeside charm, family-friendly',
    highlights: ['Lake Washington waterfront', 'Top-rated schools', 'Vibrant downtown', '20 min to Seattle'],
  },
  redmond: {
    color: COLORS.redmond,
    emoji: '💻',
    headline: 'Tech hub, Microsoft corridor',
    highlights: ['Microsoft HQ campus', 'Tech talent density', 'Overlake neighborhood', 'SR-520 access'],
  },
  bellevue: {
    color: COLORS.bellevue,
    emoji: '🌆',
    headline: 'Urban luxury, downtown core',
    highlights: ['Major financial center', 'High-end retail', 'Top school districts', 'Dense amenities'],
  },
};

// ── Glassmorphism chart tooltip ────────────────────────────────────
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
      background: 'rgba(255,255,255,0.97)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      backdropFilter: 'blur(6px)',
      minWidth: 160,
    }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 6px 0' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ fontSize: 12, color: COLORS.textSecondary, margin: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color ?? p.fill ?? COLORS.accent, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{p.name}</span>
          <strong style={{ color: COLORS.textPrimary }}>{formatCurrency(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

// ── DTI Gauge ──────────────────────────────────────────────────────
function DTIGauge({ dti }: { dti: number }) {
  const pct = Math.min(dti * 100, 50);
  const color = dti <= 0.28 ? COLORS.conservative : dti <= 0.36 ? COLORS.stretch : COLORS.danger;
  const label =
    dti <= 0.28
      ? 'Conservative — comfortably affordable'
      : dti <= 0.36
      ? 'Moderate — typical for high-income borrowers'
      : 'Stretch — requires dual income stability';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>Front-End DTI</span>
        <span style={{ fontSize: 16, fontWeight: 700, color }}>{formatPercent(dti * 100)}</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 6, height: 10, overflow: 'hidden' }}>
        <div style={{
          width: `${(pct / 50) * 100}%`,
          height: '100%',
          background: color,
          borderRadius: 6,
          transition: 'width 0.4s ease, background 0.3s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>0%</span>
        <span style={{ fontSize: 10, color: COLORS.conservative }}>28%</span>
        <span style={{ fontSize: 10, color: COLORS.stretch }}>36%</span>
        <span style={{ fontSize: 10, color: COLORS.textMuted }}>50%+</span>
      </div>
      <p style={{ fontSize: 12, color, marginTop: 8, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ── Seed defaults from engine ──────────────────────────────────────
const _seed = getEastsideDefaults('kirkland', 'sfh');

// ── Main component ─────────────────────────────────────────────────
export default function HousingPanel() {
  const [activeTab, setActiveTab] = useState<HousingTab>('affordability');
  const [city, setCity] = useState<EastsideCity>('kirkland');
  const [propertyType, setPropertyType] = useState<PropertyType>('sfh');
  const [combinedIncome, setCombinedIncome] = useState(305_000);

  // Form state — percentage fields stored as display % (e.g. 20 = 20%)
  const [homePrice, setHomePrice] = useState(_seed.homePrice);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageRatePct, setMortgageRatePct] = useState(+(_seed.mortgageRate * 100).toFixed(2));
  const [mortgageTerm, setMortgageTerm] = useState<15 | 20 | 30>(30);
  const [propertyTaxRatePct, setPropertyTaxRatePct] = useState(+(_seed.propertyTaxRate * 100).toFixed(2));
  const [annualInsurance, setAnnualInsurance] = useState(_seed.annualInsurance);
  const [monthlyHOA, setMonthlyHOA] = useState(_seed.monthlyHOA);
  const [closingCostPct, setClosingCostPct] = useState(3);

  // Auto-fill all fields when city or property type changes
  useEffect(() => {
    const d = getEastsideDefaults(city, propertyType);
    setHomePrice(d.homePrice);
    setMortgageRatePct(+(d.mortgageRate * 100).toFixed(2));
    setPropertyTaxRatePct(+(d.propertyTaxRate * 100).toFixed(2));
    setAnnualInsurance(d.annualInsurance);
    setMonthlyHOA(d.monthlyHOA);
  }, [city, propertyType]);

  // Build HousingInput for engine functions
  const housingInput = useMemo<HousingInput>(() => {
    const downFrac = downPaymentPct / 100;
    return {
      homePrice,
      downPaymentPercent: downFrac,
      mortgageRate: mortgageRatePct / 100,
      mortgageTermYears: mortgageTerm,
      propertyTaxRate: propertyTaxRatePct / 100,
      annualInsurance,
      monthlyHOA,
      closingCostPercent: closingCostPct / 100,
      pmiRequired: downFrac < 0.20,
    };
  }, [homePrice, downPaymentPct, mortgageRatePct, mortgageTerm, propertyTaxRatePct, annualInsurance, monthlyHOA, closingCostPct]);

  const breakdown = useMemo(() => calculateMonthlyHousingCost(housingInput), [housingInput]);
  const dti = useMemo(
    () => calculateDTI(breakdown.total, combinedIncome / 12),
    [breakdown.total, combinedIncome],
  );

  const downPayment = homePrice * (downPaymentPct / 100);
  const loanAmount = homePrice - downPayment;
  const loanType = getLoanType(loanAmount);
  const suggestedRate = getMortgageRate(loanType);
  const closingCosts = homePrice * (closingCostPct / 100);
  const totalCashNeeded = downPayment + closingCosts;

  // Scenario DTIs at midpoint price for each scenario
  const scenarioDTIs = useMemo(() =>
    SCENARIOS.map((s) => {
      const midPrice = (s.priceMin + s.priceMax) / 2;
      const d = getEastsideDefaults(city, propertyType);
      const inp: HousingInput = { ...d, homePrice: midPrice, mortgageTermYears: mortgageTerm };
      const br = calculateMonthlyHousingCost(inp);
      return calculateDTI(br.total, combinedIncome / 12);
    }),
  [city, propertyType, mortgageTerm, combinedIncome]);

  // Term comparison at 15 / 20 / 30 years
  const termComparison = useMemo(() =>
    ([15, 20, 30] as const).map((term) => {
      const inp: HousingInput = { ...housingInput, mortgageTermYears: term };
      const br = calculateMonthlyHousingCost(inp);
      const loanAmt = homePrice * (1 - downPaymentPct / 100);
      const piPayment = br.principal + br.interest;
      const totalInterest = piPayment * term * 12 - loanAmt;
      return { term, monthly: br.total, totalInterest: Math.max(0, totalInterest) };
    }),
  [housingInput, homePrice, downPaymentPct]);

  // 10-year appreciation projection from current home price
  const appreciationData = useMemo(() =>
    Array.from({ length: 11 }, (_, y) => ({
      year: `Yr ${y}`,
      Conservative: Math.round(futureValue(homePrice, 0.03, y)),
      Moderate: Math.round(futureValue(homePrice, 0.045, y)),
      Optimistic: Math.round(futureValue(homePrice, 0.07, y)),
    })),
  [homePrice]);

  // City median price comparison data
  const cityCompData = EASTSIDE_CITIES.map((c) => ({
    city: c.charAt(0).toUpperCase() + c.slice(1),
    SFH: EASTSIDE_MARKET_DATA[c].medianSFH,
    Condo: EASTSIDE_MARKET_DATA[c].medianCondo,
    Townhome: EASTSIDE_MARKET_DATA[c].medianTownhome,
  }));

  // PITI pie chart data
  const pitiData = [
    { name: 'Principal', value: Math.round(breakdown.principal), color: COLORS.comfortable },
    { name: 'Interest', value: Math.round(breakdown.interest), color: '#8b5cf6' },
    { name: 'Property Tax', value: Math.round(breakdown.propertyTax), color: COLORS.stretch },
    { name: 'Insurance', value: Math.round(breakdown.insurance), color: COLORS.conservative },
    { name: 'HOA', value: Math.round(breakdown.hoa), color: COLORS.gray },
    { name: 'PMI', value: Math.round(breakdown.pmi), color: COLORS.danger },
  ].filter((d) => d.value > 0);

  return (
    <div className="scenario-panel" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          🏡 Eastside Housing
        </h2>
        <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
          Kirkland · Redmond · Bellevue — affordability, monthly costs, and market intelligence.
        </p>
      </div>

      {/* Pill tab bar */}
      <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 24 }}>
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

      {/* ── Affordability Tab ─────────────────────────────────────── */}
      {activeTab === 'affordability' && (
        <div style={S.sectionGap}>

          {/* Hero card */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 18, padding: '32px 36px', color: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 500, marginBottom: 6 }}>
              Combined Household Income
            </div>
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>
              {formatCurrency(combinedIncome)}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>
              {formatCurrency(combinedIncome / 12, true)}/mo gross · {formatCurrency(homePrice, true)} target · {formatCurrency(downPayment, true)} down
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Loan Amount', value: formatCurrency(loanAmount, true) },
                { label: 'Loan Type', value: loanType === 'jumbo' ? '⚠️ Jumbo' : '✅ Conforming' },
                { label: 'Monthly PITI+HOA', value: formatCurrency(breakdown.total, true) },
                { label: 'Front-End DTI', value: formatPercent(dti * 100) },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* City selector */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Select City
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {EASTSIDE_CITIES.map((c) => {
                const info = CITY_INFO[c];
                const active = city === c;
                const market = EASTSIDE_MARKET_DATA[c];
                return (
                  <button key={c} onClick={() => setCity(c)}
                    style={{
                      ...S.card,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      border: active ? `2px solid ${info.color}` : `1px solid ${COLORS.border}`,
                      background: active ? `${info.color}12` : COLORS.bgCard,
                      transition: 'all 0.2s ease',
                      width: '100%',
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{info.emoji}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: active ? info.color : COLORS.textPrimary, textTransform: 'capitalize' }}>
                      {c}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{info.headline}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginTop: 10 }}>
                      Median SFH {formatCurrency(market.medianSFH, true)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Property type selector */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Property Type
            </div>
            <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 10, padding: 3, maxWidth: 400 }}>
              {([
                { key: 'sfh' as PropertyType, label: '🏠 Single Family' },
                { key: 'condo' as PropertyType, label: '🏢 Condo' },
                { key: 'townhome' as PropertyType, label: '🏘️ Townhome' },
              ]).map((p) => {
                const active = propertyType === p.key;
                return (
                  <button key={p.key} onClick={() => setPropertyType(p.key)}
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8, border: 'none',
                      background: active ? '#fff' : 'transparent',
                      color: active ? COLORS.accent : COLORS.textSecondary,
                      fontWeight: active ? 600 : 400, fontSize: 12, cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      whiteSpace: 'nowrap',
                    }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scenario cards */}
          <div>
            <div style={S.cardTitle}>Affordability Scenarios</div>
            <p style={S.cardSub}>Based on {formatCurrency(combinedIncome, true)} combined household income at {city.charAt(0).toUpperCase() + city.slice(1)} rates</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {SCENARIOS.map((s, i) => {
                const sDTI = scenarioDTIs[i];
                const dtiColor = sDTI <= 0.28 ? COLORS.conservative : sDTI <= 0.36 ? COLORS.stretch : COLORS.danger;
                return (
                  <div key={s.label} style={{ ...S.card, padding: '18px 20px', borderTop: `3px solid ${s.color}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>{s.description}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: -0.5 }}>
                      {formatCurrency(s.priceMin, true)}–{formatCurrency(s.priceMax, true)}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 }}>price range</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>Est. DTI</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: dtiColor }}>{formatPercent(sDTI * 100)}</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 4, height: 6, marginTop: 6 }}>
                      <div style={{ width: `${Math.min((sDTI * 100 / 50) * 100, 100)}%`, height: '100%', background: dtiColor, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DTI gauge */}
          <div style={S.card}>
            <div style={S.cardTitle}>Your DTI Analysis</div>
            <p style={S.cardSub}>
              Front-end ratio for {formatCurrency(homePrice, true)} ({city.charAt(0).toUpperCase() + city.slice(1)} {propertyType.toUpperCase()}) at current settings
            </p>
            <DTIGauge dti={dti} />
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
              marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`,
            }}>
              {[
                { label: 'Monthly PITI+HOA', value: formatCurrency(breakdown.total) },
                { label: 'Monthly Income', value: formatCurrency(combinedIncome / 12) },
                { label: 'Cash to Close', value: formatCurrency(totalCashNeeded, true), warm: true },
              ].map((m) => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: m.warm ? COLORS.stretch : COLORS.textPrimary }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── Monthly Costs Tab ─────────────────────────────────────── */}
      {activeTab === 'costs' && (
        <div style={S.sectionGap}>

          {/* Hero total */}
          <div style={{
            ...S.card,
            background: `linear-gradient(135deg, ${COLORS.comfortable}14 0%, ${COLORS.bgCard} 100%)`,
            borderLeft: `4px solid ${COLORS.comfortable}`,
            padding: '20px 24px',
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, marginBottom: 4 }}>
              Total Monthly Housing Cost
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: -1 }}>
              {formatCurrency(breakdown.total)}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'P&I', value: breakdown.principal + breakdown.interest },
                { label: 'Taxes', value: breakdown.propertyTax },
                { label: 'Insurance', value: breakdown.insurance },
                { label: 'HOA', value: breakdown.hoa },
              ].filter((m) => m.value > 0).map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{formatCurrency(m.value, true)}</div>
                </div>
              ))}
              {breakdown.pmi > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: COLORS.danger }}>PMI ⚠️</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.danger }}>{formatCurrency(breakdown.pmi, true)}</div>
                </div>
              )}
            </div>
          </div>

          {/* PITI Pie */}
          <div style={S.card}>
            <div style={S.cardTitle}>Monthly Cost Breakdown</div>
            <p style={S.cardSub}>Where your {formatCurrency(breakdown.total, true)}/mo goes — PITI + HOA</p>
            <BreakdownChart
              data={pitiData}
              centerLabel="Monthly Total"
              centerValue={formatCurrency(breakdown.total, true)}
              height={280}
            />
          </div>

          {/* Detail table */}
          <div style={S.card}>
            <div style={S.cardTitle}>PITI + HOA Detail</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
              <tbody>
                {pitiData.map((row) => (
                  <tr key={row.name} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ color: COLORS.textPrimary }}>{row.name}</span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 500, color: COLORS.textPrimary }}>
                      {formatCurrency(row.value)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 0 10px 16px', color: COLORS.textMuted, fontSize: 11 }}>
                      {formatPercent((row.value / breakdown.total) * 100, 0)} of total
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '10px 0', fontWeight: 700, color: COLORS.textPrimary }}>Total Monthly</td>
                  <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 700, color: COLORS.textPrimary }}>{formatCurrency(breakdown.total)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Term comparison */}
          <div style={S.card}>
            <div style={S.cardTitle}>Mortgage Term Comparison</div>
            <p style={S.cardSub}>15 vs 20 vs 30 year — monthly payment vs total interest tradeoff (click to select)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {termComparison.map((t) => {
                const active = mortgageTerm === t.term;
                return (
                  <div key={t.term} onClick={() => setMortgageTerm(t.term)}
                    style={{
                      ...S.card,
                      padding: '16px 18px',
                      border: active ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                      background: active ? `${COLORS.accent}0d` : COLORS.bgCard,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: active ? COLORS.accent : COLORS.textPrimary }}>{t.term}yr</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginTop: 8 }}>{formatCurrency(t.monthly)}/mo</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
                      Total interest: {formatCurrency(t.totalInterest, true)}
                    </div>
                    {active && (
                      <div style={{ marginTop: 6, fontSize: 10, color: COLORS.accent, fontWeight: 600 }}>✓ SELECTED</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── Market Insights Tab ───────────────────────────────────── */}
      {activeTab === 'market' && (
        <div style={S.sectionGap}>

          {/* City comparison bar chart */}
          <div style={S.card}>
            <div style={S.cardTitle}>Eastside Median Prices (2026)</div>
            <p style={S.cardSub}>Kirkland · Redmond · Bellevue — SFH, Condo, Townhome</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityCompData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="city" tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="SFH" name="Single Family" fill={COLORS.kirkland} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Condo" name="Condo" fill={COLORS.redmond} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Townhome" name="Townhome" fill={COLORS.bellevue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Appreciation projection */}
          <div style={S.card}>
            <div style={S.cardTitle}>10-Year Home Value Projection</div>
            <p style={S.cardSub}>
              From {formatCurrency(homePrice, true)} — conservative (3%), moderate (4.5%), optimistic (7%) appreciation
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={appreciationData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.conservative} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={COLORS.conservative} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradMod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.comfortable} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={COLORS.comfortable} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.stretch} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={COLORS.stretch} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="year" tick={S.axisTick} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrency(v, true)} tick={S.axisTick} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Conservative" name="Conservative (3%)" stroke={COLORS.conservative} fill="url(#gradCons)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Moderate" name="Moderate (4.5%)" stroke={COLORS.comfortable} fill="url(#gradMod)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Optimistic" name="Optimistic (7%)" stroke={COLORS.stretch} fill="url(#gradOpt)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* City personality cards */}
          <div>
            <div style={S.cardTitle}>City Personalities</div>
            <p style={S.cardSub}>Commute, schools, lifestyle — Eastside at a glance</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {EASTSIDE_CITIES.map((c) => {
                const info = CITY_INFO[c];
                const market = EASTSIDE_MARKET_DATA[c];
                return (
                  <div key={c} style={{ ...S.card, padding: '18px 20px', borderTop: `3px solid ${info.color}` }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{info.emoji}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: info.color, textTransform: 'capitalize', marginBottom: 2 }}>{c}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>{info.headline}</div>
                    {info.highlights.map((h) => (
                      <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ color: info.color, fontSize: 10 }}>●</span>
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{h}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>Historical appreciation</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: info.color }}>{formatPercent(market.appreciationRate * 100, 1)}/yr</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Property tax info */}
          <div style={{ ...S.card, background: '#fffbeb', borderLeft: `4px solid ${COLORS.stretch}` }}>
            <div style={S.cardTitle}>⚠️ King County Property Tax</div>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: '4px 0 12px 0', lineHeight: 1.6 }}>
              All Eastside cities sit in King County at approximately <strong>0.85%</strong> effective rate.
              On a {formatCurrency(homePrice, true)} home that's <strong>{formatCurrency(homePrice * 0.0085, true)}/yr</strong>{' '}
              ({formatCurrency(homePrice * 0.0085 / 12, true)}/mo). King County conforming loan limit:{' '}
              <strong>{formatCurrency(CONFORMING_LOAN_LIMIT_KING_COUNTY, true)}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {EASTSIDE_CITIES.map((c) => (
                <div key={c} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' }}>{c}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.stretch }}>
                    {formatPercent(EASTSIDE_MARKET_DATA[c].propertyTaxRate * 100, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── Settings Tab ─────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div style={S.sectionGap}>

          <InputGroup title="Household Income" helpText="Combined gross annual income used for all DTI calculations.">
            <CurrencyInput
              label="Combined Annual Income"
              value={combinedIncome}
              onChange={setCombinedIncome}
              helpText="Steven + Partner total gross income"
            />
          </InputGroup>

          <InputGroup title="Home Price" helpText="Auto-fills from city + property type selection above. Override manually if needed.">
            <CurrencyInput
              label="Home Price"
              value={homePrice}
              onChange={setHomePrice}
              min={100_000}
              max={10_000_000}
            />
            <PercentInput
              label="Down Payment %"
              value={downPaymentPct}
              onChange={setDownPaymentPct}
              min={3}
              max={50}
              helpText={`${formatCurrency(downPayment, true)} down · ${downPaymentPct < 20 ? '⚠️ PMI required' : '✅ No PMI'}`}
            />
          </InputGroup>

          <InputGroup
            title="Mortgage"
            helpText="Rate auto-selects conforming vs jumbo based on loan amount. King County limit: $1,063,750."
            tooltip={`Current market: Conforming ${formatPercent(suggestedRate * 100, 2)} · Jumbo ${formatPercent(getMortgageRate('jumbo') * 100, 2)}`}
          >
            <PercentInput
              label="Interest Rate"
              value={mortgageRatePct}
              onChange={setMortgageRatePct}
              min={2}
              max={12}
              step={0.05}
              decimals={2}
              helpText={`${loanType === 'jumbo' ? '⚠️ Jumbo — ' : '✅ Conforming — '}${formatCurrency(loanAmount, true)} balance · market rate ${formatPercent(suggestedRate * 100, 2)}`}
            />
            <div className="input-field">
              <label className="input-label">Loan Term</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {([15, 20, 30] as const).map((t) => (
                  <button key={t} onClick={() => setMortgageTerm(t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8,
                      border: `1px solid ${mortgageTerm === t ? COLORS.accent : COLORS.border}`,
                      background: mortgageTerm === t ? `${COLORS.accent}14` : 'transparent',
                      color: mortgageTerm === t ? COLORS.accent : COLORS.textSecondary,
                      fontWeight: mortgageTerm === t ? 600 : 400, fontSize: 13, cursor: 'pointer',
                    }}>
                    {t}yr
                  </button>
                ))}
              </div>
            </div>
          </InputGroup>

          <InputGroup title="Ongoing Costs" helpText="Auto-fills from city selection. Adjust to match your specific property.">
            <PercentInput
              label="Property Tax Rate"
              value={propertyTaxRatePct}
              onChange={setPropertyTaxRatePct}
              min={0.1}
              max={3}
              step={0.01}
              decimals={2}
              helpText={`${formatCurrency((homePrice * propertyTaxRatePct) / 100 / 12, true)}/mo · ${formatCurrency((homePrice * propertyTaxRatePct) / 100, true)}/yr`}
            />
            <CurrencyInput
              label="Annual Homeowner's Insurance"
              value={annualInsurance}
              onChange={setAnnualInsurance}
              helpText={`${formatCurrency(annualInsurance / 12, true)}/mo`}
            />
            <CurrencyInput
              label="Monthly HOA"
              value={monthlyHOA}
              onChange={setMonthlyHOA}
              helpText="Homeowner association fee — $0 for SFH with no HOA"
            />
          </InputGroup>

          <InputGroup title="Closing Costs">
            <PercentInput
              label="Closing Cost %"
              value={closingCostPct}
              onChange={setClosingCostPct}
              min={1}
              max={6}
              step={0.1}
              helpText={`${formatCurrency(closingCosts, true)} estimated at close (WA state typical: 2–3%)`}
            />
          </InputGroup>

          {/* Cash to close summary */}
          <div style={{ ...S.card, background: '#f0fdf4', borderLeft: `4px solid ${COLORS.conservative}` }}>
            <div style={S.cardTitle}>Cash Needed to Close</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
              {[
                { label: 'Down Payment', value: formatCurrency(downPayment) },
                { label: 'Closing Costs', value: formatCurrency(closingCosts) },
                { label: 'Total to Close', value: formatCurrency(totalCashNeeded), bold: true },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{m.label}</div>
                  <div style={{ fontSize: m.bold ? 22 : 16, fontWeight: m.bold ? 800 : 600, color: COLORS.textPrimary, marginTop: 2 }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
