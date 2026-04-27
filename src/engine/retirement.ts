/**
 * 401(k) and retirement projection calculations.
 * Uses Saul's 2026 financial data (financial-reference.md).
 * Pure TypeScript — no React dependencies.
 */

import type { RetirementInput, UserProfile, ScenarioResult, TimelinePoint, FilingStatus } from './types';
import {
  CONTRIBUTION_LIMIT_UNDER_50,
  CONTRIBUTION_LIMIT_CATCHUP_50,
  CONTRIBUTION_LIMIT_SUPER_CATCHUP_60_63,
  STANDARD_DEDUCTION_MFJ,
  STANDARD_DEDUCTION_SINGLE,
  STANDARD_DEDUCTION_HOH,
  FEDERAL_TAX_BRACKETS_MFJ,
  FEDERAL_TAX_BRACKETS_SINGLE,
  FEDERAL_TAX_BRACKETS_HOH,
  DEFAULT_INFLATION_RATE,
  DEFAULT_SAFE_WITHDRAWAL_RATE,
  SS_FULL_RETIREMENT_AGE,
  SS_EARLY_CLAIM_AGE,
  SS_DELAYED_CLAIM_AGE,
  SS_EARLY_REDUCTION_RATE,
  SS_DELAYED_BONUS_RATE,
} from './constants';
import { compoundGrowth, futureValue, adjustForInflation } from './projections';

// ── Extended Input Types ──────────────────────────────────────────
// Added by Linus: extends Danny's RetirementInput with age/income for projection math.

export interface Projection401kInput {
  currentAge: number;
  annualSalary: number;
  /** Percent of salary contributed (e.g. 10 = 10%) */
  contributionPercent: number;
  /** Employer match rate (e.g. 50 = 50¢ per dollar contributed) */
  employerMatchPercent: number;
  /** Employer matches up to this % of salary (e.g. 100 = all contributions up to limit) */
  employerMatchLimit: number;
  current401kBalance: number;
  currentIRABalance: number;
  targetRetirementAge: number;
  /** Annual return as decimal, e.g. 0.07 */
  expectedAnnualReturn: number;
  /** Annual salary growth rate (default 2.5%) */
  salaryGrowthRate?: number;
}

export interface RetirementReadinessInput extends Projection401kInput {
  filingStatus: FilingStatus;
  /** Monthly Social Security estimate at Full Retirement Age (from ssa.gov) */
  socialSecurityEstimate: number;
  /** Desired annual spending in retirement (today's dollars) */
  desiredAnnualIncome: number;
  /** Safe withdrawal rate override (default 3.5%) */
  withdrawalRate?: number;
}

export interface RothVsTraditionalInput {
  currentAge: number;
  annualSalary: number;
  filingStatus: FilingStatus;
  /** Annual 401k contribution amount in dollars */
  annualContribution: number;
  current401kBalance: number;
  targetRetirementAge: number;
  expectedAnnualReturn: number;
  /** Estimated marginal tax rate in retirement */
  retirementMarginalRate: number;
}

export interface RetirementReadinessResult {
  scenarioResult: ScenarioResult;
  requiredNestEgg: number;
  projectedNestEgg: number;
  retirementReadyAge: number | null;
  shortfall: number;
  monthlyRetirementIncome: { portfolio: number; socialSecurity: number; total: number };
  socialSecurityByClaimAge: { age62: number; age67: number; age70: number };
  warnings: string[];
}

export interface RothVsTraditionalResult {
  traditional: ScenarioResult;
  roth: ScenarioResult;
  /** True if Roth wins after-tax at retirement */
  rothWins: boolean;
  /** Breakeven retirement marginal tax rate (above this, Roth wins) */
  breakEvenRetirementRate: number;
  recommendation: string;
}

// ── Tax Calculation Helpers ───────────────────────────────────────

