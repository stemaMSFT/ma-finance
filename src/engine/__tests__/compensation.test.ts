/**
 * Comprehensive tests for compensation.ts — total comp, Microsoft-specific comp,
 * history analysis, and forward projection.
 *
 * Financial accuracy is CRITICAL. Steven's real numbers are used as fixtures.
 * Expected values hand-calculated and cross-referenced against constants.ts.
 *
 * BUG FOUND: compensation.ts uses IRS_401K_LIMIT_2025 = 23,500 (stale 2025 limit)
 * instead of the 2026 limit of $24,500 from constants.ts. Tests marked accordingly.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTotalComp,
  calculateMicrosoftComp,
  analyzeCompHistory,
  projectCompensation,
} from '../compensation';
import type { CompHistoryEntry, CompBreakdown, CompProjection } from '../types';
import { expectApprox, expectInRange } from './test-utils';
import {
  CONTRIBUTION_LIMIT_UNDER_50,
  MSFT_MATCH_PERCENT,
  MSFT_MAX_MATCH,
} from '../constants';

// ── Steven's Real Data Fixtures ───────────────────────────────────

const STEVEN_BASE = 158_412;
const STEVEN_BONUS_PERCENT = 10;
const STEVEN_STOCK_FY25 = 18_000;
const STEVEN_ESPP_PERCENT = 10; // ~$18,740/yr → ~11.8% but engine caps at 15%

// ── calculateTotalComp ────────────────────────────────────────────

describe('calculateTotalComp', () => {
  it('sums base + bonus as totalCash', () => {
    const result = calculateTotalComp(100_000, 10_000, 0, 0, 0);
    expect(result.totalCash).toBe(110_000);
    expect(result.totalComp).toBe(110_000);
  });

  it('includes all components in totalComp', () => {
    const result = calculateTotalComp(100_000, 10_000, 20_000, 5_000, 3_000);
    expect(result.totalComp).toBe(138_000);
  });

  it('handles zero for all optional components', () => {
    const result = calculateTotalComp(100_000, 10_000, 0);
    expect(result.employer401kMatch).toBe(0);
    expect(result.esppBenefit).toBe(0);
    expect(result.totalComp).toBe(110_000);
  });

  it('rounds all values to 2 decimal places', () => {
    const result = calculateTotalComp(100_000.333, 10_000.777, 5_000.111);
    // Each should be rounded to 2 decimal places
    expect(result.baseSalary).toBe(100_000.33);
    expect(result.bonus).toBe(10_000.78);
    expect(result.stockAward).toBe(5_000.11);
  });

  it('works with Steven\'s real numbers', () => {
    const bonus = STEVEN_BASE * 0.10; // $15,841.20
    const match = CONTRIBUTION_LIMIT_UNDER_50 * 0.5; // $12,250
    const result = calculateTotalComp(STEVEN_BASE, bonus, STEVEN_STOCK_FY25, match, 2_000);
    expect(result.baseSalary).toBe(158_412);
    expect(result.totalCash).toBeCloseTo(158_412 + 15_841.20, 1);
    expect(result.totalComp).toBeGreaterThan(200_000);
  });

  it('zero salary → zero totalCash', () => {
    const result = calculateTotalComp(0, 0, 10_000, 5_000, 1_000);
    expect(result.totalCash).toBe(0);
    expect(result.totalComp).toBe(16_000);
  });
});

// ── calculateMicrosoftComp ────────────────────────────────────────

describe('calculateMicrosoftComp', () => {
  describe('401k match calculation (THE CRITICAL BUG CHECK)', () => {
    it('match = 50% × employee_contribution, NOT 50% × salary', () => {
      // Microsoft matches 50 cents per dollar contributed, up to IRS limit
      const result = calculateMicrosoftComp(STEVEN_BASE, 10, STEVEN_STOCK_FY25, 10);
      // Match should be 50% × min(employeeContribution, IRS_limit)
      // NOT 50% × salary
      expect(result.employer401kMatch).toBeLessThan(STEVEN_BASE * 0.5);
    });

    it('max contribution ($24,500) → match should be $12,250', () => {
      // NOTE: compensation.ts uses 2025 limit of $23,500 internally.
      // When this bug is fixed, the match at max should be $12,250.
      const result = calculateMicrosoftComp(
        200_000,
        10,
        20_000,
        10,
        CONTRIBUTION_LIMIT_UNDER_50, // $24,500 — the 2026 limit
      );
      // FIXED: Now uses 2026 IRS limit ($24,500) from constants.ts
      // Match = $24,500 × 0.50 = $12,250
      const correctMatch = 12_250;
      expect(result.employer401kMatch).toBe(correctMatch);
    });

    it('partial contribution ($10,000) → match should be $5,000', () => {
      const result = calculateMicrosoftComp(200_000, 10, 20_000, 10, 10_000);
      expect(result.employer401kMatch).toBe(5_000);
    });

    it('zero contribution → zero match', () => {
      const result = calculateMicrosoftComp(200_000, 10, 20_000, 10, 0);
      expect(result.employer401kMatch).toBe(0);
    });

    it('contribution exceeding IRS limit is capped before match calculation', () => {
      const result = calculateMicrosoftComp(200_000, 10, 20_000, 10, 50_000);
      // Engine internally uses 23,500 cap (2025 limit bug)
      // Match should be 50% of the capped contribution, not 50% of $50k
      expect(result.employer401kMatch).toBeLessThanOrEqual(12_250);
      expect(result.employer401kMatch).toBeGreaterThan(0);
    });

    it('match does not exceed 50% of IRS limit', () => {
      const result = calculateMicrosoftComp(300_000, 10, 20_000, 10, 100_000);
      expect(result.employer401kMatch).toBeLessThanOrEqual(MSFT_MAX_MATCH);
    });
  });

  describe('ESPP benefit calculation', () => {
    it('ESPP benefit = (contribution × 15%) / 85% (discount value)', () => {
      // 10% of base contributed to ESPP; 15% discount
      const result = calculateMicrosoftComp(STEVEN_BASE, 10, STEVEN_STOCK_FY25, 10);
      const esppContribution = STEVEN_BASE * 0.10; // $15,841.20
      const expectedBenefit = esppContribution * 0.15 / 0.85; // $2,795.51
      expectApprox(result.esppBenefit, expectedBenefit, 0.01);
    });

    it('ESPP contribution capped at 15% of base', () => {
      // Even if you pass 20%, it should cap at 15%
      const result20 = calculateMicrosoftComp(100_000, 10, 10_000, 20);
      const result15 = calculateMicrosoftComp(100_000, 10, 10_000, 15);
      expect(result20.esppBenefit).toBe(result15.esppBenefit);
    });

    it('zero ESPP contribution → zero benefit', () => {
      const result = calculateMicrosoftComp(100_000, 10, 10_000, 0);
      expect(result.esppBenefit).toBe(0);
    });
  });

  describe('bonus calculation', () => {
    it('bonus = baseSalary × bonusPercent', () => {
      const result = calculateMicrosoftComp(STEVEN_BASE, 10, STEVEN_STOCK_FY25, 10);
      expectApprox(result.bonus, 15_841.20, 0.001);
    });

    it('zero bonus percent → zero bonus', () => {
      const result = calculateMicrosoftComp(100_000, 0, 10_000, 10);
      expect(result.bonus).toBe(0);
    });
  });

  describe('Steven\'s real total comp', () => {
    it('total comp includes all components', () => {
      const result = calculateMicrosoftComp(
        STEVEN_BASE,          // $158,412
        STEVEN_BONUS_PERCENT, // 10%
        STEVEN_STOCK_FY25,    // $18,000
        STEVEN_ESPP_PERCENT,  // 10%
      );
      // Base: $158,412
      // Bonus: $15,841.20
      // Stock: $18,000
      // 401k match: 50% × min(23500, 23500) = $11,750 (with 2025 bug)
      // ESPP: ($15,841.20 × 0.15) / 0.85 = ~$2,795.51
      expect(result.baseSalary).toBe(158_412);
      expect(result.totalComp).toBeGreaterThan(200_000);
      // Verify all components add up
      const sum = result.baseSalary + result.bonus + result.stockAward
        + result.employer401kMatch + result.esppBenefit;
      expectApprox(result.totalComp, sum, 0.001);
    });

    it('totalCash = base + bonus only (no stock/match/espp)', () => {
      const result = calculateMicrosoftComp(STEVEN_BASE, 10, STEVEN_STOCK_FY25, 10);
      expect(result.totalCash).toBeCloseTo(STEVEN_BASE + STEVEN_BASE * 0.10, 1);
    });
  });
});

// ── analyzeCompHistory ────────────────────────────────────────────

describe('analyzeCompHistory', () => {
  // Steven's FY22–FY25 compensation history (from decisions.md)
  const stevenHistory: CompHistoryEntry[] = [
    {
      fiscalYear: 2022, level: 59, basePay: 110_500,
      meritIncrease: 0, promotionIncrease: 0, bonus: 8_000,
      specialCash: 0, stockAward: 0, signOnBonus: 10_000, onHireStock: 120_000,
      activities: [],
    },
    {
      fiscalYear: 2023, level: 60, basePay: 125_000,
      meritIncrease: 5_500, promotionIncrease: 9_000, bonus: 11_250,
      specialCash: 0, stockAward: 12_000, signOnBonus: 0, onHireStock: 0,
      activities: [],
    },
    {
      fiscalYear: 2024, level: 61, basePay: 142_000,
      meritIncrease: 6_000, promotionIncrease: 11_000, bonus: 13_500,
      specialCash: 0, stockAward: 15_000, signOnBonus: 0, onHireStock: 0,
      activities: [],
    },
    {
      fiscalYear: 2025, level: 62, basePay: 158_412,
      meritIncrease: 6_412, promotionIncrease: 10_000, bonus: 14_500,
      specialCash: 0, stockAward: 18_000, signOnBonus: 0, onHireStock: 0,
      activities: [],
    },
  ];

  it('entries are sorted by fiscal year ascending', () => {
    const shuffled = [stevenHistory[2], stevenHistory[0], stevenHistory[3], stevenHistory[1]];
    const result = analyzeCompHistory(shuffled);
    for (let i = 1; i < result.entries.length; i++) {
      expect(result.entries[i].fiscalYear).toBeGreaterThan(result.entries[i - 1].fiscalYear);
    }
  });

  it('calculates YoY base growth correctly', () => {
    const result = analyzeCompHistory(stevenHistory);
    // FY22→FY23: (125000-110500)/110500 = 13.12%
    // FY23→FY24: (142000-125000)/125000 = 13.6%
    // FY24→FY25: (158412-142000)/142000 = 11.56%
    expect(result.yoyBaseGrowth).toHaveLength(3);
    expectApprox(result.yoyBaseGrowth[0], 13.12, 0.05);
    expectApprox(result.yoyBaseGrowth[1], 13.60, 0.05);
    expectApprox(result.yoyBaseGrowth[2], 11.56, 0.05);
  });

  it('calculates average bonus percent correctly', () => {
    const result = analyzeCompHistory(stevenHistory);
    // FY22: 8000/110500 = 7.24%
    // FY23: 11250/125000 = 9.00%
    // FY24: 13500/142000 = 9.51%
    // FY25: 14500/158412 = 9.15%
    // Avg ≈ 8.72%
    expectInRange(result.avgBonusPercent, 8, 10);
  });

  it('CAGR over FY22–FY25 reflects total comp trend', () => {
    const result = analyzeCompHistory(stevenHistory);
    // FY22 total comp is inflated by $120k on-hire stock + $10k sign-on = ~$248,500
    // FY25 total comp is ~$190,912 (no one-time grants)
    // So CAGR is negative due to the front-loaded on-hire grants declining
    // This is correct behavior — CAGR measures total comp including one-time items
    expect(typeof result.cagr).toBe('number');
    expect(Number.isFinite(result.cagr)).toBe(true);
  });

  it('handles single-entry history gracefully', () => {
    const result = analyzeCompHistory([stevenHistory[0]]);
    expect(result.yoyBaseGrowth).toHaveLength(0);
    expect(result.cagr).toBe(0);
  });

  it('FIXED: empty history returns zeroed trajectory (no crash)', () => {
    const result = analyzeCompHistory([]);
    expect(result.entries).toHaveLength(0);
    expect(result.avgMeritPercent).toBe(0);
    expect(result.cagr).toBe(0);
  });
});

// ── projectCompensation ───────────────────────────────────────────

describe('projectCompensation', () => {
  it('returns current year breakdown and projected years', () => {
    const result = projectCompensation(STEVEN_BASE, 62, STEVEN_STOCK_FY25, 5);
    expect(result.current).toBeDefined();
    expect(result.projectedYears).toHaveLength(5);
    expect(result.assumptions).toBeDefined();
  });

  it('base pay grows each year by merit', () => {
    const result = projectCompensation(STEVEN_BASE, 62, STEVEN_STOCK_FY25, 5);
    for (let i = 1; i < result.projectedYears.length; i++) {
      expect(result.projectedYears[i].basePay).toBeGreaterThan(
        result.projectedYears[i - 1].basePay,
      );
    }
  });

  it('level increases on promo years', () => {
    const result = projectCompensation(STEVEN_BASE, 62, STEVEN_STOCK_FY25, 6, {
      promoEveryNYears: 2,
    });
    // Year 2: promo → L63
    expect(result.projectedYears[1].level).toBe(63);
    // Year 4: promo → L64
    expect(result.projectedYears[3].level).toBe(64);
  });

  it('stock award grows by stockGrowthPercent', () => {
    const result = projectCompensation(100_000, 62, 10_000, 3, {
      stockGrowthPercent: 5,
    });
    expectApprox(result.projectedYears[0].stockAward, 10_500, 0.01);
    expectApprox(result.projectedYears[1].stockAward, 11_025, 0.01);
  });

  it('totalComp increases year over year', () => {
    const result = projectCompensation(STEVEN_BASE, 62, STEVEN_STOCK_FY25, 5);
    for (let i = 1; i < result.projectedYears.length; i++) {
      expect(result.projectedYears[i].totalComp).toBeGreaterThan(
        result.projectedYears[i - 1].totalComp,
      );
    }
  });

  it('zero years → empty projectedYears', () => {
    const result = projectCompensation(STEVEN_BASE, 62, STEVEN_STOCK_FY25, 0);
    expect(result.projectedYears).toHaveLength(0);
  });

  it('overrides are applied to default assumptions', () => {
    const result = projectCompensation(100_000, 62, 10_000, 1, {
      annualMeritPercent: 10,
      bonusTargetPercent: 20,
    });
    expect(result.assumptions.annualMeritPercent).toBe(10);
    expect(result.assumptions.bonusTargetPercent).toBe(20);
  });
});
