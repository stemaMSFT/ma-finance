/**
 * FIRE (Financial Independence, Retire Early) Calculation Engine.
 * Supports Lean / Regular / Chubby / Fat / Coast FIRE variants.
 * Pure TypeScript — no React dependencies.
 */

import type { FIREConfig, FIREResult, FIREScenarioComparison, FIREVariant } from './types';
import {
  FIRE_DEFAULT_SWR,
  FIRE_GROWTH_RATE_NOMINAL,
} from './constants';

// ── Spending Tier Definitions ─────────────────────────────────────

/** FIRE spending tiers calibrated for a Seattle tech couple (Saul's research, 2026). */
export const FIRE_SPENDING_TIERS: Record<
  Exclude<FIREVariant, 'custom'>,
  { label: string; annualExpenses: number; description: string }
> = {
  lean: {
    label: 'Lean FIRE',
    annualExpenses: 50_000,
    description: '$45K–$60K/yr — minimal lifestyle, outside Seattle',
  },
  regular: {
    label: 'Regular FIRE',
    annualExpenses: 100_000,
    description: '$80K–$120K/yr — comfortable lifestyle',
  },
  chubby: {
    label: 'Chubby FIRE',
    annualExpenses: 130_000,
    description: '$130K/yr — recommended default for Seattle tech couple',
  },
  fat: {
    label: 'Fat FIRE',
    annualExpenses: 160_000,
    description: '$160K–$200K+/yr — luxurious lifestyle',
  },
};

// ── Core Math Functions ───────────────────────────────────────────

/**
 * Calculate the FIRE Number — the portfolio size required to sustain
 * a given annual spending rate indefinitely at the specified SWR.
 *
 * Formula: FIRE Number = Annual Expenses / Safe Withdrawal Rate
 *
 * @param annualExpenses - Annual spending in today's dollars
 * @param swr - Safe withdrawal rate as decimal (default 3.5%)
 * @returns Required portfolio size at retirement
 */
export function calcFIRENumber(
  annualExpenses: number,
  swr: number = FIRE_DEFAULT_SWR,
): number {
  if (swr <= 0) throw new RangeError('Safe withdrawal rate must be positive');
  return annualExpenses / swr;
}

/**
 * Calculate the Coast FIRE Number — the portfolio value TODAY that will
 * compound to the FIRE Number by target retirement age with no additional
 * contributions.
 *
 * Formula: CoastFIRE = FIRE Number / (1 + growthRate)^yearsToRetirement
 *
 * @param fireNumber - Full FIRE portfolio target
 * @param growthRate - Expected nominal annual growth rate (default 7%)
 * @param yearsToRetirement - Years remaining until target retirement age
 * @returns Portfolio value needed now to coast to FIRE without new savings
 */
export function calcCoastFIRENumber(
  fireNumber: number,
  growthRate: number = FIRE_GROWTH_RATE_NOMINAL,
  yearsToRetirement: number,
): number {
  if (yearsToRetirement < 0) throw new RangeError('yearsToRetirement must be ≥ 0');
  if (yearsToRetirement === 0) return fireNumber;
  return fireNumber / Math.pow(1 + growthRate, yearsToRetirement);
}

/**
 * Calculate the number of years until the portfolio reaches the FIRE Number,
 * using year-by-year iteration: portfolio × (1+r)^n + savings × [(1+r)^n - 1] / r
 *
 * Returns Infinity if the portfolio never reaches the target (e.g., no savings
 * and portfolio is already below FIRE Number with no growth path).
 *
 * @param currentPortfolio - Current invested assets
 * @param annualSavings - Annual contribution amount
 * @param growthRate - Expected annual growth rate
 * @param fireNumber - Target FIRE portfolio value
 * @param maxYears - Safety cap for iteration (default 80)
 * @returns Number of years (fractional) to reach FIRE Number
 */