/** Returns the tax brackets for a given filing status */
function getBrackets(filingStatus: FilingStatus) {
  switch (filingStatus) {
    case 'married_filing_jointly': return FEDERAL_TAX_BRACKETS_MFJ;
    case 'head_of_household': return FEDERAL_TAX_BRACKETS_HOH;
    default: return FEDERAL_TAX_BRACKETS_SINGLE;
  }
}

/** Returns standard deduction for filing status */
function getStandardDeduction(filingStatus: FilingStatus): number {
  switch (filingStatus) {
    case 'married_filing_jointly': return STANDARD_DEDUCTION_MFJ;
    case 'head_of_household': return STANDARD_DEDUCTION_HOH;
    default: return STANDARD_DEDUCTION_SINGLE;
  }
}

/**
 * Calculate total federal income tax using progressive brackets.
 * @param taxableIncome - Income after standard/itemized deductions and pre-tax contributions
 * @param filingStatus - Federal filing status
 */
export function calculateFederalTax(taxableIncome: number, filingStatus: FilingStatus): number {
  if (taxableIncome <= 0) return 0;
  const brackets = getBrackets(filingStatus);
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return Math.round(tax);
}

/**
 * Find the marginal tax rate for a given taxable income.
 */
export function getMarginalRate(taxableIncome: number, filingStatus: FilingStatus): number {
  if (taxableIncome <= 0) return 0;
  const brackets = getBrackets(filingStatus);
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome > brackets[i].min) return brackets[i].rate;
  }
  return brackets[0].rate;
}

// ── 401k Contribution Limit Helper ───────────────────────────────

/**
 * Returns the applicable 401k employee contribution limit based on age.
 */
export function getContributionLimit(age: number): number {
  if (age >= 60 && age <= 63) return CONTRIBUTION_LIMIT_SUPER_CATCHUP_60_63;
  if (age >= 50) return CONTRIBUTION_LIMIT_CATCHUP_50;
  return CONTRIBUTION_LIMIT_UNDER_50;
}

// ── Core Projection Functions ─────────────────────────────────────

/**
 * Project 401(k) balance year-by-year from current age to retirement.
 * Accounts for salary growth, employer match, and contribution limits.
 *
 * @returns ScenarioResult with timeline of year-by-year balances and summary
 */
export function calculate401kProjection(input: Projection401kInput): ScenarioResult {
  const {
    currentAge,
    targetRetirementAge,
    expectedAnnualReturn,
    salaryGrowthRate = 0.025,
  } = input;

  const warnings: string[] = [];
  const timeline: TimelinePoint[] = [];

  if (currentAge >= targetRetirementAge) {
    warnings.push('Current age is at or past retirement age.');
    return {
      name: '401(k) Projection',
      description: 'Year-by-year 401(k) balance projection',
      timeline: [],
      summary: { totalContributed: 0, totalGrowth: 0, finalValue: input.current401kBalance },
      warnings,
    };
  }

  let balance = Math.max(0, input.current401kBalance) + Math.max(0, input.currentIRABalance);
  let salary = Math.max(0, input.annualSalary);
  let totalEmployeeContribs = 0;
  let totalEmployerMatch = 0;
  const monthlyRate = expectedAnnualReturn / 12;
  const yearsToRetire = targetRetirementAge - currentAge;

  timeline.push({ year: 0, age: currentAge, value: Math.round(balance) });

  for (let y = 1; y <= yearsToRetire; y++) {
    const age = currentAge + y - 1; // age during this year
    const limit = getContributionLimit(age);
    const employeeContrib = Math.min(salary * (input.contributionPercent / 100), limit);
    const matchableContrib = salary * (input.employerMatchLimit / 100);
    const employerMatch = Math.min(employeeContrib, matchableContrib) * (input.employerMatchPercent / 100);

    if (employeeContrib >= limit) {
      warnings.push(`Year ${y}: Contribution hits ${age >= 50 ? 'catch-up' : 'standard'} limit of $${limit.toLocaleString()}.`);
    }

    const monthlyEmployeeContrib = employeeContrib / 12;
    const monthlyEmployerContrib = employerMatch / 12;

    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyEmployeeContrib + monthlyEmployerContrib;
    }

    totalEmployeeContribs += employeeContrib;
    totalEmployerMatch += employerMatch;
    salary *= (1 + salaryGrowthRate);

    timeline.push({ year: y, age: currentAge + y, value: Math.round(balance) });
  }

  const totalContributed = totalEmployeeContribs + totalEmployerMatch;
  const totalGrowth = balance - (input.current401kBalance + input.currentIRABalance) - totalContributed;

  return {
    name: '401(k) Projection',
    description: `Projected balance from age ${currentAge} to ${targetRetirementAge}`,
    timeline,
    summary: {
      totalContributed: Math.round(totalContributed),
      totalGrowth: Math.round(totalGrowth),
      finalValue: Math.round(balance),
    },
    warnings: [...new Set(warnings.slice(0, 3))], // dedupe, cap warnings
  };
}

