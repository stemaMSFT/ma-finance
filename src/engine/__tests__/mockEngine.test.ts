/**
 * Tests for mockEngine.ts — validates the legacy mock functions against
 * correct financial math. The mock is still used by some UI components.
 *
 * FIXED (2026-04-26): 401k match now computed on employee contributions
 * capped at IRS limit, not on salary. ESPP uses discount/(1-discount).
 */

import { describe, it, expect } from 'vitest';
import { calcCompensation, calcRetirement, calcMortgage } from '../mockEngine';
import type { PersonComp } from '../mockEngine';
import { expectApprox, expectInRange } from './test-utils';
import {
  CONTRIBUTION_LIMIT_UNDER_50,
  MSFT_MATCH_PERCENT,
  MSFT_MAX_MATCH,
  DEFAULT_SAFE_WITHDRAWAL_RATE,
} from '../constants';

// ── calcCompensation ──────────────────────────────────────────────

describe('calcCompensation', () => {
  const stevenComp: PersonComp = {
    baseSalary: 158_412,
    bonusTargetPercent: 10,
    rsuAnnual: 18_000,
    employer401kMatchPercent: 50,
    employer401kMatchLimit: 100, // Microsoft: matches on full salary up to IRS limit
    employee401kContribution: 24_500, // max out IRS limit
    esppDiscountPercent: 15,
    esppContributionPercent: 10,
  };

  it('calculates bonus correctly', () => {
    const result = calcCompensation(stevenComp);
    expectApprox(result.bonusAmount, 15_841.20, 0.001);
  });

  it('calculates ESPP benefit using discount/(1-discount) formula', () => {
    const result = calcCompensation(stevenComp);
    // Correct: contribution × discount / (1 - discount)
    const expected = 158_412 * 0.10 * 0.15 / 0.85; // $2,795.51
    expectApprox(result.esppBenefit, expected, 0.01);
  });

  describe('401k match — FIXED: contribution-based', () => {
    it('match is 50% of employee contribution capped at IRS limit ($12,250 max)', () => {
      const result = calcCompensation(stevenComp);
      // Correct: min(24_500, IRS_LIMIT) × 50% = $12,250
      expectApprox(result.employer401kMatch, MSFT_MAX_MATCH, 0.01);
    });

    it('match scales with employee contribution, not salary', () => {
      const comp10k: PersonComp = {
        ...stevenComp,
        employee401kContribution: 10_000,
      };
      const result = calcCompensation(comp10k);
      // 10_000 × 50% = $5,000
      expectApprox(result.employer401kMatch, 5_000, 0.01);
    });
  });

  it('total comp sums all components', () => {
    const result = calcCompensation(stevenComp);
    const expectedTotal =
      result.baseSalary + result.bonusAmount + result.rsuAnnual
      + result.esppBenefit + result.employer401kMatch;
    expectApprox(result.totalComp, expectedTotal, 0.001);
  });

  it('breakdown array has entries for non-zero components', () => {
    const result = calcCompensation(stevenComp);
    expect(result.breakdown.length).toBeGreaterThanOrEqual(4);
    for (const item of result.breakdown) {
      expect(item.value).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.color).toMatch(/^#/);
    }
  });

  it('zero salary → zero comp', () => {
    const zeroComp: PersonComp = {
      baseSalary: 0,
      bonusTargetPercent: 10,
      rsuAnnual: 0,
      employer401kMatchPercent: 50,
      employer401kMatchLimit: 100,
      employee401kContribution: 0,
      esppDiscountPercent: 15,
      esppContributionPercent: 10,
    };
    const result = calcCompensation(zeroComp);
    expect(result.baseSalary).toBe(0);
    expect(result.bonusAmount).toBe(0);
    expect(result.employer401kMatch).toBe(0);
    expect(result.esppBenefit).toBe(0);
  });
});

// ── calcRetirement ────────────────────────────────────────────────