export function calcYearsToFIRE(
  currentPortfolio: number,
  annualSavings: number,
  growthRate: number,
  fireNumber: number,
  maxYears = 80,
): number {
  if (currentPortfolio >= fireNumber) return 0;
  if (annualSavings <= 0 && growthRate <= 0) return Infinity;

  let portfolio = currentPortfolio;
  for (let year = 1; year <= maxYears; year++) {
    portfolio = portfolio * (1 + growthRate) + annualSavings;
    if (portfolio >= fireNumber) {
      // Interpolate for a fractional year
      const prevPortfolio = (portfolio - annualSavings) / (1 + growthRate);
      const needed = fireNumber - prevPortfolio * (1 + growthRate);
      const fraction = growthRate > 0 ? needed / (annualSavings || 1e-9) : 0;
      return year - 1 + Math.max(0, Math.min(1, fraction));
    }
  }
  return Infinity;
}

/**
 * Determine the age at which the portfolio first crosses the Coast FIRE
 * threshold line — the declining curve that meets the FIRE Number at
 * the target retirement age.
 *
 * @param currentPortfolio - Current invested assets
 * @param annualSavings - Annual contribution amount
 * @param growthRate - Expected annual growth rate
 * @param fireNumber - Full FIRE portfolio target
 * @param currentAge - Investor's current age
 * @param targetRetirementAge - Age at which full FIRE is targeted
 * @returns Age at which portfolio surpasses the coast threshold, or null if never
 */
export function calcCoastFIREAge(
  currentPortfolio: number,
  annualSavings: number,
  growthRate: number,
  fireNumber: number,
  currentAge: number,
  targetRetirementAge: number,
): number | null {
  let portfolio = currentPortfolio;

  for (let year = 0; year <= targetRetirementAge - currentAge; year++) {
    const age = currentAge + year;
    const yearsLeft = targetRetirementAge - age;
    const coastThreshold = calcCoastFIRENumber(fireNumber, growthRate, yearsLeft);
    if (portfolio >= coastThreshold) return age;
    // Grow portfolio for next year (before checking the next age)
    portfolio = portfolio * (1 + growthRate) + annualSavings;
  }
  return null;
}

// ── Full Analysis ─────────────────────────────────────────────────

/**
 * Run a full FIRE analysis for a given configuration, producing:
 * - FIRE Number and Coast FIRE Number
 * - Years / age to reach each milestone
 * - Year-by-year portfolio timeline with coast threshold overlay
 * - Milestone labels for chart annotation
 *
 * @param config - FIRE configuration (see FIREConfig)
 * @returns Complete FIREResult with timeline and milestones
 */
