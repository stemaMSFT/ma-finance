/**
 * Tests for projections.ts — compound growth, future/present value, monthly payment,
 * adjustForInflation, calculateSavingsGoal, calculateNetWorthProjection.
 *
 * Financial accuracy is CRITICAL. Expected values verified against standard
 * financial calculator formulas.
 */

import { describe, it, expect } from 'vitest';
import {
  compoundGrowth,
  futureValue,
  presentValue,
  monthlyPayment,
  adjustForInflation,
  calculateSavingsGoal,
  calculateNetWorthProjection,
} from '../projections';
import type { NetWorthInput } from '../projections';
import { expectApprox, expectInRange } from './test-utils';

// ── futureValue ───────────────────────────────────────────────────

describe('futureValue', () => {
  it('compounds $10,000 at 7% for 10 years → ~$19,671.51', () => {
    const result = futureValue(10_000, 0.07, 10);
    expect(result).toBeCloseTo(19_671.51, 0);
  });

  it('compounds $100k at 7% for 10 years to ~$196,715', () => {
    const result = futureValue(100_000, 0.07, 10);
    expectApprox(result, 196_715, 0.001);
  });

  it('compounds $50k at 6% for 20 years', () => {
    const result = futureValue(50_000, 0.06, 20);
    expectApprox(result, 160_357, 0.001);
  });

  it('returns principal unchanged at 0% return', () => {
    const result = futureValue(100_000, 0, 10);
    expect(result).toBe(100_000);
  });

  it('returns principal unchanged at 0 years', () => {
    const result = futureValue(100_000, 0.07, 0);
    expect(result).toBe(100_000);
  });

  it('returns principal for negative years', () => {
    const result = futureValue(100_000, 0.07, -5);
    expect(result).toBe(100_000);
  });

  it('returns 0 for zero principal', () => {
    const result = futureValue(0, 0.07, 30);
    expect(result).toBe(0);
  });

  it('handles a negative return (market loss)', () => {
    const result = futureValue(100_000, -0.10, 1);
    expectApprox(result, 90_000, 0.001);
  });

  it('projects $100k over 50 years at 7%', () => {
    const result = futureValue(100_000, 0.07, 50);
    expectInRange(result, 2_900_000, 3_000_000);
  });

  it('very large principal stays finite', () => {
    const result = futureValue(1_000_000_000, 0.07, 100);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(1_000_000_000);
  });
});

// ── presentValue ──────────────────────────────────────────────────

describe('presentValue', () => {
  it('discounts $19,671.51 at 7% over 10 years back to ~$10,000', () => {
    const result = presentValue(19_671.51, 0.07, 10);
    expect(result).toBeCloseTo(10_000, 0);
  });

  it('discounts $196,715 at 7% over 10 years back to ~$100k', () => {
    const result = presentValue(196_715, 0.07, 10);
    expectApprox(result, 100_000, 0.001);
  });

  it('inflation-adjusts $100k over 20 years at 2.5%', () => {
    const result = presentValue(100_000, 0.025, 20);
    expectApprox(result, 61_027, 0.01);
  });

  it('returns full amount at 0% discount rate', () => {
    const result = presentValue(100_000, 0, 10);
    expect(result).toBe(100_000);
  });

  it('returns full amount at 0 years', () => {
    const result = presentValue(100_000, 0.07, 0);
    expect(result).toBe(100_000);
  });

  it('returns full amount for negative years', () => {
    const result = presentValue(100_000, 0.07, -3);
    expect(result).toBe(100_000);
  });

  it('returns 0 for zero future amount', () => {
    const result = presentValue(0, 0.07, 30);
    expect(result).toBe(0);
  });

  it('is the inverse of futureValue', () => {
    const principal = 75_000;
    const fv = futureValue(principal, 0.07, 15);
    const pv = presentValue(fv, 0.07, 15);
    expectApprox(pv, principal, 0.0001);
  });

  it('symmetry: presentValue(futureValue(x)) ≈ x for many rates', () => {
    for (const rate of [0.03, 0.05, 0.10, 0.15]) {
      const pv = presentValue(futureValue(50_000, rate, 20), rate, 20);
      expectApprox(pv, 50_000, 0.0001);
    }
  });
});

