/**
 * Comprehensive Retirement Projection Engine
 *
 * Projects Steven's finances from age 27 to 65 using Saul's three-track
 * promotion velocity model: fast/average/slow with weighted expected values.
 * Includes promotion-aware comp growth, lifecycle glide path returns,
 * 401k with growing IRS limits + catch-up, ESPP, taxes, Social Security,
 * and safe withdrawal rate analysis.
 *
 * Pure TypeScript — no React dependencies.
 */

import type {
  FilingStatus,
  ProjectionConfig,
  YearlyProjection,
  CompYearProjection,
  RetirementReadiness,
  ScenarioComparison,
  PromotionEvent,
  LevelCompParams,
  GlidePath,
  SSClaimAge,
  VelocityTrack,
  TrackWeights,
  WeightedProjection,
} from './types';

import { STEVEN_COMP } from '../config/household';

import {
  CONTRIBUTION_LIMIT_UNDER_50,
  MSFT_MATCH_PERCENT,
  SS_WAGE_BASE,
  SS_TAX_RATE,
  MEDICARE_TAX_RATE,
  MEDICARE_SURTAX_THRESHOLD_MFJ,
  MEDICARE_SURTAX_RATE,
  STANDARD_DEDUCTION_MFJ,
  STANDARD_DEDUCTION_SINGLE,
  STANDARD_DEDUCTION_HOH,
  FEDERAL_TAX_BRACKETS_MFJ,
  FEDERAL_TAX_BRACKETS_SINGLE,
  FEDERAL_TAX_BRACKETS_HOH,
  DEFAULT_INFLATION_RATE,
  DEFAULT_SAFE_WITHDRAWAL_RATE,
} from './constants';

// ── Helpers ──────────────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n);
}

function getBrackets(status: FilingStatus) {
  switch (status) {
    case 'married_filing_jointly': return FEDERAL_TAX_BRACKETS_MFJ;
    case 'head_of_household': return FEDERAL_TAX_BRACKETS_HOH;
    default: return FEDERAL_TAX_BRACKETS_SINGLE;
  }
}

function getDeduction(status: FilingStatus): number {
  switch (status) {
    case 'married_filing_jointly': return STANDARD_DEDUCTION_MFJ;
    case 'head_of_household': return STANDARD_DEDUCTION_HOH;
    default: return STANDARD_DEDUCTION_SINGLE;
  }
}

function calcFederalTax(taxableIncome: number, status: FilingStatus): number {
  if (taxableIncome <= 0) return 0;
  const brackets = getBrackets(status);
  let tax = 0;
  for (const b of brackets) {
    if (taxableIncome <= b.min) break;
    tax += (Math.min(taxableIncome, b.max) - b.min) * b.rate;
  }
  return round(tax);
}

function calcFICA(salary: number, filingStatus: FilingStatus): number {
  const ssTax = Math.min(salary, SS_WAGE_BASE) * SS_TAX_RATE;
  const medicareTax = salary * MEDICARE_TAX_RATE;
  // Medicare surtax for high earners (MFJ threshold)
  const surtaxThreshold = filingStatus === 'married_filing_jointly'
    ? MEDICARE_SURTAX_THRESHOLD_MFJ : 200_000;
  const surtax = salary > surtaxThreshold
    ? (salary - surtaxThreshold) * MEDICARE_SURTAX_RATE : 0;
  return round(ssTax + medicareTax + surtax);
}

/** Get the market return rate for a given age from the glide path */
function getMarketReturn(age: number, glidePath: GlidePath[], override?: number): number {
  if (override !== undefined) return override;
  for (const band of glidePath) {
    if (age >= band.minAge && age <= band.maxAge) return band.annualReturn;
  }
  // Default to last band if past all ranges
  return glidePath[glidePath.length - 1]?.annualReturn ?? 0.065;
}

