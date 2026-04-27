/**
 * Compensation analysis engine.
 *
 * Generic functions for total-comp breakdown, history analysis, and
 * forward projection. Microsoft-specific helper included for 401k match
 * and ESPP calculations.
 */
import type {
  CompHistoryEntry,
  CompTrajectory,
  CompBreakdown,
  CompProjection,
  CompProjectionYear,
  CompProjectionAssumptions,
} from './types';
import { CONTRIBUTION_LIMIT_UNDER_50 } from './constants';

// ── Helpers ──────────────────────────────────────────────────────

function pct(value: number, percent: number): number {
  return value * (percent / 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Total Comp Breakdown ─────────────────────────────────────────

/**
 * Build a total-comp breakdown from individual components.
 * All monetary values are annual.
 */
export function calculateTotalComp(
  baseSalary: number,
  bonus: number,
  stockAward: number,
  employer401kMatch: number = 0,
  esppBenefit: number = 0,
): CompBreakdown {
  const totalCash = round2(baseSalary + bonus);
  const totalComp = round2(totalCash + stockAward + employer401kMatch + esppBenefit);
  return {
    baseSalary: round2(baseSalary),
    bonus: round2(bonus),
    stockAward: round2(stockAward),
    employer401kMatch: round2(employer401kMatch),
    esppBenefit: round2(esppBenefit),
    totalCash,
    totalComp,
  };
}

// ── Microsoft-Specific Total Comp ────────────────────────────────

/**
 * Calculate Microsoft total comp including their 50%-match-on-100%
 * 401k policy and 15% ESPP discount.
 *
 * Microsoft matches 50 cents on every dollar you contribute to 401k,
 * up to the IRS limit (so max match = 50% × IRS limit).
 * ESPP: employees buy MSFT stock at a 15% discount; the benefit is
 * modeled as discount × contribution.
 */
export function calculateMicrosoftComp(
  baseSalary: number,
  bonusPercent: number,
  stockAward: number,
  esppContributionPercent: number = 10,
  employeeContribution401k: number = CONTRIBUTION_LIMIT_UNDER_50,
): CompBreakdown {
  const bonus = round2(pct(baseSalary, bonusPercent));

  // 401k: Microsoft matches 50% of employee contribution, up to IRS limit
  // Cap contribution at both IRS limit and salary (zero salary → zero match)
  const cappedContribution = Math.min(employeeContribution401k, CONTRIBUTION_LIMIT_UNDER_50, baseSalary);
  const employer401kMatch = round2(cappedContribution * 0.5);

  // ESPP: 15% discount on stock purchased with up to 15% of base
  const esppContribution = pct(baseSalary, Math.min(esppContributionPercent, 15));
  const esppBenefit = round2(esppContribution * 0.15 / 0.85); // discount value

  return calculateTotalComp(baseSalary, bonus, stockAward, employer401kMatch, esppBenefit);
}

// ── History Analysis ─────────────────────────────────────────────

function totalCompForEntry(e: CompHistoryEntry): number {
  return e.basePay + e.bonus + e.specialCash + e.stockAward + e.signOnBonus + e.onHireStock;
}

/**
 * Analyze a compensation history array → trajectory metrics.
 * Entries must be sorted by fiscalYear ascending.
 */
export function analyzeCompHistory(history: CompHistoryEntry[]): CompTrajectory {
  if (history.length === 0) {
    return {
      entries: [],
      yoyBaseGrowth: [],
      avgMeritPercent: 0,
      avgBonusPercent: 0,
      avgTotalCompGrowth: 0,
      cagr: 0,
    };
  }

  const sorted = [...history].sort((a, b) => a.fiscalYear - b.fiscalYear);

  // YoY base-pay growth
  const yoyBaseGrowth: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].basePay;
    const curr = sorted[i].basePay;
    yoyBaseGrowth.push(prev > 0 ? round2(((curr - prev) / prev) * 100) : 0);
  }

  // Average merit % (merit / prior-year base)
  const meritPcts: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].meritIncrease > 0) {
      const priorBase = sorted[i - 1].basePay;
      meritPcts.push(priorBase > 0 ? (sorted[i].meritIncrease / priorBase) * 100 : 0);
    }
  }
  // Also include first year merit if applicable (relative to new-hire base)
  if (sorted[0].meritIncrease > 0) {
    const hireBase = sorted[0].basePay - sorted[0].meritIncrease - sorted[0].promotionIncrease;
    if (hireBase > 0) meritPcts.push((sorted[0].meritIncrease / hireBase) * 100);
  }

  const avgMeritPercent = meritPcts.length
    ? round2(meritPcts.reduce((s, v) => s + v, 0) / meritPcts.length)
    : 0;

  // Average bonus % (bonus / that year's base)
  const bonusPcts = sorted
    .filter((e) => e.bonus > 0)
    .map((e) => (e.bonus / e.basePay) * 100);
  const avgBonusPercent = bonusPcts.length
    ? round2(bonusPcts.reduce((s, v) => s + v, 0) / bonusPcts.length)
    : 0;

  // Total comp YoY growth
  const totalComps = sorted.map(totalCompForEntry);
  const tcGrowths: number[] = [];
  for (let i = 1; i < totalComps.length; i++) {
    if (totalComps[i - 1] > 0) {
      tcGrowths.push(((totalComps[i] - totalComps[i - 1]) / totalComps[i - 1]) * 100);
    }
  }
  const avgTotalCompGrowth = tcGrowths.length
    ? round2(tcGrowths.reduce((s, v) => s + v, 0) / tcGrowths.length)
    : 0;

  // CAGR of total comp (first → last)
  const first = totalComps[0];
  const last = totalComps[totalComps.length - 1];
  const years = sorted[sorted.length - 1].fiscalYear - sorted[0].fiscalYear;
  const cagr = years > 0 && first > 0
    ? round2((Math.pow(last / first, 1 / years) - 1) * 100)
    : 0;

  return {
    entries: sorted,
    yoyBaseGrowth,
    avgMeritPercent,
    avgBonusPercent,
    avgTotalCompGrowth,
    cagr,
  };
}