/**
 * Analyze retirement readiness: required nest egg, projected balance, and SS income.
 * Uses 3.5% safe withdrawal rate (Saul's recommendation) by default.
 */
export function calculateRetirementReadiness(input: RetirementReadinessInput): RetirementReadinessResult {
  const {
    currentAge,
    targetRetirementAge,
    desiredAnnualIncome,
    socialSecurityEstimate,
    withdrawalRate = DEFAULT_SAFE_WITHDRAWAL_RATE,
  } = input;

  const warnings: string[] = [];
  const yearsInRetirement = 95 - targetRetirementAge; // plan to age 95
  const yearsToRetirement = targetRetirementAge - currentAge;

  // Social Security adjustments by claim age
  const ssAtFRA = socialSecurityEstimate * 12; // annual at FRA (67)
  const ssAt62 = ssAtFRA * (1 - SS_EARLY_REDUCTION_RATE);
  const ssAt67 = ssAtFRA;
  const ssAt70 = ssAtFRA * (1 + SS_DELAYED_BONUS_RATE);

  // Required portfolio = (desiredIncome - SS at FRA) / SWR
  // Portfolio only needs to cover the gap SS doesn't cover
  const ssAnnual = ssAt67; // default: claim at FRA
  const portfolioIncomeNeeded = Math.max(0, desiredAnnualIncome - ssAnnual);
  const requiredNestEgg = portfolioIncomeNeeded / withdrawalRate;

  if (withdrawalRate > 0.04) {
    warnings.push('Using a withdrawal rate above 4% increases the risk of outliving your portfolio.');
  }
  if (yearsInRetirement > 35) {
    warnings.push(`Planning horizon of ${yearsInRetirement} years — consider a conservative 3.0–3.5% withdrawal rate.`);
  }

  // Project portfolio
  const projection = calculate401kProjection(input);
  const projectedNestEgg = projection.summary.finalValue;
  const shortfall = Math.max(0, requiredNestEgg - projectedNestEgg);

  // Find the age when portfolio crosses the required threshold
  let retirementReadyAge: number | null = null;
  for (const point of projection.timeline) {
    const ssAtPoint = point.age >= SS_FULL_RETIREMENT_AGE ? ssAt67 :
                      point.age >= SS_EARLY_CLAIM_AGE ? ssAt62 : 0;
    const neededAtPoint = Math.max(0, desiredAnnualIncome - ssAtPoint) / withdrawalRate;
    if (point.value >= neededAtPoint) {
      retirementReadyAge = point.age;
      break;
    }
  }

  if (shortfall > 0) {
    warnings.push(`Projected shortfall of $${Math.round(shortfall).toLocaleString()} vs. required nest egg.`);
  }
  if (!retirementReadyAge) {
    warnings.push('Portfolio may not reach your retirement goal by the target date — increase contributions or adjust expectations.');
  }

  const monthlyPortfolioIncome = (projectedNestEgg * withdrawalRate) / 12;
  const monthlySS = ssAt67 / 12;

  return {
    scenarioResult: projection,
    requiredNestEgg: Math.round(requiredNestEgg),
    projectedNestEgg: Math.round(projectedNestEgg),
    retirementReadyAge,
    shortfall: Math.round(shortfall),
    monthlyRetirementIncome: {
      portfolio: Math.round(monthlyPortfolioIncome),
      socialSecurity: Math.round(monthlySS),
      total: Math.round(monthlyPortfolioIncome + monthlySS),
    },
    socialSecurityByClaimAge: {
      age62: Math.round(ssAt62 / 12),
      age67: Math.round(ssAt67 / 12),
      age70: Math.round(ssAt70 / 12),
    },
    warnings,
  };
}