// ── monthlyPayment ────────────────────────────────────────────────

describe('monthlyPayment', () => {
  it('$400,000 mortgage at 6.5% for 30 years → ~$2,528.27/mo', () => {
    const result = monthlyPayment(400_000, 0.065, 30);
    expect(result).toBeCloseTo(2_528.27, 0);
  });

  it('$400,000 at 6.5% for 15 years → ~$3,484.86/mo', () => {
    const result = monthlyPayment(400_000, 0.065, 15);
    expect(result).toBeCloseTo(3_484.86, 0);
  });

  it('$500k loan at 6.5% for 30yr → ~$3,160/mo', () => {
    const result = monthlyPayment(500_000, 0.065, 30);
    expectApprox(result, 3_160, 0.005);
  });

  it('$320k loan at 6.25% for 30yr → ~$1,974/mo', () => {
    const result = monthlyPayment(320_000, 0.0625, 30);
    expectApprox(result, 1_974, 0.005);
  });

  it('$480k loan at 6.25% for 30yr', () => {
    const result = monthlyPayment(480_000, 0.0625, 30);
    expectInRange(result, 2_900, 3_100);
  });

  it('15-year mortgage has higher monthly but lower total cost', () => {
    const monthly30 = monthlyPayment(400_000, 0.0625, 30);
    const monthly15 = monthlyPayment(400_000, 0.056, 15);
    expect(monthly15).toBeGreaterThan(monthly30);
    const total30 = monthly30 * 30 * 12;
    const total15 = monthly15 * 15 * 12;
    expect(total15).toBeLessThan(total30);
  });

  it('zero principal → 0', () => {
    expect(monthlyPayment(0, 0.0625, 30)).toBe(0);
  });

  it('zero rate → principal / (term * 12)', () => {
    const result = monthlyPayment(360_000, 0, 30);
    expect(result).toBeCloseTo(1_000, 2);
  });

  it('zero term → 0', () => {
    expect(monthlyPayment(400_000, 0.065, 0)).toBe(0);
  });

  it('negative principal → 0', () => {
    expect(monthlyPayment(-100_000, 0.065, 30)).toBe(0);
  });

  it('15-year term at same rate has higher monthly than 30-year', () => {
    const m30 = monthlyPayment(500_000, 0.065, 30);
    const m15 = monthlyPayment(500_000, 0.065, 15);
    expect(m15).toBeGreaterThan(m30);
  });
});

// ── compoundGrowth ────────────────────────────────────────────────

