import { useState, useMemo } from 'react';
import CurrencyInput from '../shared/CurrencyInput';
import PercentInput from '../shared/PercentInput';
import NumberInput from '../shared/NumberInput';
import InputGroup from '../shared/InputGroup';
import BreakdownChart from '../charts/BreakdownChart';
import ProjectionChart from '../charts/ProjectionChart';
import { monthlyPayment } from '../../engine/projections';
import { calculateAffordability } from '../../engine/housing';
import {
  DEFAULT_PROPERTY_TAX_RATE,
  DEFAULT_HOME_INSURANCE,
  PMI_RATE,
  DEFAULT_MORTGAGE_RATE_30,
  DEFAULT_CLOSING_COST_PERCENT,
} from '../../engine/constants';
import type { HousingInput, UserProfile } from '../../engine/types';
import { formatCurrency, formatPercent } from '../../utils/format';

type MortgageTerm = 15 | 20 | 30;

export default function HousingPanel() {
  const [homePrice, setHomePrice] = useState(750_000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(
    +(DEFAULT_MORTGAGE_RATE_30 * 100).toFixed(2),
  );
  const [mortgageTerm, setMortgageTerm] = useState<MortgageTerm>(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState(
    +(DEFAULT_PROPERTY_TAX_RATE * 100).toFixed(2),
  );
  const [annualInsurance, setAnnualInsurance] = useState(DEFAULT_HOME_INSURANCE);
  const [monthlyHOA, setMonthlyHOA] = useState(0);
  const [closingCostPct, setClosingCostPct] = useState(
    +(DEFAULT_CLOSING_COST_PERCENT * 100).toFixed(1),
  );
  const [annualIncome, setAnnualIncome] = useState(305_000);

  const calc = useMemo(() => {
    const downPayment = homePrice * (downPaymentPct / 100);
    const loanAmount = homePrice - downPayment;
    const rateDecimal = mortgageRate / 100;
    const pmiRequired = downPaymentPct < 20;

    const pi = monthlyPayment(loanAmount, rateDecimal, mortgageTerm);
    const monthlyTax = homePrice * (propertyTaxRate / 100) / 12;
    const monthlyIns = annualInsurance / 12;
    const monthlyPMI = pmiRequired ? (loanAmount * PMI_RATE) / 12 : 0;
    const totalMonthly = pi + monthlyTax + monthlyIns + monthlyPMI + monthlyHOA;

    const closingCosts = homePrice * (closingCostPct / 100);
    const totalCashNeeded = downPayment + closingCosts;
    const totalOverLife = pi * mortgageTerm * 12;
    const totalInterest = totalOverLife - loanAmount;
    const dtiRatio = annualIncome > 0 ? (totalMonthly / (annualIncome / 12)) * 100 : 0;

    // Equity buildup projection
    const equityTimeline: { year: number; equity: number; homeValue: number }[] = [];
    let remainingBalance = loanAmount;
    const monthlyRateDecimal = rateDecimal / 12;
    const appreciationRate = 0.03; // 3% annual home appreciation

    for (let y = 0; y <= mortgageTerm; y++) {
      const currentHomeValue = homePrice * Math.pow(1 + appreciationRate, y);
      const equity = currentHomeValue - remainingBalance;
      equityTimeline.push({
        year: y,
        equity: Math.round(equity),
        homeValue: Math.round(currentHomeValue),
      });
      // Simulate 12 months of payments to get next year's balance
      if (y < mortgageTerm) {
        for (let m = 0; m < 12; m++) {
          const interestPayment = remainingBalance * monthlyRateDecimal;
          const principalPayment = pi - interestPayment;
          remainingBalance = Math.max(0, remainingBalance - principalPayment);
        }
      }
    }

    // Wire up engine call (returns stub until Linus implements)
    const housingInput: HousingInput = {
      homePrice,
      downPaymentPercent: downPaymentPct,
      mortgageRate: rateDecimal,
      mortgageTermYears: mortgageTerm,
      propertyTaxRate: propertyTaxRate / 100,
      annualInsurance,
      monthlyHOA,
      closingCostPercent: closingCostPct / 100,
      pmiRequired,
    };
    const profile: UserProfile = {
      name: 'User',
      age: 32,
      annualIncome,
      filingStatus: 'married_filing_jointly',
      state: 'WA',
    };
    const engineResult = calculateAffordability(profile, housingInput);

    return {
      downPayment,
      loanAmount,
      pi,
      monthlyTax,
      monthlyIns,
      monthlyPMI,
      totalMonthly,
      closingCosts,
      totalCashNeeded,
      totalOverLife,
      totalInterest,
      dtiRatio,
      pmiRequired,
      equityTimeline,
      engineResult,
    };
  }, [
    homePrice, downPaymentPct, mortgageRate, mortgageTerm,
    propertyTaxRate, annualInsurance, monthlyHOA, closingCostPct,
    annualIncome,
  ]);

  const breakdownData = [
    { name: 'Principal & Interest', value: Math.round(calc.pi), color: '#6c63ff' },
    { name: 'Property Tax', value: Math.round(calc.monthlyTax), color: '#48cae4' },
    { name: 'Insurance', value: Math.round(calc.monthlyIns), color: '#06d6a0' },
    ...(calc.pmiRequired
      ? [{ name: 'PMI', value: Math.round(calc.monthlyPMI), color: '#ff6b6b' }]
      : []),
    ...(monthlyHOA > 0
      ? [{ name: 'HOA', value: monthlyHOA, color: '#ffd166' }]
      : []),
  ];

  const dtiColor = calc.dtiRatio <= 28 ? '#06d6a0' : calc.dtiRatio <= 36 ? '#ffd166' : '#ff6b6b';
  const dtiLabel = calc.dtiRatio <= 28 ? 'Comfortable' : calc.dtiRatio <= 36 ? 'Moderate' : 'Stretched';

  return (
    <div className="scenario-panel">
      <h2>🏠 Home Buying</h2>
      <p className="panel-description">
        Evaluate home affordability — mortgage payments, taxes, insurance, PMI —
        and see how different price points affect your monthly budget.
      </p>

      <div className="panel-grid">
        {/* Inputs */}
        <div className="panel-inputs">
          <InputGroup title="Property & Loan" helpText="Core home purchase parameters.">
            <CurrencyInput
              label="Home Price"
              value={homePrice}
              onChange={setHomePrice}
              step={10000}
            />
            <PercentInput
              label="Down Payment %"
              value={downPaymentPct}
              onChange={setDownPaymentPct}
              min={3}
              max={100}
              helpText={`= ${formatCurrency(homePrice * (downPaymentPct / 100))}`}
            />
            <PercentInput
              label="Mortgage Rate"
              value={mortgageRate}
              onChange={setMortgageRate}
              min={1}
              max={12}
              step={0.125}
              decimals={3}
            />
            <div className="input-field">
              <label className="input-label">Loan Term</label>
              <div className="inner-tabs" style={{ marginTop: 4 }}>
                {([15, 20, 30] as MortgageTerm[]).map((t) => (
                  <button
                    key={t}
                    className={`inner-tab-btn ${mortgageTerm === t ? 'active' : ''}`}
                    onClick={() => setMortgageTerm(t)}
                  >
                    {t} yr
                  </button>
                ))}
              </div>
            </div>
          </InputGroup>

          <InputGroup
            title="Taxes & Insurance"
            tooltip="Property tax and insurance vary widely by location. PMI is auto-calculated when your down payment is under 20%."
          >
            <PercentInput
              label="Property Tax Rate"
              value={propertyTaxRate}
              onChange={setPropertyTaxRate}
              min={0}
              max={5}
              step={0.05}
              decimals={2}
              helpText={`= ${formatCurrency(homePrice * (propertyTaxRate / 100))} / year`}
            />
            <CurrencyInput
              label="Annual Home Insurance"
              value={annualInsurance}
              onChange={setAnnualInsurance}
            />
            <CurrencyInput
              label="Monthly HOA"
              value={monthlyHOA}
              onChange={setMonthlyHOA}
              helpText="Set to $0 if none"
            />
          </InputGroup>

          <InputGroup title="Closing & Income">
            <PercentInput
              label="Closing Cost %"
              value={closingCostPct}
              onChange={setClosingCostPct}
              min={1}
              max={7}
              step={0.5}
              helpText={`= ${formatCurrency(homePrice * (closingCostPct / 100))}`}
            />
            <CurrencyInput
              label="Household Annual Income"
              value={annualIncome}
              onChange={setAnnualIncome}
              helpText="Used for DTI ratio calculation"
            />
          </InputGroup>
        </div>

        {/* Results */}
        <div className="panel-results">
          {/* KPI Row */}
          <div className="metric-row">
            <div className="metric-card accent-purple">
              <div className="metric-value">{formatCurrency(calc.totalMonthly)}</div>
              <div className="metric-label">Total Monthly Payment</div>
            </div>
            <div
              className="metric-card"
              style={{ background: dtiColor + '22', borderColor: dtiColor + '44' }}
            >
              <div className="metric-value" style={{ color: dtiColor }}>
                {formatPercent(calc.dtiRatio)}
              </div>
              <div className="metric-label">DTI — {dtiLabel}</div>
            </div>
            <div className="metric-card accent-blue">
              <div className="metric-value">{formatCurrency(calc.totalCashNeeded, true)}</div>
              <div className="metric-label">Cash to Close</div>
            </div>
            <div className="metric-card accent-teal">
              <div className="metric-value">{formatCurrency(calc.totalInterest, true)}</div>
              <div className="metric-label">Total Interest Paid</div>
            </div>
          </div>

          {calc.pmiRequired && (
            <div className="callout callout-warning">
              <span className="callout-icon">⚠️</span>
              <div>
                <strong>PMI Required:</strong> With {formatPercent(downPaymentPct)} down, you'll
                pay {formatCurrency(calc.monthlyPMI)}/mo in private mortgage insurance until you
                reach 20% equity.
              </div>
            </div>
          )}

          {/* Payment Breakdown Pie */}
          <div className="card">
            <div className="card-title">Monthly Payment Breakdown</div>
            <BreakdownChart
              data={breakdownData}
              centerLabel="Monthly"
              centerValue={formatCurrency(calc.totalMonthly)}
              height={280}
            />
          </div>

          {/* Payment Detail Table */}
          <div className="card">
            <div className="card-title">Payment Detail</div>
            <table className="comp-table">
              <tbody>
                {breakdownData.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <span className="comp-dot" style={{ background: row.color }} />
                      {row.name}
                    </td>
                    <td className="comp-amount">{formatCurrency(row.value)}</td>
                    <td className="comp-pct">
                      {calc.totalMonthly > 0
                        ? `${((row.value / calc.totalMonthly) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="comp-total-row">
                  <td>Total Monthly</td>
                  <td className="comp-amount">{formatCurrency(calc.totalMonthly)}</td>
                  <td className="comp-pct">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Equity Buildup Projection */}
          <div className="card">
            <div className="card-title">
              Equity Buildup — {mortgageTerm} Year Projection (3% Appreciation)
            </div>
            <ProjectionChart
              data={calc.equityTimeline}
              xKey="year"
              lines={[
                { dataKey: 'equity', label: 'Your Equity', color: '#6c63ff' },
                { dataKey: 'homeValue', label: 'Home Value', color: '#06d6a0', strokeDasharray: '5 3' },
              ]}
              height={280}
            />
          </div>

          {/* Loan Summary */}
          <div className="metric-row">
            <div className="metric-card accent-purple">
              <div className="metric-value">{formatCurrency(calc.loanAmount, true)}</div>
              <div className="metric-label">Loan Amount</div>
            </div>
            <div className="metric-card accent-green">
              <div className="metric-value">{formatCurrency(calc.totalOverLife, true)}</div>
              <div className="metric-label">Total Paid Over {mortgageTerm}yr</div>
            </div>
          </div>

          <div className="callout callout-info">
            <span className="callout-icon">ℹ️</span>
            <div>
              <strong>DTI Ratio:</strong> Lenders generally prefer a housing DTI under 28% and
              total DTI under 36%. Your housing DTI of {formatPercent(calc.dtiRatio)} is{' '}
              {calc.dtiRatio <= 28
                ? 'within comfortable range.'
                : calc.dtiRatio <= 36
                ? 'moderate — consider whether total debts fit within 36%.'
                : 'above typical limits — you may face stricter lending requirements.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