/**
 * Calculate annual federal tax savings from a pre-tax 401k contribution.
 *
 * @param contribution - Annual pre-tax 401k contribution amount
 * @param annualIncome - Gross annual income before deductions
 * @param filingStatus - Federal filing status
 * @returns Tax savings in dollars (how much less federal tax you pay)
 */
export function calculateTaxSavings(
  contribution: number,
  annualIncome: number,
  filingStatus: FilingStatus,
): { taxSavings: number; effectiveSavingsRate: number; marginalRate: number; warnings: string[] } {
  const warnings: string[] = [];
  const deduction = getStandardDeduction(filingStatus);
  const limit = getContributionLimit(0); // under-50 limit as a safe default

  const cappedContrib = Math.min(Math.max(0, contribution), limit);
  if (contribution > limit) {
    warnings.push(`Contribution $${contribution.toLocaleString()} exceeds 2026 limit of $${limit.toLocaleString()}.`);
  }

  const baselineTaxableIncome = Math.max(0, annualIncome - deduction);
  const reducedTaxableIncome = Math.max(0, annualIncome - deduction - cappedContrib);

  const baselineTax = calculateFederalTax(baselineTaxableIncome, filingStatus);
  const reducedTax = calculateFederalTax(reducedTaxableIncome, filingStatus);
  const taxSavings = baselineTax - reducedTax;
  const marginalRate = getMarginalRate(baselineTaxableIncome, filingStatus);

  return {
    taxSavings: Math.round(taxSavings),
    effectiveSavingsRate: cappedContrib > 0 ? taxSavings / cappedContrib : 0,
    marginalRate,
    warnings,
  };
}

/**
 * Compare Roth vs Traditional 401k outcomes over the accumulation period.
 *
 * Key insight: if marginal rate NOW > marginal rate in RETIREMENT → Traditional wins.
 * If marginal rate NOW < marginal rate in RETIREMENT → Roth wins.
 */