// ── Forward Projection ───────────────────────────────────────────

const DEFAULT_ASSUMPTIONS: CompProjectionAssumptions = {
  annualMeritPercent: 4,
  promoEveryNYears: 2,
  promoBaseIncreasePercent: 8,
  bonusTargetPercent: 10,
  stockGrowthPercent: 5,
  inflationPercent: 3,
  employer401kMatchPercent: 50,
  employer401kMatchCapPercent: 100, // Microsoft matches on full salary up to IRS limit
  esppDiscountPercent: 15,
  esppContributionPercent: 10,
};

/**
 * Project future compensation over N years from a starting point.
 * Returns current-year breakdown plus projected years.
 */
export function projectCompensation(
  currentBase: number,
  currentLevel: number,
  currentStockAward: number,
  years: number,
  overrides: Partial<CompProjectionAssumptions> = {},
): CompProjection {
  const a = { ...DEFAULT_ASSUMPTIONS, ...overrides };

  // Current year breakdown
  const current = calculateMicrosoftComp(
    currentBase,
    a.bonusTargetPercent,
    currentStockAward,
    a.esppContributionPercent,
  );

  const projectedYears: CompProjectionYear[] = [];
  let base = currentBase;
  let level = currentLevel;
  let stock = currentStockAward;

  for (let y = 1; y <= years; y++) {
    // Merit
    base = round2(base * (1 + a.annualMeritPercent / 100));

    // Promotion bump
    if (y % a.promoEveryNYears === 0) {
      base = round2(base * (1 + a.promoBaseIncreasePercent / 100));
      level += 1;
    }

    // Stock grows
    stock = round2(stock * (1 + a.stockGrowthPercent / 100));

    const bonus = round2(pct(base, a.bonusTargetPercent));
    const totalCash = round2(base + bonus);
    const cappedContrib = Math.min(CONTRIBUTION_LIMIT_UNDER_50, base);
    const match401k = round2(cappedContrib * (a.employer401kMatchPercent / 100));
    const esppBenefit = round2(
      pct(base, Math.min(a.esppContributionPercent, 15)) * (a.esppDiscountPercent / 100) / (1 - a.esppDiscountPercent / 100),
    );
    const totalComp = round2(totalCash + stock + match401k + esppBenefit);

    projectedYears.push({
      year: y,
      level,
      basePay: base,
      bonus,
      stockAward: stock,
      totalCash,
      totalComp,
    });
  }

  return { current, projectedYears, assumptions: a };
}