export function runFIREAnalysis(config: FIREConfig): FIREResult {
  const {
    annualExpenses,
    safeWithdrawalRate,
    expectedGrowthRate,
    currentPortfolio,
    annualSavings,
    currentAge,
    targetRetirementAge,
    variant,
  } = config;

  const fireNumber = calcFIRENumber(annualExpenses, safeWithdrawalRate);
  const yearsToRetirement = Math.max(0, targetRetirementAge - currentAge);
  const coastFIRENumber = calcCoastFIRENumber(fireNumber, expectedGrowthRate, yearsToRetirement);

  const yearsToFIRE = calcYearsToFIRE(
    currentPortfolio,
    annualSavings,
    expectedGrowthRate,
    fireNumber,
  );
  const fireAge = yearsToFIRE === Infinity ? Infinity : currentAge + yearsToFIRE;

  const coastFIREAgeResult = calcCoastFIREAge(
    currentPortfolio,
    annualSavings,
    expectedGrowthRate,
    fireNumber,
    currentAge,
    targetRetirementAge,
  );
  const coastFIREAge = coastFIREAgeResult ?? (currentAge + yearsToRetirement + 1);
  const yearsToCoastFIRE = Math.max(0, coastFIREAge - currentAge);

  // Savings rate: annualSavings as fraction of gross income is unknown here,
  // so we express it relative to what would be needed to hit FIRE at target age.
  // The caller should override this if they have gross income.
  const savingsRate = annualSavings / (annualSavings + annualExpenses);

  // Build year-by-year timeline out to max(fireAge, targetRetirementAge) + 5
  const horizonYears = Math.min(
    80,
    Math.max(yearsToRetirement + 5, isFinite(yearsToFIRE) ? Math.ceil(yearsToFIRE) + 2 : 50),
  );

  const portfolioTimeline: FIREResult['portfolioTimeline'] = [];
  let portfolio = currentPortfolio;
  let coastFIRECrossed = false;
  let fireCrossed = false;

  for (let year = 0; year <= horizonYears; year++) {
    const age = currentAge + year;
    const yearsLeft = Math.max(0, targetRetirementAge - age);
    const coastThreshold = calcCoastFIRENumber(fireNumber, expectedGrowthRate, yearsLeft);

    const isCoastFIRE = portfolio >= coastThreshold;
    const isFIRE = portfolio >= fireNumber;

    portfolioTimeline.push({
      age,
      year,
      portfolio: Math.round(portfolio),
      coastThreshold: Math.round(coastThreshold),
      isCoastFIRE,
      isFIRE,
    });

    if (!coastFIRECrossed && isCoastFIRE) coastFIRECrossed = true;
    if (!fireCrossed && isFIRE) fireCrossed = true;

    // Don't grow past horizon
    if (year < horizonYears) {
      portfolio = portfolio * (1 + expectedGrowthRate) + annualSavings;
    }
  }

  // Milestones
  const milestones: FIREResult['milestones'] = [
    { label: 'Coast FIRE', age: Math.round(coastFIREAge), amount: Math.round(coastFIRENumber) },
    {
      label: `${variant.charAt(0).toUpperCase()}${variant.slice(1)} FIRE`,
      age: isFinite(fireAge) ? Math.round(fireAge) : 999,
      amount: Math.round(fireNumber),
    },
    {
      label: '25× Rule (4% SWR)',
      age: Math.round(
        currentAge +
          calcYearsToFIRE(
            currentPortfolio,
            annualSavings,
            expectedGrowthRate,
            annualExpenses * 25,
          ),
      ),
      amount: Math.round(annualExpenses * 25),
    },
  ];

  return {
    fireNumber: Math.round(fireNumber),
    coastFIRENumber: Math.round(coastFIRENumber),
    yearsToFIRE,
    fireAge: isFinite(fireAge) ? fireAge : Infinity,
    coastFIREAge: Math.round(coastFIREAge),
    yearsToCoastFIRE,
    savingsRate,
    variant,
    portfolioTimeline,
    milestones,
  };
}

// ── Scenario Comparison ───────────────────────────────────────────

/**
 * Compare all four standard FIRE variants (Lean / Regular / Chubby / Fat)
 * against the same base configuration (portfolio, savings, growth rate).
 *
 * @param baseConfig - Caller's FIREConfig; annualExpenses and variant are overridden per tier
 * @returns Array of FIREScenarioComparison, one per variant
 */
export function compareFIREScenarios(baseConfig: FIREConfig): FIREScenarioComparison[] {
  const variants: Exclude<FIREVariant, 'custom'>[] = ['lean', 'regular', 'chubby', 'fat'];

  return variants.map((variant) => {
    const tier = FIRE_SPENDING_TIERS[variant];
    const config: FIREConfig = {
      ...baseConfig,
      variant,
      annualExpenses: tier.annualExpenses,
    };
    const result = runFIREAnalysis(config);
    return {
      variant,
      annualExpenses: tier.annualExpenses,
      fireNumber: result.fireNumber,
      coastFIRENumber: result.coastFIRENumber,
      yearsToFIRE: result.yearsToFIRE,
      fireAge: result.fireAge,
    };
  });
}

// ── Default Config ────────────────────────────────────────────────

/**
 * Returns Steven's default FIRE configuration:
 * - Age 27, $95K current portfolio
 * - Chubby FIRE target ($130K/yr, $3.71M FIRE Number at 3.5% SWR)
 * - 3.5% SWR, 7% nominal growth
 * - Target retirement age: 50
 *
 * @returns Populated FIREConfig with Steven's defaults
 */
export function getDefaultFIREConfig(): FIREConfig {
  return {
    variant: 'chubby',
    annualExpenses: FIRE_SPENDING_TIERS.chubby.annualExpenses,
    safeWithdrawalRate: FIRE_DEFAULT_SWR,
    expectedGrowthRate: FIRE_GROWTH_RATE_NOMINAL,
    currentPortfolio: 95_000,
    annualSavings: 60_000,    // estimated combined savings from comp engine
    currentAge: 27,
    targetRetirementAge: 50,
  };
}
