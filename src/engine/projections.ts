/**
 * General financial projection utilities.
 * Compound growth, savings trajectories, net worth projections.
 * Pure TypeScript — no React dependencies.
 */

import type { TimelinePoint } from './types';
import { DEFAULT_INFLATION_RATE } from './constants';

// ── Core Math Utilities ───────────────────────────────────────────

/**
 * Future value of a lump sum with compound interest.
 * FV = PV × (1 + r)^n
 */
export function futureValue(principal: number, rate: number, years: number): number {
  if (years <= 0) return principal;
  return principal * Math.pow(1 + rate, years);
}

/**
 * Present value (discount future amount to today's dollars).
 * PV = FV / (1 + r)^n
 */
export function presentValue(futureAmount: number, rate: number, years: number): number {
  if (years <= 0) return futureAmount;
  return futureAmount / Math.pow(1 + rate, years);
}

/**
 * Standard fixed mortgage monthly payment.
 * M = P × [r(1+r)^n] / [(1+r)^n - 1]
 */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Project compound growth with optional monthly contributions.
 * Uses monthly compounding for precision.
 *
 * @param principal - Starting balance
 * @param monthlyAdd - Regular monthly contribution (can be 0)
 * @param annualRate - Annual return rate as decimal (e.g. 0.07)
 * @param years - Projection horizon
 * @param startAge - Age at year 0 (for labeling TimelinePoints)
 * @returns Year-by-year array of { year, age, value } suitable for Recharts
 */
export function compoundGrowth(
  principal: number,
  monthlyAdd: number,
  annualRate: number,
  years: number,
  startAge = 0,
): TimelinePoint[] {
  if (years <= 0) return [];
  const points: TimelinePoint[] = [];
  const monthlyRate = annualRate / 12;
  let balance = Math.max(0, principal);

  // Year 0 — baseline
  points.push({ year: 0, age: startAge, value: Math.round(balance) });

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + Math.max(0, monthlyAdd);
    }
    points.push({ year: y, age: startAge + y, value: Math.round(balance) });
  }

  return points;
}

/**
 * Convert a future nominal dollar amount to today's purchasing power.
 *
 * @param amount - Nominal future dollar amount
 * @param years - Years in the future
 * @param inflationRate - Annual inflation rate (default 2.5%)
 * @returns Amount in today's dollars
 */
export function adjustForInflation(
  amount: number,
  years: number,
  inflationRate = DEFAULT_INFLATION_RATE,
): number {
  if (years <= 0) return amount;
  return amount / Math.pow(1 + inflationRate, years);
}

// ── Savings Goal Solver ───────────────────────────────────────────

export interface SavingsGoalResult {
  /** Months needed to reach target (null = unreachable with given rate/contrib) */
  monthsToGoal: number | null;
  /** Years (fractional) */
  yearsToGoal: number | null;
  /** Year-by-year balance projections */
  timeline: TimelinePoint[];
  /** Final balance at end of projection (even if target not reached) */
  finalBalance: number;
  /** True if target is reached within the projected timeline */
  goalReached: boolean;
}

/**
 * Calculate how long until a savings goal is reached.
 *
 * @param targetAmount - The savings goal in today's dollars
 * @param currentSavings - Current balance
 * @param monthlyContrib - Monthly contribution amount
 * @param annualRate - Expected annual return
 * @param maxYears - Maximum projection horizon (default 40)
 * @param startAge - Current age for timeline labeling
 */
export function calculateSavingsGoal(
  targetAmount: number,
  currentSavings: number,
  monthlyContrib: number,
  annualRate: number,
  maxYears = 40,
  startAge = 0,
): SavingsGoalResult {
  if (targetAmount <= 0) {
    return {
      monthsToGoal: 0,
      yearsToGoal: 0,
      timeline: [],
      finalBalance: currentSavings,
      goalReached: true,
    };
  }

  const monthlyRate = annualRate / 12;
  let balance = Math.max(0, currentSavings);
  let monthsToGoal: number | null = null;
  const timeline: TimelinePoint[] = [{ year: 0, age: startAge, value: Math.round(balance) }];
  const maxMonths = maxYears * 12;

  for (let m = 1; m <= maxMonths; m++) {
    balance = balance * (1 + monthlyRate) + Math.max(0, monthlyContrib);
    if (monthsToGoal === null && balance >= targetAmount) {
      monthsToGoal = m;
    }
    if (m % 12 === 0) {
      const y = m / 12;
      timeline.push({ year: y, age: startAge + y, value: Math.round(balance) });
    }
  }

  return {
    monthsToGoal,
    yearsToGoal: monthsToGoal !== null ? monthsToGoal / 12 : null,
    timeline,
    finalBalance: Math.round(balance),
    goalReached: monthsToGoal !== null,
  };
}

// ── Net Worth Projection ──────────────────────────────────────────

export interface NetWorthInput {
  currentAge: number;
  /** Liquid savings & brokerage accounts */
  liquidAssets: number;
  /** Retirement account balances (401k + IRA) */
  retirementAssets: number;
  /** Current home equity (home value - mortgage balance) */
  homeEquity: number;
  /** Monthly savings deposited into investment accounts */
  monthlySavings: number;
  /** Monthly 401k contribution (employee) */
  monthly401kContrib: number;
  /** Monthly employer match */
  monthlyEmployerMatch: number;
  /** Monthly principal paydown on mortgage */
  monthlyMortgagePrincipal: number;
  /** Expected annual return on liquid/brokerage assets */
  liquidReturn: number;
  /** Expected annual return on retirement assets */
  retirementReturn: number;
  /** Expected annual home appreciation rate */
  homeAppreciation: number;
  /** Years to project */
  years: number;
}

export interface NetWorthDataPoint extends TimelinePoint {
  liquidAssets: number;
  retirementAssets: number;
  homeEquity: number;
}

/**
 * Project total net worth over time across all asset classes.
 * Returns year-by-year breakdown suitable for stacked area charts.
 */
export function calculateNetWorthProjection(input: NetWorthInput): NetWorthDataPoint[] {
  const {
    currentAge, years,
    liquidReturn, retirementReturn, homeAppreciation,
    monthlySavings, monthly401kContrib, monthlyEmployerMatch, monthlyMortgagePrincipal,
  } = input;

  let liquid = Math.max(0, input.liquidAssets);
  let retirement = Math.max(0, input.retirementAssets);
  let equity = Math.max(0, input.homeEquity);

  const liquidMonthlyRate = liquidReturn / 12;
  const retirementMonthlyRate = retirementReturn / 12;
  const homeMonthlyRate = homeAppreciation / 12;

  const points: NetWorthDataPoint[] = [{
    year: 0,
    age: currentAge,
    value: Math.round(liquid + retirement + equity),
    liquidAssets: Math.round(liquid),
    retirementAssets: Math.round(retirement),
    homeEquity: Math.round(equity),
  }];

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      liquid = liquid * (1 + liquidMonthlyRate) + Math.max(0, monthlySavings);
      retirement = retirement * (1 + retirementMonthlyRate)
        + Math.max(0, monthly401kContrib)
        + Math.max(0, monthlyEmployerMatch);
      equity = equity * (1 + homeMonthlyRate) + Math.max(0, monthlyMortgagePrincipal);
    }
    points.push({
      year: y,
      age: currentAge + y,
      value: Math.round(liquid + retirement + equity),
      liquidAssets: Math.round(liquid),
      retirementAssets: Math.round(retirement),
      homeEquity: Math.round(equity),
    });
  }

  return points;
}
