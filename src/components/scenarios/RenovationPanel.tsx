import { useState, useMemo } from 'react';
import CurrencyInput from '../shared/CurrencyInput';
import PercentInput from '../shared/PercentInput';
import NumberInput from '../shared/NumberInput';
import InputGroup from '../shared/InputGroup';
import ComparisonChart from '../charts/ComparisonChart';
import ProjectionChart from '../charts/ProjectionChart';
import { monthlyPayment, futureValue } from '../../engine/projections';
import { compareRenovationVsSave } from '../../engine/housing';
import type { RenovationInput } from '../../engine/types';
import { formatCurrency, formatPercent } from '../../utils/format';

type FinancingType = 'cash' | 'heloc' | 'personal_loan';

const FINANCING_LABELS: Record<FinancingType, string> = {
  cash: '💵 Cash',
  heloc: '🏠 HELOC',
  personal_loan: '🏦 Personal Loan',
};

export default function RenovationPanel() {
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

    // Opportunity cost: what if you invested the money instead?
    const investmentGrowth = futureValue(projectCost, altReturnDecimal, projectionYears);
    const opportunityCost = investmentGrowth - projectCost;

    // Net benefit of renovating vs investing
    // Renovate: you gain expectedValueAdd in home value (minus financing cost)
    // Invest: the cash grows to investmentGrowth
    const renovateNetValue = expectedValueAdd - (isFinanced ? totalInterest : 0);
    const investNetValue = investmentGrowth;
    const netBenefit = renovateNetValue - investNetValue;

    // Year-by-year comparison
    const timeline: { year: number; renovate: number; invest: number }[] = [];
    for (let y = 0; y <= projectionYears; y++) {
      const investVal = futureValue(projectCost, altReturnDecimal, y);
      // Home value add appreciates at ~3%/yr, minus cumulative financing cost
      const renovateVal =
        expectedValueAdd * Math.pow(1.03, y) -
        (isFinanced ? Math.min(loanMonthly * 12 * y, totalLoanCost) - projectCost : 0);
      timeline.push({
        year: y,
        renovate: Math.round(renovateVal),
        invest: Math.round(investVal),
      });
    }

    // Comparison bar data
    const comparisonData = [
      {
        name: 'Upfront Cost',
        Renovate: isFinanced ? 0 : projectCost,
        Invest: projectCost,
      },
      {
        name: 'Value Added',
        Renovate: expectedValueAdd,
        Invest: 0,
      },
      {
        name: `${projectionYears}yr Growth`,
        Renovate: Math.round(expectedValueAdd * Math.pow(1.03, projectionYears) - expectedValueAdd),
        Invest: Math.round(opportunityCost),
      },
      {
        name: 'Financing Cost',
        Renovate: Math.round(totalInterest),
        Invest: 0,
      },
    ];

    // Wire up engine call (returns stub until Linus implements)
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
      comparisonData,
      isFinanced,
      engineResult,
    };
  }, [
    projectName, projectCost, expectedValueAdd, financing,
    loanRate, loanTermYears, urgency, altReturn, projectionYears,
  ]);

  const netBenefitColor = calc.netBenefit >= 0 ? '#06d6a0' : '#ff6b6b';
  const netBenefitLabel = calc.netBenefit >= 0 ? 'Renovation Wins' : 'Investing Wins';

  return (
    <div className="scenario-panel">
      <h2>🔨 Renovate vs. Save</h2>
      <p className="panel-description">
        Should you renovate now or invest the cash? Compare renovation ROI
        against market returns over your time horizon.
      </p>

      <div className="panel-grid">
        {/* Inputs */}
        <div className="panel-inputs">
          <InputGroup title="Project Details" helpText="Describe the renovation you're considering.">
            <div className="input-field">
              <label className="input-label">Project Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-control"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Kitchen Remodel"
                />
              </div>
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

          <InputGroup
            title="Financing"
            tooltip="Cash pays upfront with no interest. HELOC or personal loan spreads the cost but adds interest."
          >
            <div className="input-field">
              <label className="input-label">Payment Method</label>
              <div className="inner-tabs" style={{ marginTop: 4 }}>
                {(['cash', 'heloc', 'personal_loan'] as FinancingType[]).map((f) => (
                  <button
                    key={f}
                    className={`inner-tab-btn ${financing === f ? 'active' : ''}`}
                    onClick={() => setFinancing(f)}
                  >
                    {FINANCING_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            {financing !== 'cash' && (
              <>
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
              </>
            )}
          </InputGroup>

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
        </div>

        {/* Results */}
        <div className="panel-results">
          {/* KPI Row */}
          <div className="metric-row">
            <div className="metric-card accent-purple">
              <div className="metric-value">{formatPercent(calc.renovationROI)}</div>
              <div className="metric-label">Renovation ROI</div>
            </div>
            <div className="metric-card accent-blue">
              <div className="metric-value">{formatCurrency(calc.opportunityCost, true)}</div>
              <div className="metric-label">Opportunity Cost</div>
            </div>
            <div
              className="metric-card"
              style={{ background: netBenefitColor + '22', borderColor: netBenefitColor + '44' }}
            >
              <div className="metric-value" style={{ color: netBenefitColor }}>
                {formatCurrency(Math.abs(calc.netBenefit), true)}
              </div>
              <div className="metric-label">{netBenefitLabel}</div>
            </div>
            {calc.isFinanced && (
              <div className="metric-card accent-teal">
                <div className="metric-value">{formatCurrency(calc.loanMonthly)}</div>
                <div className="metric-label">Monthly Payment</div>
              </div>
            )}
          </div>

          {calc.renovationROI < 0 && (
            <div className="callout callout-warning">
              <span className="callout-icon">⚠️</span>
              <div>
                <strong>Negative ROI:</strong> This project costs{' '}
                {formatCurrency(projectCost)} but only adds{' '}
                {formatCurrency(expectedValueAdd)} in value. You'd lose{' '}
                {formatCurrency(projectCost - expectedValueAdd)} on the renovation itself
                before considering opportunity cost.
              </div>
            </div>
          )}

          {/* Side-by-side comparison */}
          <div className="card">
            <div className="card-title">Renovate vs. Invest — Cost Breakdown</div>
            <ComparisonChart
              data={calc.comparisonData}
              bars={[
                { dataKey: 'Renovate', label: `🔨 ${projectName}`, color: '#6c63ff' },
                { dataKey: 'Invest', label: '📈 Invest Instead', color: '#06d6a0' },
              ]}
              xKey="name"
              height={280}
            />
          </div>

          {/* Value projection over time */}
          <div className="card">
            <div className="card-title">
              {projectionYears}-Year Value Projection
            </div>
            <ProjectionChart
              data={calc.timeline}
              xKey="year"
              lines={[
                { dataKey: 'renovate', label: `${projectName} (3% appreciation)`, color: '#6c63ff' },
                { dataKey: 'invest', label: `Invest @ ${formatPercent(altReturn)}`, color: '#06d6a0', strokeDasharray: '5 3' },
              ]}
              height={280}
            />
          </div>

          {/* Summary Table */}
          <div className="card">
            <div className="card-title">Scenario Comparison</div>
            <div className="comparison-table">
              <div className="comparison-row header">
                <div />
                <div>Renovate</div>
                <div>Invest</div>
              </div>
              <div className="comparison-row">
                <div>Upfront Cost</div>
                <div><strong>{formatCurrency(calc.isFinanced ? 0 : projectCost)}</strong></div>
                <div><strong>{formatCurrency(projectCost)}</strong></div>
              </div>
              <div className="comparison-row">
                <div>Home Value Added</div>
                <div><strong>{formatCurrency(expectedValueAdd)}</strong></div>
                <div>—</div>
              </div>
              {calc.isFinanced && (
                <div className="comparison-row">
                  <div>Total Interest</div>
                  <div><strong>{formatCurrency(calc.totalInterest)}</strong></div>
                  <div>—</div>
                </div>
              )}
              <div className="comparison-row">
                <div>Value at {projectionYears}yr</div>
                <div><strong>{formatCurrency(calc.renovateNetValue)}</strong></div>
                <div><strong>{formatCurrency(calc.investNetValue)}</strong></div>
              </div>
              <div className="comparison-row highlight">
                <div>Net Advantage</div>
                <div colSpan={2}>
                  <strong style={{ color: netBenefitColor }}>
                    {calc.netBenefit >= 0 ? '+' : ''}{formatCurrency(calc.netBenefit)} → {netBenefitLabel}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="callout callout-info">
            <span className="callout-icon">ℹ️</span>
            <div>
              <strong>Assumptions:</strong> Home value appreciation at 3% annually.
              Investment returns at {formatPercent(altReturn)} annually.
              {calc.isFinanced
                ? ` ${financing === 'heloc' ? 'HELOC' : 'Personal loan'} at ${formatPercent(loanRate)} over ${loanTermYears} years.`
                : ' Renovation paid in cash — opportunity cost is the foregone market return.'}
              {' '}Renovation value is estimated and may vary based on local market conditions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