export function calculateRothVsTraditional(input: RothVsTraditionalInput): RothVsTraditionalResult {
  const {
    currentAge,
    annualSalary,
    filingStatus,
    annualContribution,
    current401kBalance,
    targetRetirementAge,
    expectedAnnualReturn,
    retirementMarginalRate,
  } = input;

  const yearsToRetire = Math.max(0, targetRetirementAge - currentAge);
  const monthlyRate = expectedAnnualReturn / 12;

  // Determine current marginal rate (applied to 401k contribution dollars)
  const deduction = getStandardDeduction(filingStatus);
  const taxableIncome = Math.max(0, annualSalary - deduction);
  const currentMarginalRate = getMarginalRate(taxableIncome, filingStatus);
  const currentTaxSavings = Math.round(annualContribution * currentMarginalRate);

  // ── Traditional 401(k) ──
  // Pre-tax contributions → balance grows tax-deferred → withdrawals taxed at retirement rate
  const tradTimeline: TimelinePoint[] = [{ year: 0, age: currentAge, value: Math.round(current401kBalance) }];
  let tradBalance = Math.max(0, current401kBalance);
  const monthlyContrib = annualContribution / 12;

  for (let y = 1; y <= yearsToRetire; y++) {
    for (let m = 0; m < 12; m++) {
      tradBalance = tradBalance * (1 + monthlyRate) + monthlyContrib;
    }
    tradTimeline.push({ year: y, age: currentAge + y, value: Math.round(tradBalance) });
  }
  // After-tax equivalent at retirement (withdrawals taxed at retirement rate)
  const tradAfterTax = tradBalance * (1 - retirementMarginalRate);

  // ── Roth 401(k) ──
  // Post-tax contributions → balance grows tax-free → withdrawals tax-free
  // With Roth, you pay taxes now. The contribution has the same nominal dollar amount,
  // but the after-tax "cost" is less if marginal rate is high now.
  // However, the traditional also gives tax savings NOW that can be invested.
  const rothTimeline: TimelinePoint[] = [{ year: 0, age: currentAge, value: Math.round(current401kBalance) }];
  let rothBalance = Math.max(0, current401kBalance);

  for (let y = 1; y <= yearsToRetire; y++) {
    for (let m = 0; m < 12; m++) {
      rothBalance = rothBalance * (1 + monthlyRate) + monthlyContrib;
    }
    rothTimeline.push({ year: y, age: currentAge + y, value: Math.round(rothBalance) });
  }
  // Roth final value is fully after-tax
  const rothAfterTax = rothBalance;

  // ── Traditional bonus: invest the tax savings ──
  // Traditional gives you a tax refund each year — if you invest those savings,
  // the real comparison is:  tradAfterTax vs rothAfterTax
  const annualTaxSavingsInvested = compoundGrowth(0, currentTaxSavings / 12, expectedAnnualReturn, yearsToRetire);
  const investedSavingsAtRetirement = annualTaxSavingsInvested[annualTaxSavingsInvested.length - 1]?.value ?? 0;
  const tradTotalAfterTax = tradAfterTax + investedSavingsAtRetirement * (1 - retirementMarginalRate);

  const rothWins = rothAfterTax > tradTotalAfterTax;

  // Breakeven: solve for rate where both are equal
  // rothBalance = tradBalance*(1-r) + investedSavings*(1-r)
  // rothBalance = (tradBalance + investedSavings) * (1-r)
  // 1 - r = rothBalance / (tradBalance + investedSavings)
  // r = 1 - (rothBalance / (tradBalance + investedSavings))
  const breakEvenRetirementRate = tradBalance + investedSavingsAtRetirement > 0
    ? Math.max(0, 1 - (rothBalance / (tradBalance + investedSavingsAtRetirement)))
    : 0;

  const recommendation = rothWins
    ? `Roth 401(k) projects $${Math.round((rothAfterTax - tradTotalAfterTax)).toLocaleString()} more after-tax at retirement. Your current ${(currentMarginalRate * 100).toFixed(0)}% rate is likely lower than your retirement rate of ${(retirementMarginalRate * 100).toFixed(0)}%.`
    : `Traditional 401(k) projects $${Math.round((tradTotalAfterTax - rothAfterTax)).toLocaleString()} more after-tax when you invest the $${currentTaxSavings.toLocaleString()}/yr tax savings. Your current ${(currentMarginalRate * 100).toFixed(0)}% marginal rate exceeds your estimated retirement rate of ${(retirementMarginalRate * 100).toFixed(0)}%.`;

  return {
    traditional: {
      name: 'Traditional 401(k)',
      description: 'Pre-tax contributions; withdrawals taxed at retirement rate',
      timeline: tradTimeline,
      summary: {
        totalContributed: Math.round(annualContribution * yearsToRetire),
        totalGrowth: Math.round(tradBalance - current401kBalance - annualContribution * yearsToRetire),
        finalValue: Math.round(tradAfterTax),
      },
      comparison: { vsBaseline: Math.round(tradAfterTax - rothAfterTax) },
      warnings: [],
    },
    roth: {
      name: 'Roth 401(k)',
      description: 'Post-tax contributions; all withdrawals tax-free',
      timeline: rothTimeline,
      summary: {
        totalContributed: Math.round(annualContribution * yearsToRetire),
        totalGrowth: Math.round(rothBalance - current401kBalance - annualContribution * yearsToRetire),
        finalValue: Math.round(rothAfterTax),
      },
      comparison: { vsBaseline: Math.round(rothAfterTax - tradAfterTax) },
      warnings: [],
    },
    rothWins,
    breakEvenRetirementRate: Math.round(breakEvenRetirementRate * 1000) / 1000,
    recommendation,
  };
}