describe('compoundGrowth', () => {
  it('returns years + 1 points (0 through n)', () => {
    const timeline = compoundGrowth(100_000, 0, 0.07, 10);
    expect(timeline).toHaveLength(11);
  });

  it('year 0 point equals principal', () => {
    const timeline = compoundGrowth(100_000, 500, 0.07, 10, 30);
    expect(timeline[0].value).toBe(100_000);
    expect(timeline[0].year).toBe(0);
    expect(timeline[0].age).toBe(30);
  });

  it('grows $100k at 7% with no contributions (monthly compounding) after 10 years', () => {
    // Monthly compounding: 100000 × (1 + 0.07/12)^120 ≈ $200,966
    // (higher than annual compounding FV of $196,715)
    const timeline = compoundGrowth(100_000, 0, 0.07, 10);
    const final = timeline[timeline.length - 1];
    expectApprox(final.value, 200_966, 0.01);
  });

  it('$100k + $500/mo at 7% for 30 years → substantial growth', () => {
    // $500/mo = $6k/yr, with monthly compounding at 7% over 30 years
    // FV of lump sum: 100k * (1.07)^30 ≈ $761k
    // FV of annuity (monthly): ~$610k
    // Total ≈ $1.37M–$1.45M
    const timeline = compoundGrowth(100_000, 500, 0.07, 30);
    const final = timeline[timeline.length - 1];
    expectInRange(final.value, 1_300_000, 1_500_000);
  });

  it('each year is larger than previous with positive rate and contributions', () => {
    const timeline = compoundGrowth(50_000, 1_000, 0.07, 20);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].value).toBeGreaterThan(timeline[i - 1].value);
    }
  });

  it('startAge propagates correctly', () => {
    const timeline = compoundGrowth(100_000, 0, 0.07, 5, 35);
    expect(timeline[0].age).toBe(35);
    expect(timeline[3].age).toBe(38);
    expect(timeline[5].age).toBe(40);
  });

  it('year properties are sequential 0..n', () => {
    const timeline = compoundGrowth(100_000, 1_000, 0.07, 5);
    timeline.forEach((point, idx) => {
      expect(point.year).toBe(idx);
    });
  });

  it('returns empty array when years <= 0', () => {
    const timeline = compoundGrowth(100_000, 5_000, 0.07, 0);
    expect(timeline).toHaveLength(0);
  });

  it('returns empty array for negative years', () => {
    const timeline = compoundGrowth(100_000, 500, 0.07, -5);
    expect(timeline).toHaveLength(0);
  });

  it('zero principal and zero contribution → all zeros', () => {
    const timeline = compoundGrowth(0, 0, 0.07, 10);
    timeline.forEach(point => {
      expect(point.value).toBe(0);
    });
  });

  it('0% return accumulates contributions linearly', () => {
    // 10_000/mo * 12 months * 5 years = 600_000
    const timeline = compoundGrowth(0, 10_000, 0, 5);
    expect(timeline[5].value).toBeCloseTo(600_000, 0);
  });

  it('50-year horizon stays numerically stable', () => {
    const timeline = compoundGrowth(100_000, 24_500, 0.07, 50);
    const final = timeline[timeline.length - 1];
    expect(final.value).toBeGreaterThan(10_000_000);
    expect(Number.isFinite(final.value)).toBe(true);
  });

  it('negative principal is clamped to 0', () => {
    const timeline = compoundGrowth(-50_000, 1_000, 0.07, 5);
    expect(timeline[0].value).toBe(0);
  });

  it('negative monthlyAdd is clamped to 0', () => {
    const timeline = compoundGrowth(100_000, -500, 0.07, 5);
    // Balance should only grow from returns, no negative contributions
    expect(timeline[5].value).toBeGreaterThan(100_000);
  });
});

// ── adjustForInflation ────────────────────────────────────────────

describe('adjustForInflation', () => {
  it('$100,000 adjusted for 30 years at 2.5% → ~$47,674', () => {
    // 100000 / (1.025)^30 = 100000 / 2.09757 ≈ $47,674
    const result = adjustForInflation(100_000, 30, 0.025);
    expect(result).toBeCloseTo(47_674, -1);
  });

  it('0 years → returns amount unchanged', () => {
    expect(adjustForInflation(100_000, 0, 0.025)).toBe(100_000);
  });

  it('negative years → returns amount unchanged', () => {
    expect(adjustForInflation(100_000, -5, 0.025)).toBe(100_000);
  });

  it('0% inflation → returns amount unchanged', () => {
    expect(adjustForInflation(50_000, 20, 0)).toBe(50_000);
  });

  it('uses DEFAULT_INFLATION_RATE (2.5%) when omitted', () => {
    const withExplicit = adjustForInflation(100_000, 10, 0.025);
    const withDefault = adjustForInflation(100_000, 10);
    expect(withDefault).toBeCloseTo(withExplicit, 2);
  });

  it('higher inflation erodes value faster', () => {
    const low = adjustForInflation(100_000, 20, 0.02);
    const high = adjustForInflation(100_000, 20, 0.05);
    expect(high).toBeLessThan(low);
  });

  it('$1,000,000 in 10 years at 3% → ~$744,094', () => {
    const result = adjustForInflation(1_000_000, 10, 0.03);
    expect(result).toBeCloseTo(744_094, -1);
  });
});

