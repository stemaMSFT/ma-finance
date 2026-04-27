/**
 * Tests for housing.ts — mortgage affordability, PMI, closing costs.
 *
 * Note: housing.ts currently has stub implementations that return zeroed-out
 * ScenarioResults. These tests define the CONTRACT that the real implementation
 * must satisfy. Tests that depend on non-stub behavior will be noted.
 *
 * Financial math verified against projections.ts monthlyPayment function and
 * standard mortgage formulas.
 */

import { describe, it, expect } from 'vitest';
import { calculateAffordability, compareRenovationVsSave } from '../housing';
import { monthlyPayment } from '../projections';
import {
  STEVEN_PROFILE,
  DEFAULT_HOUSING,
  DEFAULT_RENOVATION,
  expectApprox,
  expectInRange,
} from './test-utils';
import type { HousingInput, RenovationInput } from '../types';
import { PMI_RATE } from '../constants';

// ── calculateAffordability: structure tests ───────────────────────

describe('calculateAffordability', () => {
  it('returns a ScenarioResult with expected shape', () => {
    const result = calculateAffordability(STEVEN_PROFILE, DEFAULT_HOUSING);
    expect(result).toBeDefined();
    expect(result.name).toBeTruthy();
    expect(result.description).toBeTruthy();
    expect(Array.isArray(result.timeline)).toBe(true);
    expect(result.summary).toBeDefined();
    expect(typeof result.summary.totalContributed).toBe('number');
    expect(typeof result.summary.totalGrowth).toBe('number');
    expect(typeof result.summary.finalValue).toBe('number');
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('does not throw for any valid input', () => {
    expect(() => calculateAffordability(STEVEN_PROFILE, DEFAULT_HOUSING)).not.toThrow();
  });

  it('does not throw with zero down payment', () => {
    const input: HousingInput = {
      ...DEFAULT_HOUSING,
      homePrice: 500_000,
      downPaymentPercent: 0,
      pmiRequired: true,
    };
    expect(() => calculateAffordability(STEVEN_PROFILE, input)).not.toThrow();
  });

  it('does not throw with 100% down payment', () => {
    const input: HousingInput = {
      ...DEFAULT_HOUSING,
      homePrice: 500_000,
      downPaymentPercent: 1.0,
      pmiRequired: false,
    };
    expect(() => calculateAffordability(STEVEN_PROFILE, input)).not.toThrow();
  });

  it('does not throw with zero mortgage rate', () => {
    const input: HousingInput = {
      ...DEFAULT_HOUSING,
      mortgageRate: 0,
    };
    expect(() => calculateAffordability(STEVEN_PROFILE, input)).not.toThrow();
  });
});

// ── Mortgage math verification (using projections.ts directly) ────

describe('mortgage math (via monthlyPayment)', () => {
  it('$500k loan at 6.5% 30yr → ~$3,160 P&I', () => {
    const result = monthlyPayment(500_000, 0.065, 30);
    expectApprox(result, 3_160, 0.005);
  });

  it('$640k loan at 6.25% 30yr → ~$3,940 P&I', () => {
    // DEFAULT_HOUSING: $800k home, 20% down → $640k loan
    const loanAmount = 800_000 * (1 - 0.20);
    const result = monthlyPayment(loanAmount, 0.0625, 30);
    expectApprox(result, 3_940, 0.01);
  });

  it('15yr term has higher monthly but less total interest', () => {
    const loan = 400_000;
    const m30 = monthlyPayment(loan, 0.0625, 30);
    const m15 = monthlyPayment(loan, 0.056, 15);
    expect(m15).toBeGreaterThan(m30);
    expect(m15 * 180).toBeLessThan(m30 * 360);
  });

  it('$400,000 at 6.5% for 30 years → ~$2,528/mo', () => {
    const result = monthlyPayment(400_000, 0.065, 30);
    expect(result).toBeCloseTo(2_528.27, 0);
  });
});

// ── PITI breakdown calculations ───────────────────────────────────

describe('PITI calculation (manual verification)', () => {
  it('property tax: 0.95% × $800k → $7,600/yr ($633/mo)', () => {
    const homePrice = 800_000;
    const taxRate = 0.0095;
    const annualTax = homePrice * taxRate;
    expect(annualTax).toBe(7_600);
    expectApprox(annualTax / 12, 633, 0.01);
  });

  it('insurance: $1,600/yr → $133/mo', () => {
    const annualInsurance = 1_600;
    expectApprox(annualInsurance / 12, 133.33, 0.01);
  });

  it('total PITI for $800k home, 20% down, 6.25% → ~$4,706/mo', () => {
    const loan = 800_000 * 0.80; // $640k
    const pi = monthlyPayment(loan, 0.0625, 30);
    const tax = 800_000 * 0.0095 / 12;
    const insurance = 1_600 / 12;
    const total = pi + tax + insurance;
    expectInRange(total, 4_600, 4_900);
  });

  it('HOA adds to total monthly cost', () => {
    const loan = 800_000 * 0.80;
    const baseMonthly = monthlyPayment(loan, 0.0625, 30) + 800_000 * 0.0095 / 12 + 1_600 / 12;
    const withHOA = baseMonthly + 300;
    expect(withHOA).toBeGreaterThan(baseMonthly);
    expect(withHOA - baseMonthly).toBe(300);
  });
});

// ── Affordability rules (28/36 rule) ──────────────────────────────

describe('28/36 affordability rule (manual verification)', () => {
  it('$200k income → max 28% front-end = $4,667/mo', () => {
    const maxHousing = 200_000 * 0.28 / 12;
    expectApprox(maxHousing, 4_667, 0.01);
  });

  it('$200k income → max 36% back-end = $6,000/mo', () => {
    const maxDebt = 200_000 * 0.36 / 12;
    expect(maxDebt).toBe(6_000);
  });

  it('$800k home PITI is close to 28% threshold for $200k income', () => {
    const loan = 800_000 * 0.80;
    const piti = monthlyPayment(loan, 0.0625, 30) + 800_000 * 0.0095 / 12 + 1_600 / 12;
    const ratio = (piti * 12) / 200_000;
    // Should be around 28% — borderline
    expectInRange(ratio, 0.26, 0.30);
  });

  it('$1.2M home clearly exceeds 28% for $200k income', () => {
    const loan = 1_200_000 * 0.80;
    const piti = monthlyPayment(loan, 0.0625, 30) + 1_200_000 * 0.0095 / 12 + 1_600 / 12;
    const ratio = (piti * 12) / 200_000;
    expect(ratio).toBeGreaterThan(0.28);
  });
});

// ── PMI calculations ──────────────────────────────────────────────

describe('PMI calculations (manual verification)', () => {
  it('PMI rate from constants: 0.7% annually', () => {
    expect(PMI_RATE).toBe(0.007);
  });

  it('PMI on $360k loan → $2,520/yr ($210/mo)', () => {
    const loanAmount = 360_000;
    const annualPmi = loanAmount * PMI_RATE;
    expect(annualPmi).toBe(2_520);
    expect(annualPmi / 12).toBe(210);
  });

  it('PMI on $540k loan (10% down on $600k) → $3,780/yr', () => {
    const loanAmount = 600_000 * 0.90;
    const annualPmi = loanAmount * PMI_RATE;
    expect(annualPmi).toBe(3_780);
  });

  it('no PMI when down payment is 20%+', () => {
    // 20% down → 80% LTV → no PMI required
    const downPercent = 0.20;
    expect(downPercent).toBeGreaterThanOrEqual(0.20);
  });

  it('PMI drops at 80% LTV', () => {
    const homeValue = 400_000;
    const ltvThreshold = 0.80;
    const equityNeeded = homeValue * (1 - ltvThreshold);
    expect(equityNeeded).toBeCloseTo(80_000, 0);
  });
});

// ── Closing costs ─────────────────────────────────────────────────

describe('closing costs (manual verification)', () => {
  it('3% of $600k → $18,000', () => {
    expect(600_000 * 0.03).toBe(18_000);
  });

  it('3% of $800k → $24,000', () => {
    expect(800_000 * 0.03).toBe(24_000);
  });

  it('total cash needed = down payment + closing costs', () => {
    const homePrice = 600_000;
    const downPercent = 0.20;
    const closingPercent = 0.03;
    const totalCash = homePrice * (downPercent + closingPercent);
    expect(totalCash).toBe(138_000);
  });

  it('$800k home, 20% down, 3% closing → $184,000 cash needed', () => {
    const homePrice = 800_000;
    const down = homePrice * 0.20;
    const closing = homePrice * 0.03;
    expect(down + closing).toBe(184_000);
  });
});

// ── compareRenovationVsSave ───────────────────────────────────────

describe('compareRenovationVsSave', () => {
  it('returns a ScenarioResult with expected shape (stub)', () => {
    const result = compareRenovationVsSave(DEFAULT_RENOVATION, 0.07);
    expect(result).toBeDefined();
    expect(result.name).toBeTruthy();
    expect(Array.isArray(result.timeline)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('does not throw for valid inputs', () => {
    expect(() => compareRenovationVsSave(DEFAULT_RENOVATION, 0.07)).not.toThrow();
  });

  it('renovation ROI: $8k cost, $6.4k value add → 80% ROI', () => {
    const roi = DEFAULT_RENOVATION.expectedValueAdd / DEFAULT_RENOVATION.projectCost;
    expect(roi).toBe(0.80);
  });
});

// ── Renovation ROI math (manual verification) ─────────────────────

describe('renovation ROI math', () => {
  it('garage door: best ROI at 194%', () => {
    const cost = 4_000;
    const valueAdd = cost * 1.94;
    expect(valueAdd).toBe(7_760);
  });

  it('major kitchen: lower ROI 60-66%', () => {
    const cost = 90_000;
    const valueAddLow = cost * 0.60;
    const valueAddHigh = cost * 0.66;
    expect(valueAddLow).toBe(54_000);
    expect(valueAddHigh).toBe(59_400);
  });

  it('opportunity cost: $8k invested at 7% for 10 years → ~$15,737', () => {
    // If you invest the renovation money instead
    const invested = 8_000 * Math.pow(1.07, 10);
    expectApprox(invested, 15_737, 0.01);
  });
});