/**
 * Show the financial impact of maxing out 401k contributions vs current rate.
 *
 * @param annualSalary - Gross annual salary
 * @param currentContribPercent - Current contribution percent (e.g. 6 for 6%)
 * @param currentAge - Current age (determines contribution limit)
 * @param profile - User profile (age, income, filingStatus)
 * @param retirementInput - Retirement scenario parameters
 */
export function calculateMaxContributionImpact(
  annualSalary: number,
  currentContribPercent: number,
  currentAge: number,
  retirementInput: Omit<Projection401kInput, 'contributionPercent' | 'annualSalary' | 'currentAge'>,
): { current: ScenarioResult; maxed: ScenarioResult; additionalWealth: number; additionalMonthly: number; warnings: string[] } {
  const warnings: string[] = [];
  const limit = getContributionLimit(currentAge);
  const maxContribPercent = (limit / annualSalary) * 100;

  if (currentContribPercent * annualSalary / 100 >= limit) {
    warnings.push('You are already contributing at or above the annual limit.');
  }

  const baseInput: Projection401kInput = {
    ...retirementInput,
    currentAge,
    annualSalary,
    contributionPercent: currentContribPercent,
  };

  const maxInput: Projection401kInput = {
    ...baseInput,
    contributionPercent: maxContribPercent,
  };

  const currentScenario = calculate401kProjection(baseInput);
  const maxedScenario = calculate401kProjection(maxInput);

  const additionalWealth = maxedScenario.summary.finalValue - currentScenario.summary.finalValue;
  const yearsToRetire = retirementInput.targetRetirementAge - currentAge;
  const additionalMonthly = yearsToRetire > 0
    ? additionalWealth / (yearsToRetire * 12)
    : 0;

  return {
    current: currentScenario,
    maxed: maxedScenario,
    additionalWealth: Math.round(additionalWealth),
    additionalMonthly: Math.round(additionalMonthly),
    warnings,
  };
}

// ── Legacy adapters (keep Danny's scaffold function signatures working) ───

/**
 * @deprecated Use calculate401kProjection() with Projection401kInput instead.
 * Kept for backward compatibility with Danny's scaffolded signature.
 */
export function projectRetirement(
  profile: UserProfile,
  input: RetirementInput,
): ScenarioResult {
  return calculate401kProjection({
    currentAge: profile.age,
    annualSalary: profile.annualIncome,
    contributionPercent: input.contributionPercent,
    employerMatchPercent: input.employerMatchPercent,
    employerMatchLimit: input.employerMatchLimit,
    current401kBalance: input.current401kBalance,
    currentIRABalance: input.currentIRABalance,
    targetRetirementAge: input.targetRetirementAge,
    expectedAnnualReturn: input.expectedAnnualReturn,
  });
}

/**
 * @deprecated Use calculateMaxContributionImpact() instead.
 * Kept for backward compatibility with Danny's scaffolded signature.
 */
export function calculate401kMaxOut(
  profile: UserProfile,
  input: RetirementInput,
): ScenarioResult {
  const result = calculateMaxContributionImpact(
    profile.annualIncome,
    input.contributionPercent,
    profile.age,
    {
      employerMatchPercent: input.employerMatchPercent,
      employerMatchLimit: input.employerMatchLimit,
      current401kBalance: input.current401kBalance,
      currentIRABalance: input.currentIRABalance,
      targetRetirementAge: input.targetRetirementAge,
      expectedAnnualReturn: input.expectedAnnualReturn,
    },
  );
  return result.maxed;
}