// ── calculateSavingsGoal ──────────────────────────────────────────

describe('calculateSavingsGoal', () => {
  it('reachable goal: $500k target with $50k current + $2k/mo at 7%', () => {
    const result = calculateSavingsGoal(500_000, 50_000, 2_000, 0.07, 40, 30);
    expect(result.goalReached).toBe(true);
    expect(result.monthsToGoal).not.toBeNull();
    expect(result.yearsToGoal).not.toBeNull();
    // Should take roughly 10-15 years
    expectInRange(result.yearsToGoal!, 8, 16);
  });

  it('goal already met: target <= current balance → reached in month 1', () => {
    // The function checks balance >= target after each month step,
    // so when starting balance already exceeds target, it's reached on month 1
    const result = calculateSavingsGoal(50_000, 100_000, 500, 0.07, 40, 30);
    expect(result.goalReached).toBe(true);
    expect(result.monthsToGoal).toBe(1);
    expect(result.yearsToGoal).toBeCloseTo(1 / 12, 4);
  });

  it('target of $0 → immediately reached', () => {
    const result = calculateSavingsGoal(0, 10_000, 500, 0.07, 40, 30);
    expect(result.goalReached).toBe(true);
    expect(result.monthsToGoal).toBe(0);
  });

  it('unreachable goal: $100M with $100/mo and no savings', () => {
    const result = calculateSavingsGoal(100_000_000, 0, 100, 0.07, 40, 30);
    expect(result.goalReached).toBe(false);
    expect(result.monthsToGoal).toBeNull();
    expect(result.yearsToGoal).toBeNull();
  });

  it('timeline length is maxYears + 1', () => {
    const result = calculateSavingsGoal(1_000_000, 0, 1_000, 0.07, 20, 25);
    expect(result.timeline).toHaveLength(21); // year 0..20
  });

  it('timeline year 0 equals currentSavings', () => {
    const result = calculateSavingsGoal(500_000, 75_000, 1_000, 0.07, 30, 30);
    expect(result.timeline[0].value).toBe(75_000);
    expect(result.timeline[0].age).toBe(30);
  });

  it('finalBalance reflects end of projection even when goal is not met', () => {
    const result = calculateSavingsGoal(100_000_000, 0, 100, 0.07, 10, 30);
    expect(result.goalReached).toBe(false);
    expect(result.finalBalance).toBeGreaterThan(0);
  });

  it('zero rate accumulates monthly contributions linearly', () => {
    const result = calculateSavingsGoal(120_000, 0, 1_000, 0, 40, 30);
    expect(result.goalReached).toBe(true);
    // 120_000 / 1_000 = 120 months = 10 years
    expect(result.monthsToGoal).toBe(120);
    expect(result.yearsToGoal).toBe(10);
  });

  it('startAge propagates into timeline ages', () => {
    const result = calculateSavingsGoal(100_000, 0, 500, 0.05, 10, 40);
    expect(result.timeline[0].age).toBe(40);
    expect(result.timeline[5].age).toBe(45);
    expect(result.timeline[10].age).toBe(50);
  });
});

// ── calculateNetWorthProjection ───────────────────────────────────

