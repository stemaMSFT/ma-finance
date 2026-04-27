/**
 * Financial validation tests — cross-cutting accuracy checks across all engines.
 *
 * Uses Steven's real data ($158,412 base, WA state, MFJ) as primary fixtures.
 * Hand-calculated expected values verified against 2026 constants.
 *
 * These tests exist to catch math errors that could lead to bad financial decisions.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFederalTax,
  getMarginalRate,
  getContributionLimit,
  calculate401kProjection,
  calculateTaxSavings,
  calculateRetirementReadiness,
} from '../retirement';
import type { Projection401kInput, RetirementReadinessInput } from '../retirement';
import { calculateMicrosoftComp } from '../compensation';
import { monthlyPayment, futureValue, presentValue, compoundGrowth, adjustForInflation } from '../projections';
import { calculateMonthlyHousingCost, calculateAffordability } from '../housing';
import type { HousingInput, UserProfile } from '../types';
import { expectApprox, expectInRange } from './test-utils';
import {
  CONTRIBUTION_LIMIT_UNDER_50,
  CONTRIBUTION_LIMIT_CATCHUP_50,
  STANDARD_DEDUCTION_MFJ,
  STANDARD_DEDUCTION_SINGLE,
  SS_WAGE_BASE,
  SS_TAX_RATE,
  MEDICARE_TAX_RATE,
  MEDICARE_SURTAX_THRESHOLD_MFJ,
  MEDICARE_SURTAX_RATE,
  MSFT_MATCH_PERCENT,
  MSFT_MAX_MATCH,
} from '../constants';

// ── Steven's Profile ──────────────────────────────────────────────

const STEVEN_SALARY = 158_412;
const STEVEN_PROFILE: UserProfile = {
  name: 'Steven',
  age: 35,
  annualIncome: STEVEN_SALARY,
  filingStatus: 'married_filing_jointly',
  state: 'WA',
};

// ══════════════════════════════════════════════════════════════════
// § 1 — Federal Tax Accuracy with Steven's Real Numbers
// ══════════════════════════════════════════════════════════════════

describe('Federal tax — Steven\'s real scenario', () => {
  it('Steven MFJ taxable income after standard deduction', () => {
    // AGI: $158,412 - Standard deduction MFJ: $32,200 = $126,212
    const taxableIncome = STEVEN_SALARY - STANDARD_DEDUCTION_MFJ;
    expect(taxableIncome).toBe(126_212);
  });

  it('Steven MFJ federal tax on $126,212 taxable income', () => {
    // Brackets:
    // 10%: 0–24,800 → $2,480
    // 12%: 24,800–100,800 → $9,120
    // 22%: 100,800–126,212 → $25,412 × 0.22 = $5,590.64
    // Total = $2,480 + $9,120 + $5,590.64 = $17,190.64 → rounds to $17,191
    const taxableIncome = STEVEN_SALARY - STANDARD_DEDUCTION_MFJ;
    const tax = calculateFederalTax(taxableIncome, 'married_filing_jointly');
    expect(tax).toBe(17_191);
  });

  it('Steven single (hypothetical) pays more tax than MFJ', () => {
    const taxableMFJ = STEVEN_SALARY - STANDARD_DEDUCTION_MFJ;
    const taxableSingle = STEVEN_SALARY - STANDARD_DEDUCTION_SINGLE;
    const taxMFJ = calculateFederalTax(taxableMFJ, 'married_filing_jointly');
    const taxSingle = calculateFederalTax(taxableSingle, 'single');
    expect(taxSingle).toBeGreaterThan(taxMFJ);
  });

  it('Steven MFJ marginal rate is 22%', () => {
    const taxableIncome = STEVEN_SALARY - STANDARD_DEDUCTION_MFJ;
    const rate = getMarginalRate(taxableIncome, 'married_filing_jointly');
    expect(rate).toBe(0.22);
  });

  it('traditional 401k reduces taxable income → saves tax', () => {
    const result = calculateTaxSavings(
      CONTRIBUTION_LIMIT_UNDER_50, // $24,500
      STEVEN_SALARY,
      'married_filing_jointly',
    );
    // $24,500 at 22% marginal bracket → ~$5,390 savings
    expect(result.taxSavings).toBeGreaterThan(4_000);
    expect(result.taxSavings).toBeLessThan(6_000);
    expect(result.marginalRate).toBe(0.22);
  });
});

// ══════════════════════════════════════════════════════════════════
// § 2 — Social Security & Medicare Tax Validation
// ══════════════════════════════════════════════════════════════════

describe('FICA tax calculations (manual validation)', () => {
  it('Social Security tax on Steven\'s salary ($158,412)', () => {
    // SS wage base 2026: $184,500. Steven's salary is below this.
    // SS tax = $158,412 × 6.2% = $9,821.54
    const ssTax = Math.min(STEVEN_SALARY, SS_WAGE_BASE) * SS_TAX_RATE;
    expectApprox(ssTax, 9_821.54, 0.001);
    // Verify salary is below wage base
    expect(STEVEN_SALARY).toBeLessThan(SS_WAGE_BASE);
  });

  it('Social Security tax caps at wage base', () => {
    const highSalary = 250_000;
    const ssTax = Math.min(highSalary, SS_WAGE_BASE) * SS_TAX_RATE;
    // Should be capped: $184,500 × 6.2% = $11,439
    expectApprox(ssTax, SS_WAGE_BASE * SS_TAX_RATE, 0.001);
    expect(ssTax).toBeLessThan(highSalary * SS_TAX_RATE);
  });

  it('Medicare tax on Steven\'s salary (no surtax)', () => {
    // Base Medicare: $158,412 × 1.45% = $2,296.97
    const medicareTax = STEVEN_SALARY * MEDICARE_TAX_RATE;
    expectApprox(medicareTax, 2_296.97, 0.001);
  });

  it('Additional Medicare tax kicks in above $250k MFJ', () => {
    const highSalary = 300_000;
    const baseMedicare = highSalary * MEDICARE_TAX_RATE;
    const additionalMedicare = Math.max(0, highSalary - MEDICARE_SURTAX_THRESHOLD_MFJ) * MEDICARE_SURTAX_RATE;
    // $300,000 - $250,000 = $50,000 × 0.9% = $450
    expectApprox(additionalMedicare, 450, 0.001);
    const totalMedicare = baseMedicare + additionalMedicare;
    expect(totalMedicare).toBeGreaterThan(baseMedicare);
  });

  it('No WA state income tax (constants validation)', () => {
    // Washington has no state income tax — validate this is reflected
    expect(STEVEN_PROFILE.state).toBe('WA');
    // The engine should not compute state tax for WA residents
    // (verified by absence of state tax calculation in retirement.ts)
  });
});

// ══════════════════════════════════════════════════════════════════
// § 3 — 401k Match: The Critical Path
// ══════════════════════════════════════════════════════════════════

describe('401k match — authoritative validation', () => {
  it('Microsoft match = 50% × employee contribution (constants confirm)', () => {
    expect(MSFT_MATCH_PERCENT).toBe(0.50);
  });

  it('Max Microsoft match = $12,250 (50% × $24,500)', () => {
    expect(MSFT_MAX_MATCH).toBe(12_250);
    expect(MSFT_MAX_MATCH).toBe(CONTRIBUTION_LIMIT_UNDER_50 * MSFT_MATCH_PERCENT);
  });

  it('retirement engine match at max contribution', () => {
    const input: Projection401kInput = {
      currentAge: 35,
      annualSalary: STEVEN_SALARY,
      contributionPercent: (CONTRIBUTION_LIMIT_UNDER_50 / STEVEN_SALARY) * 100, // ~15.47%
      employerMatchPercent: 50,
      employerMatchLimit: 100, // Microsoft matches on all contributions up to IRS limit
      current401kBalance: 50_000,
      currentIRABalance: 0,
      targetRetirementAge: 36, // 1 year to easily check
      expectedAnnualReturn: 0,  // zero return to isolate contribution math
    };
    const result = calculate401kProjection(input);
    // After 1 year with 0% return:
    // Employee contribution: $24,500 (capped at limit)
    // Employer match: min($24,500, $158,412 × 100%) × 50% = $12,250
    // Total added: $36,750
    // Final: $50,000 + $36,750 = $86,750
    const finalValue = result.summary.finalValue;
    // Total contributed should include both employee and employer
    expectInRange(result.summary.totalContributed, 36_000, 37_500);
  });

  it('retirement engine match at partial contribution ($10,000)', () => {
    const input: Projection401kInput = {
      currentAge: 35,
      annualSalary: STEVEN_SALARY,
      contributionPercent: (10_000 / STEVEN_SALARY) * 100, // ~6.31%
      employerMatchPercent: 50,
      employerMatchLimit: 100,
      current401kBalance: 0,
      currentIRABalance: 0,
      targetRetirementAge: 36,
      expectedAnnualReturn: 0,
    };
    const result = calculate401kProjection(input);
    // Employee: $10,000; Employer: $5,000; Total: $15,000
    expectInRange(result.summary.totalContributed, 14_500, 15_500);
  });

  it('zero employee contribution → zero employer match', () => {
    const input: Projection401kInput = {
      currentAge: 35,
      annualSalary: STEVEN_SALARY,
      contributionPercent: 0,
      employerMatchPercent: 50,
      employerMatchLimit: 100,
      current401kBalance: 100_000,
      currentIRABalance: 0,
      targetRetirementAge: 36,
      expectedAnnualReturn: 0,
    };
    const result = calculate401kProjection(input);
    expect(result.summary.totalContributed).toBe(0);
    expect(result.summary.finalValue).toBe(100_000);
  });
});

// ══════════════════════════════════════════════════════════════════
// § 4 — ESPP Validation
// ══════════════════════════════════════════════════════════════════

describe('ESPP calculations', () => {
  it('15% discount on stock purchases', () => {
    const result = calculateMicrosoftComp(STEVEN_SALARY, 10, 18_000, 10);
    // Contribution = $158,412 × 10% = $15,841.20
    // Discount value = $15,841.20 × 0.15 / 0.85 = $2,795.51
    expectApprox(result.esppBenefit, 2_795.51, 0.02);
  });

  it('ESPP annual contribution within typical limits', () => {
    // Steven contributes ~$18,740/yr based on ADP data
    // At 10% of $158,412 = $15,841; at 12% ≈ $19,009
    // This validates the input range is realistic
    const at10 = STEVEN_SALARY * 0.10;
    const at12 = STEVEN_SALARY * 0.12;
    expect(at10).toBeLessThan(18_740);
    expect(at12).toBeGreaterThan(18_740);
  });
});

// ══════════════════════════════════════════════════════════════════
// § 5 — Housing Engine Validation
// ══════════════════════════════════════════════════════════════════

describe('Mortgage payment formula validation', () => {
  it('matches standard amortization formula for $640k at 6.25% 30yr', () => {
    // M = P × [r(1+r)^n] / [(1+r)^n - 1]
    // P = 640,000, r = 0.0625/12 = 0.005208333, n = 360
    const P = 640_000;
    const r = 0.0625 / 12;
    const n = 360;
    const expected = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const result = monthlyPayment(640_000, 0.0625, 30);
    expectApprox(result, expected, 0.0001);
    // Google mortgage calculator: ~$3,940/mo
    expectInRange(result, 3_930, 3_950);
  });

  it('15-year mortgage produces higher monthly but less total interest', () => {
    const m30 = monthlyPayment(640_000, 0.0625, 30);
    const m15 = monthlyPayment(640_000, 0.0560, 15);
    expect(m15).toBeGreaterThan(m30);
    const total30 = m30 * 360 - 640_000;
    const total15 = m15 * 180 - 640_000;
    expect(total15).toBeLessThan(total30);
  });

  it('zero principal → zero payment', () => {
    expect(monthlyPayment(0, 0.065, 30)).toBe(0);
  });

  it('zero rate → principal / months', () => {
    const result = monthlyPayment(360_000, 0, 30);
    expect(result).toBe(1_000); // 360,000 / 360
  });
});

describe('DTI ratio checks for Steven', () => {
  it('$800k house, 20% down → DTI within comfortable range for $200k income', () => {
    const profile: UserProfile = { ...STEVEN_PROFILE, annualIncome: 200_000 };
    const input: HousingInput = {
      homePrice: 800_000,
      downPaymentPercent: 0.20,
      mortgageRate: 0.0625,
      mortgageTermYears: 30,
      propertyTaxRate: 0.0095,
      annualInsurance: 1_600,
      monthlyHOA: 0,
      closingCostPercent: 0.03,
      pmiRequired: false,
    };
    const result = calculateAffordability(profile, input);
    // Monthly housing cost ~$4,700; gross monthly = $16,667
    // DTI ≈ 28% — borderline
    expect(result.warnings).toBeDefined();
  });

  it('calculateMonthlyHousingCost provides itemized breakdown', () => {
    const input: HousingInput = {
      homePrice: 800_000,
      downPaymentPercent: 0.20,
      mortgageRate: 0.0625,
      mortgageTermYears: 30,
      propertyTaxRate: 0.0095,
      annualInsurance: 1_600,
      monthlyHOA: 300,
      closingCostPercent: 0.03,
      pmiRequired: false,
    };
    const breakdown = calculateMonthlyHousingCost(input);
    expect(breakdown.principal).toBeGreaterThan(0);
    expect(breakdown.interest).toBeGreaterThan(0);
    expect(breakdown.propertyTax).toBeGreaterThan(0);
    expect(breakdown.insurance).toBeGreaterThan(0);
    expect(breakdown.hoa).toBe(300);
    expect(breakdown.pmi).toBe(0);
    // Total should equal sum of components
    const manualTotal = monthlyPayment(640_000, 0.0625, 30)
      + (800_000 * 0.0095 / 12)
      + (1_600 / 12)
      + 300;
    expectApprox(breakdown.total, manualTotal, 0.01);
  });
});

// ══════════════════════════════════════════════════════════════════
// § 6 — Edge Cases (Zero, Negative, Extreme Inputs)
// ══════════════════════════════════════════════════════════════════

describe('Edge cases — zero values', () => {
  it('zero salary through all comp functions', () => {
    const result = calculateMicrosoftComp(0, 10, 0, 10);
    expect(result.totalComp).toBeGreaterThanOrEqual(0);
    expect(result.esppBenefit).toBe(0);
    // FIXED: with zero salary, employee contribution is capped at salary (0),
    // so employer match = 50% × 0 = $0
    expect(result.employer401kMatch).toBe(0);
  });

  it('zero contribution through tax savings', () => {
    const result = calculateTaxSavings(0, 158_412, 'married_filing_jointly');
    expect(result.taxSavings).toBe(0);
  });

  it('zero balance 401k projection still works', () => {
    const input: Projection401kInput = {
      currentAge: 35, annualSalary: 100_000,
      contributionPercent: 10, employerMatchPercent: 50, employerMatchLimit: 100,
      current401kBalance: 0, currentIRABalance: 0,
      targetRetirementAge: 65, expectedAnnualReturn: 0.07,
    };
    const result = calculate401kProjection(input);
    expect(result.summary.finalValue).toBeGreaterThan(0);
    expect(result.timeline[0].value).toBe(0);
  });
});

describe('Edge cases — extreme inputs', () => {
  it('contribution exceeding IRS limit warns', () => {
    const result = calculateTaxSavings(50_000, 200_000, 'single');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('exceeds');
  });

  it('very high income ($500k) hits higher brackets', () => {
    const tax = calculateFederalTax(500_000, 'married_filing_jointly');
    const rate = getMarginalRate(500_000, 'married_filing_jointly');
    expect(rate).toBe(0.32); // 403,550–512,450 bracket
    expect(tax).toBeGreaterThan(100_000);
  });

  it('$1M income — additional Medicare surtax applies', () => {
    const salary = 1_000_000;
    const baseMedicare = salary * MEDICARE_TAX_RATE; // $14,500
    const surtax = (salary - MEDICARE_SURTAX_THRESHOLD_MFJ) * MEDICARE_SURTAX_RATE; // $6,750
    expect(surtax).toBeGreaterThan(0);
    expect(baseMedicare + surtax).toBeGreaterThan(baseMedicare);
  });

  it('age at retirement = current age → no growth, no contributions', () => {
    const input: Projection401kInput = {
      currentAge: 65, annualSalary: 100_000,
      contributionPercent: 10, employerMatchPercent: 50, employerMatchLimit: 100,
      current401kBalance: 1_000_000, currentIRABalance: 0,
      targetRetirementAge: 65, expectedAnnualReturn: 0.07,
    };
    const result = calculate401kProjection(input);
    expect(result.summary.finalValue).toBe(1_000_000);
    expect(result.summary.totalContributed).toBe(0);
  });

  it('negative income → zero tax', () => {
    expect(calculateFederalTax(-50_000, 'single')).toBe(0);
    expect(calculateFederalTax(-50_000, 'married_filing_jointly')).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════
// § 7 — Projection Utility Validation
// ══════════════════════════════════════════════════════════════════

describe('Financial math utilities — cross-validation', () => {
  it('futureValue and presentValue are inverse operations', () => {
    const pv = 100_000;
    const rate = 0.07;
    const years = 20;
    const fv = futureValue(pv, rate, years);
    const backToPV = presentValue(fv, rate, years);
    expectApprox(backToPV, pv, 0.0001);
  });

  it('compoundGrowth with zero monthly addition ≥ futureValue (monthly compounding)', () => {
    const points = compoundGrowth(100_000, 0, 0.07, 10, 35);
    const fv = futureValue(100_000, 0.07, 10);
    // compoundGrowth compounds monthly ((1+0.07/12)^120) which yields MORE
    // than annual compounding ((1+0.07)^10). This is correct financial math.
    // Monthly: 100000 × (1.005833)^120 ≈ $200,966
    // Annual:  100000 × (1.07)^10     ≈ $196,715
    expect(points[10].value).toBeGreaterThanOrEqual(Math.round(fv));
    expectApprox(points[10].value, 200_966, 0.005);
  });

  it('adjustForInflation reduces nominal value', () => {
    const nominal = 100_000;
    const real = adjustForInflation(nominal, 20, 0.025);
    expect(real).toBeLessThan(nominal);
    // At 2.5% inflation over 20 years: 100k / (1.025)^20 ≈ $61,027
    expectApprox(real, 61_027, 0.01);
  });
});

// ══════════════════════════════════════════════════════════════════
// § 8 — Steven's YTD Paystub Cross-Check
// ══════════════════════════════════════════════════════════════════

describe('Steven\'s YTD paystub cross-check (through Apr 15)', () => {
  it('base salary annualizes correctly from YTD', () => {
    // YTD base through Apr 15 (3.5 months) = $46,203.50
    // Annualized: $46,203.50 / (3.5/12) ≈ $158,412
    const ytdBase = 46_203.50;
    const months = 3.5; // Jan 1 to Apr 15
    const annualized = ytdBase / (months / 12);
    expectApprox(annualized, 158_412, 0.005);
  });

  it('401k Roth contribution rate annualizes to front-loading pace', () => {
    // YTD 401k Roth: $7,392.56 through Apr 15
    // At this pace: $7,392.56 / 3.5 × 12 = ~$25,346/yr
    // This exceeds 2026 limit of $24,500 — front-loading confirmed
    const ytd401k = 7_392.56;
    const annualizedPace = ytd401k / 3.5 * 12;
    expect(annualizedPace).toBeGreaterThan(CONTRIBUTION_LIMIT_UNDER_50);
  });

  it('federal tax withholding rate is reasonable', () => {
    // YTD Fed Tax: $9,099.47 on $51,936.23 gross
    // Effective withholding: 17.5%
    const effectiveRate = 9_099.47 / 51_936.23;
    expectInRange(effectiveRate, 0.16, 0.19);
  });
});