describe('calcRetirement', () => {
  it('returns correct years to retirement', () => {
    const result = calcRetirement(35, 65, 150_000, 158_412, 10, 50, 6, 0.07);
    expect(result.yearsToRetirement).toBe(30);
  });

  it('timeline length = years + 1', () => {
    const result = calcRetirement(35, 65, 150_000, 158_412, 10, 50, 6, 0.07);
    expect(result.timeline).toHaveLength(31);
  });

  it('balance grows over time', () => {
    const result = calcRetirement(35, 65, 150_000, 158_412, 10, 50, 6, 0.07);
    const first = result.timeline[0].current;
    const last = result.currentFinalBalance;
    expect(last).toBeGreaterThan(first);
  });

  it('maxed contributions yield higher balance', () => {
    const result = calcRetirement(35, 65, 150_000, 158_412, 10, 50, 6, 0.07);
    expect(result.maxedFinalBalance).toBeGreaterThan(result.currentFinalBalance);
  });

  it('retirement income uses safe withdrawal rate', () => {
    const result = calcRetirement(35, 65, 150_000, 158_412, 10, 50, 6, 0.07);
    expectApprox(
      result.annualIncomeAtRetirement,
      result.currentFinalBalance * DEFAULT_SAFE_WITHDRAWAL_RATE,
      0.001,
    );
  });

  it('handles zero balance gracefully', () => {
    const result = calcRetirement(35, 65, 0, 158_412, 10, 50, 6, 0.07);
    expect(result.currentFinalBalance).toBeGreaterThan(0);
  });

  it('handles current age = retirement age', () => {
    const result = calcRetirement(65, 65, 150_000, 158_412, 10, 50, 6, 0.07);
    expect(result.yearsToRetirement).toBe(0);
    expect(result.timeline).toHaveLength(1);
  });

  it('readiness score is between 0 and 100', () => {
    const result = calcRetirement(35, 65, 150_000, 158_412, 10, 50, 6, 0.07);
    expect(result.readinessScore).toBeGreaterThanOrEqual(0);
    expect(result.readinessScore).toBeLessThanOrEqual(100);
  });
});

// ── calcMortgage ──────────────────────────────────────────────────

describe('calcMortgage', () => {
  it('standard $800k house at 20% down, 6.25% rate', () => {
    const result = calcMortgage(800_000, 20, 0.0625, 30, 200_000, 0);
    expect(result.mortgage.loanAmount).toBe(640_000);
    expect(result.mortgage.downPayment).toBe(160_000);
    // P&I on $640k at 6.25% 30yr ≈ $3,940/mo
    expectInRange(result.mortgage.monthlyPI, 3_800, 4_100);
  });

  it('no PMI when down payment ≥ 20%', () => {
    const result = calcMortgage(800_000, 20, 0.0625, 30, 200_000, 0);
    expect(result.mortgage.pmi).toBe(0);
  });

  it('PMI required when down payment < 20%', () => {
    const result = calcMortgage(800_000, 10, 0.0625, 30, 200_000, 0);
    expect(result.mortgage.pmi).toBeGreaterThan(0);
  });

  it('front-end DTI = housing costs / gross monthly income', () => {
    const result = calcMortgage(500_000, 20, 0.0625, 30, 200_000, 0);
    const grossMonthly = 200_000 / 12;
    const expectedRatio = (result.mortgage.total / grossMonthly) * 100;
    expectApprox(result.frontEndRatio, expectedRatio, 0.01);
  });

  it('high price → DTI exceeds comfort thresholds', () => {
    const result = calcMortgage(1_500_000, 10, 0.0625, 30, 200_000, 0);
    expect(result.comfortStatus).not.toBe('green');
  });

  it('15-year term comparison shows interest savings', () => {
    const result = calcMortgage(800_000, 20, 0.0625, 30, 200_000, 0);
    expect(result.comparison.totalInterest15).toBeLessThan(result.comparison.totalInterest30);
    expect(result.comparison.interestSavings).toBeGreaterThan(0);
  });

  it('zero home price → zero loan', () => {
    const result = calcMortgage(0, 20, 0.0625, 30, 200_000, 0);
    expect(result.mortgage.loanAmount).toBe(0);
    expect(result.mortgage.monthlyPI).toBe(0);
  });
});