/** Calculate 401k contribution limit for a given age and year */
function calc401kLimit(
  age: number,
  baseLimit: number,
  yearsFromStart: number,
  limitGrowthRate: number,
  catchUp: number,
  superCatchUp: number,
): number {
  // IRS limits grow ~2%/yr, rounded to nearest $500 by IRS (we approximate)
  const adjustedBase = baseLimit * Math.pow(1 + limitGrowthRate, yearsFromStart);
  const roundedBase = Math.round(adjustedBase / 500) * 500;

  if (age >= 60 && age <= 63) return roundedBase + catchUp + superCatchUp;
  if (age >= 50) return roundedBase + catchUp;
  return roundedBase;
}

/** Social Security benefit based on claim age */
function calcSSBenefit(monthlyPIA: number, claimAge: SSClaimAge): number {
  switch (claimAge) {
    case 62: return monthlyPIA * 0.70;   // 30% reduction
    case 67: return monthlyPIA * 1.00;   // full benefit
    case 70: return monthlyPIA * 1.24;   // 24% bonus
  }
}

// ── Three-Track Promotion Velocity Model (from Saul's research) ──

/** Track-specific promotion schedules */
export const TRACK_PROMOTIONS: Record<VelocityTrack, PromotionEvent[]> = {
  fast: [
    // L62→L63 at age 29-30 (2.5 years from 27)
    { fromLevel: 62, toLevel: 63, atAge: 30, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
    // L63→L64 at age 33-34 (3.5 years after L63)
    { fromLevel: 63, toLevel: 64, atAge: 33, baseBumpPercent: 0.15, stockBumpPercent: 0.40, newStockAward: 35_000, newBonusTargetPercent: 0.15 },
    // L64→L65 at age 37-38 (4 years after L64)
    { fromLevel: 64, toLevel: 65, atAge: 37, baseBumpPercent: 0.15, stockBumpPercent: 0.60, newStockAward: 35_000, newBonusTargetPercent: 0.15 },
  ],
  average: [
    // L62→L63 at age 31 (3.5 years)
    { fromLevel: 62, toLevel: 63, atAge: 31, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
    // L63→L64 at age 35 (4.5 years)
    { fromLevel: 63, toLevel: 64, atAge: 35, baseBumpPercent: 0.10, stockBumpPercent: 0.40, newStockAward: 35_000, newBonusTargetPercent: 0.15 },
    // Terminal: L64
  ],
  slow: [
    // L62→L63 at age 33 (5.5 years — if ever)
    { fromLevel: 62, toLevel: 63, atAge: 33, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
    // Terminal: L63
  ],
};

/** Track-specific merit rates (Saul Section F.3) */
export const TRACK_MERIT_RATES: Record<VelocityTrack, number> = {
  fast: 0.05,     // 5% base merit
  average: 0.035, // 3.5% base merit
  slow: 0.025,    // 2.5% base merit
};

/** Track-specific level params with stock refresh growth */
const TRACK_LEVEL_PARAMS: Record<VelocityTrack, Record<number, LevelCompParams>> = {
  fast: {
    62: { meritPercent: 0.05, bonusTargetPercent: 0.12, stockAward: 18_000 },
    63: { meritPercent: 0.05, bonusTargetPercent: 0.15, stockAward: 25_000 },
    64: { meritPercent: 0.05, bonusTargetPercent: 0.15, stockAward: 35_000 },
    65: { meritPercent: 0.05, bonusTargetPercent: 0.15, stockAward: 35_000 },
  },
  average: {
    62: { meritPercent: 0.035, bonusTargetPercent: 0.12, stockAward: 18_000 },
    63: { meritPercent: 0.035, bonusTargetPercent: 0.15, stockAward: 25_000 },
    64: { meritPercent: 0.035, bonusTargetPercent: 0.15, stockAward: 35_000 },
    65: { meritPercent: 0.035, bonusTargetPercent: 0.15, stockAward: 35_000 },
  },
  slow: {
    62: { meritPercent: 0.025, bonusTargetPercent: 0.12, stockAward: 18_000 },
    63: { meritPercent: 0.025, bonusTargetPercent: 0.15, stockAward: 25_000 },
    64: { meritPercent: 0.025, bonusTargetPercent: 0.15, stockAward: 35_000 },
    65: { meritPercent: 0.025, bonusTargetPercent: 0.15, stockAward: 35_000 },
  },
};

/** Default track weights: 50% fast, 35% average, 15% slow */
export const DEFAULT_TRACK_WEIGHTS: TrackWeights = { fast: 0.50, average: 0.35, slow: 0.15 };

/** Level-specific comp params from Saul's research (default = fast track) */
const DEFAULT_LEVEL_PARAMS: Record<number, LevelCompParams> = TRACK_LEVEL_PARAMS.fast;

/** Default lifecycle glide path from Saul's research */
const DEFAULT_GLIDE_PATH: GlidePath[] = [
  { minAge: 27, maxAge: 40, annualReturn: 0.080, stockAllocation: 0.90, bondAllocation: 0.10 },
  { minAge: 41, maxAge: 55, annualReturn: 0.065, stockAllocation: 0.70, bondAllocation: 0.30 },
  { minAge: 56, maxAge: 60, annualReturn: 0.055, stockAllocation: 0.50, bondAllocation: 0.50 },
  { minAge: 61, maxAge: 65, annualReturn: 0.040, stockAllocation: 0.30, bondAllocation: 0.70 },
];

/**
 * Promotion schedule defaults to fast track (Saul's recommendation).
 * Fast track: L63 at 30, L64 at 33, L65 at 37
 */
const DEFAULT_PROMOTIONS: PromotionEvent[] = TRACK_PROMOTIONS.fast;

/** Build Steven's default base-case config */
export function createDefaultConfig(overrides: Partial<ProjectionConfig> = {}): ProjectionConfig {
  return {
    currentAge: 27,
    retirementAge: 65,
    currentYear: 2026,

    currentBase: STEVEN_COMP.baseSalary,
    currentLevel: 62,
    currentBonusTargetPercent: 0.12,
    currentStockAward: STEVEN_COMP.rsuAnnual,

    promotions: DEFAULT_PROMOTIONS,
    levelParams: DEFAULT_LEVEL_PARAMS,

    current401kBalance: 55_000,  // estimated Roth + Traditional combined
    currentRothBalance: 55_000,
    rothToTraditionalSwitchYear: 2026,
    rothContribInSwitchYear: 7_393,
    employerMatchRate: MSFT_MATCH_PERCENT,
    base401kLimit: CONTRIBUTION_LIMIT_UNDER_50,
    irsLimitGrowthRate: 0.02,
    catchUpAmount: 7_500,
    superCatchUpAmount: 5_000,

    annualEsppContribution: 18_740,
    esppDiscountPercent: 0.15,

    glidePath: DEFAULT_GLIDE_PATH,
    inflationRate: DEFAULT_INFLATION_RATE,

    ssMonthlyPIA: 3_800,
    ssClaimAge: 67,

    filingStatus: 'married_filing_jointly',

    safeWithdrawalRate: DEFAULT_SAFE_WITHDRAWAL_RATE,

    velocityTrack: 'fast',
    trackWeights: DEFAULT_TRACK_WEIGHTS,

    scenarioName: 'base',
    ...overrides,
  };
}


// ── Core: Compensation Growth Projection ─────────────────────────

export interface CompGrowthConfig {
  currentAge: number;
  retirementAge: number;
  currentYear: number;
  currentBase: number;
  currentLevel: number;
  currentBonusTargetPercent: number;
  currentStockAward: number;
  promotions: PromotionEvent[];
  levelParams: Record<number, LevelCompParams>;
  overrideMeritRate?: number;
}

/**
 * Project compensation growth year-by-year with promotion events.
 * Returns comp-only trajectory (no portfolio/tax modeling).
 */
export function projectCompensationGrowth(config: CompGrowthConfig): CompYearProjection[] {
  const {
    currentAge, retirementAge, currentYear,
    currentBase, currentLevel, currentBonusTargetPercent,
    currentStockAward, promotions, levelParams,
    overrideMeritRate,
  } = config;

  const years = retirementAge - currentAge;
  const result: CompYearProjection[] = [];

  let base = currentBase;
  let level = currentLevel;
  let bonusTarget = currentBonusTargetPercent;
  let stock = currentStockAward;

  // Year 0 = current state
  const bonus0 = round(base * bonusTarget);
  result.push({
    year: 0,
    calendarYear: currentYear,
    age: currentAge,
    level,
    baseSalary: round(base),
    bonus: bonus0,
    stockAward: round(stock),
    totalCash: round(base + bonus0),
    totalComp: round(base + bonus0 + stock),
    promotedThisYear: false,
    meritRate: 0,
  });

  for (let y = 1; y <= years; y++) {
    const age = currentAge + y;
    const calYear = currentYear + y;
    let promoted = false;

    // Check for promotion this year
    const promo = promotions.find(p => p.fromLevel === level && p.atAge === age);
    if (promo) {
      // Apply promotion bump
      base = round(base * (1 + promo.baseBumpPercent));
      level = promo.toLevel;
      stock = promo.newStockAward;
      bonusTarget = promo.newBonusTargetPercent;
      promoted = true;
    }

    // Apply merit (on top of any promotion bump)
    const lp = levelParams[level] ?? levelParams[62]!;
    const meritRate = overrideMeritRate ?? lp.meritPercent;
    base = round(base * (1 + meritRate));

    // If not promoted, stock stays at level's award (refreshes each year)
    if (!promoted) {
      stock = lp.stockAward;
    }

    const bonus = round(base * bonusTarget);
    result.push({
      year: y,
      calendarYear: calYear,
      age,
      level,
      baseSalary: round(base),
      bonus,
      stockAward: round(stock),
      totalCash: round(base + bonus),
      totalComp: round(base + bonus + stock),
      promotedThisYear: promoted,
      meritRate,
    });
  }

  return result;
}


// ── Core: Full Retirement Timeline Projection ────────────────────

/**
 * Projects the full retirement timeline from current age to retirement.
 * Integrates comp growth, 401k, ESPP, taxes, portfolio, and inflation.
 *
 * @returns Year-by-year array of YearlyProjection from age 30 to 65
 */
export function projectRetirementTimeline(config: ProjectionConfig): YearlyProjection[] {
  const {
    currentAge, retirementAge, currentYear,
    currentBase, currentLevel, currentBonusTargetPercent, currentStockAward,
    promotions, levelParams,
    current401kBalance,
    rothToTraditionalSwitchYear,
    employerMatchRate,
    base401kLimit, irsLimitGrowthRate, catchUpAmount, superCatchUpAmount,
    annualEsppContribution, esppDiscountPercent,
    glidePath, inflationRate,
    filingStatus,
    overrideMarketReturn, overrideMeritRate,
  } = config;

  const years = retirementAge - currentAge;
  const timeline: YearlyProjection[] = [];

  // First project comp growth
  const compProjection = projectCompensationGrowth({
    currentAge, retirementAge, currentYear,
    currentBase, currentLevel, currentBonusTargetPercent, currentStockAward,
    promotions, levelParams, overrideMeritRate,
  });

  let portfolioBalance = current401kBalance;

  for (let y = 0; y <= years; y++) {
    const comp = compProjection[y]!;
    const age = currentAge + y;
    const calYear = currentYear + y;
    const milestones: string[] = [];

    // ── 401k ──
    const limit = calc401kLimit(
      age, base401kLimit, y, irsLimitGrowthRate,
      catchUpAmount, superCatchUpAmount,
    );

    let employeeContrib: number;
    let isRoth: boolean;

    if (y === 0) {
      // Partial year: switch year — Roth already contributed + Traditional for rest
      employeeContrib = limit; // maxing out
      isRoth = false; // mixed, but marking as Traditional going forward
    } else {
      // Full year Traditional (post-switch)
      employeeContrib = limit; // Steven is maxing out
      isRoth = calYear < rothToTraditionalSwitchYear;
    }

    // Employer match: 50% of employee contribution, capped at 50% of base IRS limit
    const matchCap = round(base401kLimit * Math.pow(1 + irsLimitGrowthRate, y) * employerMatchRate);
    const employerMatch = Math.min(round(employeeContrib * employerMatchRate), matchCap);

    // ── ESPP ──
    // ESPP contribution grows roughly with salary (capped at IRS limit $25k/period)
    const esppContrib = round(annualEsppContribution * Math.pow(1 + inflationRate, y));
    const esppBenefit = round(esppContrib * esppDiscountPercent / (1 - esppDiscountPercent));

    // ── Taxes (simplified annual) ──
    const grossIncome = comp.baseSalary + comp.bonus + comp.stockAward;
    // Traditional 401k reduces taxable income
    const preTaxDeduction = isRoth ? 0 : employeeContrib;
    const deduction = getDeduction(filingStatus);
    const taxableIncome = Math.max(0, grossIncome - preTaxDeduction - deduction);
    const fedTax = calcFederalTax(taxableIncome, filingStatus);
    const fica = calcFICA(comp.baseSalary, filingStatus);
    const totalTax = fedTax + fica;
    const takeHome = round(grossIncome - totalTax - employeeContrib - esppContrib);

    // ── Portfolio Growth ──
    const beginBal = portfolioBalance;
    const marketReturn = getMarketReturn(age, glidePath, overrideMarketReturn);

    // Total annual inflow: employee 401k + employer match + ESPP benefit
    const annualInflow = employeeContrib + employerMatch + esppBenefit;

    // Monthly compounding with monthly inflows
    const monthlyReturn = marketReturn / 12;
    const monthlyInflow = annualInflow / 12;
    let bal = beginBal;
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + monthlyReturn) + monthlyInflow;
    }
    const investmentReturn = round(bal - beginBal - annualInflow);
    portfolioBalance = round(bal);

    // Inflation-adjusted values
    const realBalance = round(portfolioBalance / Math.pow(1 + inflationRate, y));
    const realComp = round(comp.totalComp / Math.pow(1 + inflationRate, y));

    // Milestones
    if (comp.promotedThisYear) {
      milestones.push(`Promoted to L${comp.level}`);
    }
    if (age === 50) milestones.push('401k catch-up eligible (+$7,500)');
    if (age === 60) milestones.push('401k super catch-up eligible (+$5,000)');
    if (portfolioBalance >= 1_000_000 && beginBal < 1_000_000) {
      milestones.push('Portfolio crosses $1M');
    }
    if (portfolioBalance >= 2_000_000 && beginBal < 2_000_000) {
      milestones.push('Portfolio crosses $2M');
    }
    if (portfolioBalance >= 3_000_000 && beginBal < 3_000_000) {
      milestones.push('Portfolio crosses $3M');
    }

    timeline.push({
      year: y,
      calendarYear: calYear,
      age,
      level: comp.level,

      baseSalary: comp.baseSalary,
      bonus: comp.bonus,
      stockAward: comp.stockAward,
      totalComp: comp.totalComp,
      promotedThisYear: comp.promotedThisYear,

      employee401kContrib: employeeContrib,
      employerMatch,
      is401kRoth: isRoth,
      contributionLimit: limit,

      esppContribution: esppContrib,
      esppBenefit,

      beginningBalance: round(beginBal),
      investmentReturn,
      marketReturnRate: marketReturn,
      endingBalance: portfolioBalance,

      federalTax: fedTax,
      ficaTax: fica,
      takeHomePay: takeHome,

      realEndingBalance: realBalance,
      realTotalComp: realComp,

      milestones,
    });
  }

  return timeline;
}


// ── Core: Retirement Readiness Analysis ──────────────────────────

/**
 * Analyzes whether a projection meets retirement goals.
 * Calculates SWR income, SS income, replacement ratio, and depletion risk.
 */
export function calculateRetirementReadiness(
  projection: YearlyProjection[],
  config: ProjectionConfig,
): RetirementReadiness {
  const warnings: string[] = [];
  const lastYear = projection[projection.length - 1];
  if (!lastYear) {
    return emptyReadiness(config, ['No projection data available.']);
  }

  const portfolio = lastYear.endingBalance;
  const years = config.retirementAge - config.currentAge;
  const realPortfolio = round(portfolio / Math.pow(1 + config.inflationRate, years));

  // SWR income
  const swrIncome = round(portfolio * config.safeWithdrawalRate);

  // Social Security
  const ssBenefit = calcSSBenefit(config.ssMonthlyPIA, config.ssClaimAge);
  const ssAnnual = round(ssBenefit * 12);
  // 85% taxable for high earners
  const ssTaxablePercent = 0.85;

  const totalRetirementIncome = swrIncome + ssAnnual;

  // Replacement ratio vs final working compensation
  const finalComp = lastYear.totalComp;
  const replacementRatio = finalComp > 0 ? totalRetirementIncome / finalComp : 0;

  // Target portfolio: enough that SWR + SS covers 80% of final comp
  const targetIncome = finalComp * 0.80;
  const neededFromPortfolio = Math.max(0, targetIncome - ssAnnual);
  const targetPortfolio = config.safeWithdrawalRate > 0
    ? round(neededFromPortfolio / config.safeWithdrawalRate) : 0;

  const gap = portfolio - targetPortfolio;

  // Depletion analysis (simplified: fixed withdrawal + inflation, conservative return in retirement)
  const retirementReturn = 0.04; // conservative return during withdrawal
  const annualWithdrawal = swrIncome;
  let depletionBal = portfolio;
  let depletionYears: number | null = null;
  for (let yr = 1; yr <= 50; yr++) {
    depletionBal = depletionBal * (1 + retirementReturn) - annualWithdrawal * Math.pow(1 + config.inflationRate, yr);
    if (depletionBal <= 0) {
      depletionYears = yr;
      break;
    }
  }

  // Heuristic success probability based on SWR
  let successProb: number;
  if (config.safeWithdrawalRate <= 0.030) successProb = 0.98;
  else if (config.safeWithdrawalRate <= 0.035) successProb = 0.95;
  else if (config.safeWithdrawalRate <= 0.040) successProb = 0.90;
  else if (config.safeWithdrawalRate <= 0.045) successProb = 0.82;
  else successProb = 0.75;

  // Adjust for portfolio size vs target
  if (portfolio >= targetPortfolio * 1.2) successProb = Math.min(0.99, successProb + 0.03);
  if (portfolio < targetPortfolio * 0.8) successProb = Math.max(0.50, successProb - 0.10);

  const onTrack = gap >= 0;

  if (!onTrack) {
    warnings.push(`Projected shortfall of $${Math.abs(round(gap)).toLocaleString()} vs 80% income replacement target.`);
  }
  if (replacementRatio < 0.70) {
    warnings.push(`Replacement ratio of ${(replacementRatio * 100).toFixed(0)}% is below recommended 70% minimum.`);
  }
  if (depletionYears !== null && depletionYears < 30) {
    warnings.push(`Portfolio may deplete within ${depletionYears} years of retirement with inflation-adjusted withdrawals.`);
  }

  return {
    projectedPortfolio: portfolio,
    projectedPortfolioReal: realPortfolio,
    targetPortfolio,

    swrIncome,
    ssAnnualIncome: ssAnnual,
    totalRetirementIncome,
    replacementRatio: Math.round(replacementRatio * 1000) / 1000,

    ssClaimAge: config.ssClaimAge,
    ssMonthlyBenefit: round(ssBenefit),
    ssTaxablePercent,

    safeWithdrawalRate: config.safeWithdrawalRate,
    yearsUntilDepletion: depletionYears,
    successProbability: Math.round(successProb * 100) / 100,

    gap: round(gap),
    onTrack,
    warnings,
  };
}

function emptyReadiness(config: ProjectionConfig, warnings: string[]): RetirementReadiness {
  return {
    projectedPortfolio: 0, projectedPortfolioReal: 0, targetPortfolio: 0,
    swrIncome: 0, ssAnnualIncome: 0, totalRetirementIncome: 0, replacementRatio: 0,
    ssClaimAge: config.ssClaimAge, ssMonthlyBenefit: 0, ssTaxablePercent: 0.85,
    safeWithdrawalRate: config.safeWithdrawalRate,
    yearsUntilDepletion: null, successProbability: 0,
    gap: 0, onTrack: false, warnings,
  };
}


// ── Core: Weighted Three-Track Projection ────────────────────────

/**
 * Build a config for a specific velocity track.
 * Applies track-specific promotions, level params, and merit rates.
 */
function buildTrackConfig(baseConfig: ProjectionConfig, track: VelocityTrack): ProjectionConfig {
  return {
    ...baseConfig,
    velocityTrack: track,
    promotions: TRACK_PROMOTIONS[track],
    levelParams: TRACK_LEVEL_PARAMS[track],
    overrideMeritRate: TRACK_MERIT_RATES[track],
  };
}

/**
 * Blend two YearlyProjection arrays into a weighted result.
 * Numeric fields are weighted; non-numeric fields come from the primary projection.
 */
function blendTimelines(
  timelines: { timeline: YearlyProjection[]; weight: number }[],
): YearlyProjection[] {
  if (timelines.length === 0) return [];
  const len = timelines[0]!.timeline.length;
  const result: YearlyProjection[] = [];

  for (let i = 0; i < len; i++) {
    const primary = timelines[0]!.timeline[i]!;
    const blended: YearlyProjection = { ...primary, milestones: [] };

    // Weighted numeric fields
    const numericKeys: (keyof YearlyProjection)[] = [
      'baseSalary', 'bonus', 'stockAward', 'totalComp',
      'employee401kContrib', 'employerMatch', 'contributionLimit',
      'esppContribution', 'esppBenefit',
      'beginningBalance', 'investmentReturn', 'marketReturnRate', 'endingBalance',
      'federalTax', 'ficaTax', 'takeHomePay',
      'realEndingBalance', 'realTotalComp',
    ];

    for (const key of numericKeys) {
      let weightedSum = 0;
      for (const { timeline, weight } of timelines) {
        weightedSum += (timeline[i]![key] as number) * weight;
      }
      (blended as Record<string, unknown>)[key] = round(weightedSum);
    }

    // Level = weighted average rounded to nearest int
    let weightedLevel = 0;
    for (const { timeline, weight } of timelines) {
      weightedLevel += timeline[i]!.level * weight;
    }
    blended.level = Math.round(weightedLevel);

    // Promoted if any track got promoted (for milestone display)
    blended.promotedThisYear = timelines.some(t => t.timeline[i]!.promotedThisYear);

    // Collect milestones from all tracks
    const allMilestones = new Set<string>();
    for (const { timeline } of timelines) {
      for (const m of timeline[i]!.milestones) allMilestones.add(m);
    }
    blended.milestones = [...allMilestones];

    result.push(blended);
  }

  return result;
}

/**
 * Runs all 3 velocity tracks and produces weighted expected values.
 * E[value] = 0.50 × fast + 0.35 × average + 0.15 × slow
 *
 * Returns both the weighted "most likely" timeline AND individual track timelines
 * for confidence band rendering in the UI.
 */
export function projectWeightedTimeline(baseConfig: ProjectionConfig): WeightedProjection {
  const weights = baseConfig.trackWeights ?? DEFAULT_TRACK_WEIGHTS;

  const fastConfig = buildTrackConfig(baseConfig, 'fast');
  const avgConfig = buildTrackConfig(baseConfig, 'average');
  const slowConfig = buildTrackConfig(baseConfig, 'slow');

  const fastTimeline = projectRetirementTimeline(fastConfig);
  const avgTimeline = projectRetirementTimeline(avgConfig);
  const slowTimeline = projectRetirementTimeline(slowConfig);

  const weighted = blendTimelines([
    { timeline: fastTimeline, weight: weights.fast },
    { timeline: avgTimeline, weight: weights.average },
    { timeline: slowTimeline, weight: weights.slow },
  ]);

  return {
    weighted,
    tracks: {
      fast: fastTimeline,
      average: avgTimeline,
      slow: slowTimeline,
    },
    weights,
  };
}


// ── Core: Scenario Comparison ────────────────────────────────────

/**
 * Runs conservative, base, and optimistic scenarios side by side.
 * Uses Saul's three-track velocity model:
 *   Conservative = slow track + conservative market returns
 *   Base = weighted (0.50/0.35/0.15) + glide path returns
 *   Optimistic = fast track + aggressive returns
 */
export function runScenarioComparison(baseConfig: ProjectionConfig): ScenarioComparison {
  // ── Conservative: slow track, reduced returns ──
  const conservativeConfig: ProjectionConfig = {
    ...buildTrackConfig(baseConfig, 'slow'),
    scenarioName: 'conservative',
    overrideMarketReturn: 0.055,
    safeWithdrawalRate: 0.030,
  };

  // ── Base: weighted three-track projection ──
  const weightedResult = projectWeightedTimeline(baseConfig);
  const baseScenarioConfig: ProjectionConfig = {
    ...baseConfig,
    scenarioName: 'base',
  };

  // ── Optimistic: fast track, aggressive returns ──
  const optimisticConfig: ProjectionConfig = {
    ...buildTrackConfig(baseConfig, 'fast'),
    scenarioName: 'optimistic',
    overrideMarketReturn: 0.075,
    safeWithdrawalRate: 0.040,
  };

  const conservativeProj = projectRetirementTimeline(conservativeConfig);
  const baseProj = weightedResult.weighted;
  const optimisticProj = projectRetirementTimeline(optimisticConfig);

  const conservativeReady = calculateRetirementReadiness(conservativeProj, conservativeConfig);
  const baseReady = calculateRetirementReadiness(baseProj, baseScenarioConfig);
  const optimisticReady = calculateRetirementReadiness(optimisticProj, optimisticConfig);

  const portfolioRange: [number, number] = [
    conservativeReady.projectedPortfolio,
    optimisticReady.projectedPortfolio,
  ];
  const incomeRange: [number, number] = [
    conservativeReady.totalRetirementIncome,
    optimisticReady.totalRetirementIncome,
  ];

  return {
    conservative: { config: conservativeConfig, projection: conservativeProj, readiness: conservativeReady },
    base: { config: baseScenarioConfig, projection: baseProj, readiness: baseReady },
    optimistic: { config: optimisticConfig, projection: optimisticProj, readiness: optimisticReady },
    summary: {
      portfolioRange,
      incomeRange,
      bestCase: `$${round(portfolioRange[1]).toLocaleString()} portfolio → $${round(incomeRange[1]).toLocaleString()}/yr income`,
      worstCase: `$${round(portfolioRange[0]).toLocaleString()} portfolio → $${round(incomeRange[0]).toLocaleString()}/yr income`,
    },
  };
}