describe('calculateNetWorthProjection', () => {
  const baseInput: NetWorthInput = {
    currentAge: 35,
    liquidAssets: 100_000,
    retirementAssets: 150_000,
    homeEquity: 200_000,
    monthlySavings: 2_000,
    monthly401kContrib: 1_500,
    monthlyEmployerMatch: 750,
    monthlyMortgagePrincipal: 500,
    liquidReturn: 0.07,
    retirementReturn: 0.07,
    homeAppreciation: 0.035,
    years: 10,
  };

  it('returns years + 1 data points', () => {
    const points = calculateNetWorthProjection(baseInput);
    expect(points).toHaveLength(11);
  });

  it('year 0 baseline is correct', () => {
    const points = calculateNetWorthProjection(baseInput);
    const p0 = points[0];
    expect(p0.year).toBe(0);
    expect(p0.age).toBe(35);
    expect(p0.liquidAssets).toBe(100_000);
    expect(p0.retirementAssets).toBe(150_000);
    expect(p0.homeEquity).toBe(200_000);
    expect(p0.value).toBe(450_000);
  });

  it('total value ≈ sum of three components at every point (±1 rounding)', () => {
    const points = calculateNetWorthProjection(baseInput);
    for (const p of points) {
      const sum = p.liquidAssets + p.retirementAssets + p.homeEquity;
      expect(Math.abs(p.value - sum)).toBeLessThanOrEqual(1);
    }
  });

  it('all three asset classes grow independently', () => {
    const points = calculateNetWorthProjection(baseInput);
    const last = points[points.length - 1];
    expect(last.liquidAssets).toBeGreaterThan(100_000);
    expect(last.retirementAssets).toBeGreaterThan(150_000);
    expect(last.homeEquity).toBeGreaterThan(200_000);
  });

  it('monthly contributions are applied (liquid grows more with savings)', () => {
    const noSavings: NetWorthInput = { ...baseInput, monthlySavings: 0 };
    const withSavings = calculateNetWorthProjection(baseInput);
    const withoutSavings = calculateNetWorthProjection(noSavings);
    const lastWith = withSavings[withSavings.length - 1];
    const lastWithout = withoutSavings[withoutSavings.length - 1];
    expect(lastWith.liquidAssets).toBeGreaterThan(lastWithout.liquidAssets);
  });

  it('retirement grows from 401k + employer match', () => {
    const noContrib: NetWorthInput = {
      ...baseInput,
      monthly401kContrib: 0,
      monthlyEmployerMatch: 0,
    };
    const withContrib = calculateNetWorthProjection(baseInput);
    const withoutContrib = calculateNetWorthProjection(noContrib);
    expect(withContrib[10].retirementAssets).toBeGreaterThan(
      withoutContrib[10].retirementAssets,
    );
  });

  it('total net worth grows year over year', () => {
    const points = calculateNetWorthProjection(baseInput);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].value).toBeGreaterThan(points[i - 1].value);
    }
  });

  it('zero returns with contributions → linear growth only', () => {
    const zeroReturn: NetWorthInput = {
      ...baseInput,
      liquidReturn: 0,
      retirementReturn: 0,
      homeAppreciation: 0,
    };
    const points = calculateNetWorthProjection(zeroReturn);
    const last = points[10];
    // liquid: 100k + 2000*12*10 = 340k
    expect(last.liquidAssets).toBeCloseTo(340_000, -2);
    // retirement: 150k + (1500+750)*12*10 = 420k
    expect(last.retirementAssets).toBeCloseTo(420_000, -2);
    // equity: 200k + 500*12*10 = 260k
    expect(last.homeEquity).toBeCloseTo(260_000, -2);
  });

  it('ages increment correctly', () => {
    const points = calculateNetWorthProjection(baseInput);
    points.forEach((p, i) => {
      expect(p.age).toBe(35 + i);
    });
  });

  it('negative initial assets are clamped to 0', () => {
    const negInput: NetWorthInput = {
      ...baseInput,
      liquidAssets: -50_000,
      retirementAssets: -10_000,
      homeEquity: -20_000,
    };
    const points = calculateNetWorthProjection(negInput);
    expect(points[0].liquidAssets).toBe(0);
    expect(points[0].retirementAssets).toBe(0);
    expect(points[0].homeEquity).toBe(0);
  });
});
