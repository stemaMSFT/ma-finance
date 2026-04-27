/**
 * Tests for retirement.ts — federal tax, 401(k) projections, employer match,
 * contribution limits, tax savings, Roth vs Traditional, retirement readiness.
 *
 * Financial accuracy is CRITICAL. Expected values derived from:
 * - constants.ts tax brackets and contribution limits
 * - Standard financial calculator formulas
 * - financial-reference.md
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFederalTax,
  getMarginalRate,
  getContributionLimit,
  calculate401kProjection,
  calculateRetirementReadiness,
  calculateTaxSavings,
  calculateRothVsTraditional,
  calculateMaxContributionImpact,
  projectRetirement,
  calculate401kMaxOut,
} from '../retirement';
import type { Projection401kInput, RetirementReadinessInput, RothVsTraditionalInput } from '../retirement';
import {
  STEVEN_PROFILE,
  DEFAULT_RETIREMENT,
  expectApprox,
  expectInRange,
} from './test-utils';
import type { RetirementInput } from '../types';
import {
  CONTRIBUTION_LIMIT_UNDER_50,
  CONTRIBUTION_LIMIT_CATCHUP_50,
  CONTRIBUTION_LIMIT_SUPER_CATCHUP_60_63,
  STANDARD_DEDUCTION_MFJ,
  STANDARD_DEDUCTION_SINGLE,
} from '../constants';

// ── calculateFederalTax ───────────────────────────────────────────

describe('calculateFederalTax', () => {
  it('zero income → $0 tax', () => {
    expect(calculateFederalTax(0, 'married_filing_jointly')).toBe(0);
  });

  it('negative income → $0 tax', () => {
    expect(calculateFederalTax(-10_000, 'single')).toBe(0);
  });

  it('$100,000 taxable income MFJ → correct bracket calculation', () => {
    // MFJ brackets: 10% on 0–24,800; 12% on 24,800–100,800
    // Tax = 24,800 * 0.10 + (100,000 - 24,800) * 0.12
    //     = 2,480 + 75,200 * 0.12
    //     = 2,480 + 9,024 = 11,504
    const result = calculateFederalTax(100_000, 'married_filing_jointly');
    expect(result).toBe(11_504);
  });

  it('$50,000 taxable income single → correct bracket calculation', () => {
    // Single brackets: 10% on 0–12,400; 12% on 12,400–50,400
    // Tax = 12,400 * 0.10 + (50,000 - 12,400) * 0.12
    //     = 1,240 + 37,600 * 0.12
    //     = 1,240 + 4,512 = 5,752
    const result = calculateFederalTax(50_000, 'single');
    expect(result).toBe(5_752);
  });

  it('$200,000 MFJ hits 22% bracket', () => {
    // 10% on 0–24,800 = 2,480
    // 12% on 24,800–100,800 = 9,120
    // 22% on 100,800–200,000 = 21,824
    // Total = 33,424
    const result = calculateFederalTax(200_000, 'married_filing_jointly');
    expect(result).toBe(33_424);
  });

  it('very high income ($1M) MFJ → top bracket kicks in', () => {
    const result = calculateFederalTax(1_000_000, 'married_filing_jointly');
    // Should be well above $200k in tax
    expect(result).toBeGreaterThan(200_000);
    // But less than 37% flat rate (370k)
    expect(result).toBeLessThan(370_000);
  });

  it('same income produces different tax for single vs MFJ', () => {
    const mfj = calculateFederalTax(150_000, 'married_filing_jointly');
    const single = calculateFederalTax(150_000, 'single');
    // Single should pay more due to narrower brackets
    expect(single).toBeGreaterThan(mfj);
  });

  it('head_of_household falls between single and MFJ', () => {
    const income = 100_000;
    const single = calculateFederalTax(income, 'single');
    const hoh = calculateFederalTax(income, 'head_of_household');
    const mfj = calculateFederalTax(income, 'married_filing_jointly');
    expect(hoh).toBeLessThanOrEqual(single);
    expect(hoh).toBeGreaterThanOrEqual(mfj);
  });

  it('income exactly at bracket boundary', () => {
    // MFJ: exactly at top of 10% bracket = 24,800
    const result = calculateFederalTax(24_800, 'married_filing_jointly');
    expect(result).toBe(Math.round(24_800 * 0.10));
  });

  it('$1 into next bracket', () => {
    // $24,801 MFJ = 2,480 + 1 * 0.12 = 2,480.12, rounded = 2,480
    const result = calculateFederalTax(24_801, 'married_filing_jointly');
    expect(result).toBe(Math.round(24_800 * 0.10 + 1 * 0.12));
  });
});

// ── getMarginalRate ───────────────────────────────────────────────

describe('getMarginalRate', () => {
  it('zero income → 0%', () => {
    expect(getMarginalRate(0, 'single')).toBe(0);
  });

  it('$30,000 single → 12%', () => {
    expect(getMarginalRate(30_000, 'single')).toBe(0.12);
  });

  it('$150,000 MFJ → 22%', () => {
    expect(getMarginalRate(150_000, 'married_filing_jointly')).toBe(0.22);
  });

  it('$1,000,000 MFJ → 37%', () => {
    expect(getMarginalRate(1_000_000, 'married_filing_jointly')).toBe(0.37);
  });

  it('$10,000 MFJ → 10%', () => {
    expect(getMarginalRate(10_000, 'married_filing_jointly')).toBe(0.10);
  });
});

// ── getContributionLimit ──────────────────────────────────────────

describe('getContributionLimit', () => {
  it('age < 50 → standard limit ($24,500)', () => {
    expect(getContributionLimit(35)).toBe(CONTRIBUTION_LIMIT_UNDER_50);
    expect(getContributionLimit(49)).toBe(CONTRIBUTION_LIMIT_UNDER_50);
  });

  it('age 50–59 → catch-up limit ($32,500)', () => {
    expect(getContributionLimit(50)).toBe(CONTRIBUTION_LIMIT_CATCHUP_50);
    expect(getContributionLimit(55)).toBe(CONTRIBUTION_LIMIT_CATCHUP_50);
    expect(getContributionLimit(59)).toBe(CONTRIBUTION_LIMIT_CATCHUP_50);
  });

  it('age 60–63 → super catch-up limit ($35,750)', () => {
    expect(getContributionLimit(60)).toBe(CONTRIBUTION_LIMIT_SUPER_CATCHUP_60_63);
    expect(getContributionLimit(63)).toBe(CONTRIBUTION_LIMIT_SUPER_CATCHUP_60_63);
  });

  it('age 64+ → back to regular catch-up ($32,500)', () => {
    expect(getContributionLimit(64)).toBe(CONTRIBUTION_LIMIT_CATCHUP_50);
    expect(getContributionLimit(70)).toBe(CONTRIBUTION_LIMIT_CATCHUP_50);
  });
});

// ── calculate401kProjection ───────────────────────────────────────

describe('calculate401kProjection', () => {
  const baseInput: Projection401kInput = {
    currentAge: 35,
    annualSalary: 200_000,
    contributionPercent: 10,
    employerMatchPercent: 50,
    employerMatchLimit: 6,
    current401kBalance: 150_000,
    currentIRABalance: 25_000,
    targetRetirementAge: 65,
    expectedAnnualReturn: 0.07,
  };

  it('returns a ScenarioResult with name and timeline', () => {
    const result = calculate401kProjection(baseInput);
    expect(result.name).toContain('401(k)');
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it('timeline has correct number of points (years + 1)', () => {
    const result = calculate401kProjection(baseInput);
    // 65 - 35 = 30 years → 31 points (0..30)
    expect(result.timeline).toHaveLength(31);
  });

  it('year 0 equals starting balance (401k + IRA)', () => {
    const result = calculate401kProjection(baseInput);
    expect(result.timeline[0].value).toBe(175_000); // 150k + 25k
    expect(result.timeline[0].age).toBe(35);
  });

  it('final value grows substantially over 30 years', () => {
    const result = calculate401kProjection(baseInput);
    // With $20k/yr employee + ~$6k match + 7% return on $175k starting
    // Should be several million
    expect(result.summary.finalValue).toBeGreaterThan(2_000_000);
  });

  it('employer match: 50% of contributions capped at 6% of salary', () => {
    const noMatchInput: Projection401kInput = {
      ...baseInput,
      employerMatchPercent: 0,
      employerMatchLimit: 0,
      expectedAnnualReturn: 0,
      current401kBalance: 0,
      currentIRABalance: 0,
      targetRetirementAge: 36, // 1 year
    };
    const withMatchInput: Projection401kInput = {
      ...noMatchInput,
      employerMatchPercent: 50,
      employerMatchLimit: 6,
    };
    const noMatch = calculate401kProjection(noMatchInput);
    const withMatch = calculate401kProjection(withMatchInput);
    // Employee: 10% * 200k = 20k. Match: 50% * min(20k, 6%*200k=12k) = 6k
    const diff = withMatch.summary.finalValue - noMatch.summary.finalValue;
    expectApprox(diff, 6_000, 0.01);
  });

  it('contribution limit is enforced', () => {
    const highContrib: Projection401kInput = {
      ...baseInput,
      contributionPercent: 50, // 50% of 200k = 100k >> limit of 24,500
      targetRetirementAge: 36,
      expectedAnnualReturn: 0,
      current401kBalance: 0,
      currentIRABalance: 0,
      employerMatchPercent: 0,
    };
    const result = calculate401kProjection(highContrib);
    // Should be capped at $24,500 (under 50 limit)
    expect(result.summary.totalContributed).toBeLessThanOrEqual(CONTRIBUTION_LIMIT_UNDER_50 + 1);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('current age >= retirement age → empty timeline with warning', () => {
    const pastRetirement: Projection401kInput = {
      ...baseInput,
      currentAge: 70,
      targetRetirementAge: 65,
    };
    const result = calculate401kProjection(pastRetirement);
    expect(result.timeline).toHaveLength(0);
    expect(result.warnings.some(w => w.includes('past retirement'))).toBe(true);
  });

  it('salary growth applies year over year', () => {
    const noGrowth: Projection401kInput = {
      ...baseInput,
      salaryGrowthRate: 0,
      expectedAnnualReturn: 0,
      employerMatchPercent: 0,
      current401kBalance: 0,
      currentIRABalance: 0,
      targetRetirementAge: 40, // 5 years
    };
    const withGrowth: Projection401kInput = {
      ...noGrowth,
      salaryGrowthRate: 0.05, // 5% annual raise
    };
    const noGrowthResult = calculate401kProjection(noGrowth);
    const withGrowthResult = calculate401kProjection(withGrowth);
    // More salary growth → higher contributions → higher final
    expect(withGrowthResult.summary.finalValue).toBeGreaterThan(
      noGrowthResult.summary.finalValue,
    );
  });

  it('timeline values grow each year with positive return', () => {
    const result = calculate401kProjection(baseInput);
    for (let i = 1; i < result.timeline.length; i++) {
      expect(result.timeline[i].value).toBeGreaterThan(result.timeline[i - 1].value);
    }
  });

  it('totalContributed + totalGrowth ≈ finalValue - startingBalance', () => {
    const result = calculate401kProjection(baseInput);
    const startingBalance = baseInput.current401kBalance + baseInput.currentIRABalance;
    const computedFinal = startingBalance + result.summary.totalContributed + result.summary.totalGrowth;
    expectApprox(computedFinal, result.summary.finalValue, 0.01);
  });
});

// ── calculateTaxSavings ───────────────────────────────────────────

describe('calculateTaxSavings', () => {
  it('$20,000 traditional contribution at 22% bracket → ~$4,400 savings', () => {
    // $200k income MFJ, standard deduction $32,200
    // Taxable: $167,800 → 22% bracket
    // Reducing by $20k moves some income out of 22%
    const result = calculateTaxSavings(20_000, 200_000, 'married_filing_jointly');
    expect(result.taxSavings).toBeGreaterThan(0);
    expectInRange(result.taxSavings, 3_500, 5_000);
  });

  it('zero contribution → $0 savings', () => {
    const result = calculateTaxSavings(0, 200_000, 'married_filing_jointly');
    expect(result.taxSavings).toBe(0);
  });

  it('contribution exceeding limit produces warning', () => {
    const result = calculateTaxSavings(50_000, 200_000, 'married_filing_jointly');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/exceeds.*limit/i);
  });

  it('returns marginal rate for the filing status', () => {
    const result = calculateTaxSavings(20_000, 200_000, 'married_filing_jointly');
    expect(result.marginalRate).toBe(0.22);
  });

  it('effective savings rate is taxSavings / contribution', () => {
    const result = calculateTaxSavings(10_000, 200_000, 'married_filing_jointly');
    if (result.taxSavings > 0) {
      expect(result.effectiveSavingsRate).toBeCloseTo(result.taxSavings / 10_000, 2);
    }
  });
});

// ── calculateRetirementReadiness ──────────────────────────────────

describe('calculateRetirementReadiness', () => {
  const baseReadiness: RetirementReadinessInput = {
    currentAge: 35,
    annualSalary: 200_000,
    contributionPercent: 10,
    employerMatchPercent: 50,
    employerMatchLimit: 6,
    current401kBalance: 150_000,
    currentIRABalance: 25_000,
    targetRetirementAge: 65,
    expectedAnnualReturn: 0.07,
    filingStatus: 'married_filing_jointly',
    socialSecurityEstimate: 2_500,
    desiredAnnualIncome: 100_000,
  };

  it('calculates required nest egg based on SWR', () => {
    const result = calculateRetirementReadiness(baseReadiness);
    // SS at FRA: $2,500 * 12 = $30,000/yr
    // Portfolio needs: $100k - $30k = $70k/yr
    // Required at 3.5% SWR: $70k / 0.035 = $2,000,000
    expect(result.requiredNestEgg).toBe(2_000_000);
  });

  it('projected nest egg is positive and matches 401k projection', () => {
    const result = calculateRetirementReadiness(baseReadiness);
    expect(result.projectedNestEgg).toBeGreaterThan(0);
    expect(result.scenarioResult.summary.finalValue).toBe(result.projectedNestEgg);
  });

  it('shortfall is 0 when projected > required', () => {
    const result = calculateRetirementReadiness(baseReadiness);
    if (result.projectedNestEgg >= result.requiredNestEgg) {
      expect(result.shortfall).toBe(0);
    }
  });

  it('Social Security by claim age: 62 < 67 < 70', () => {
    const result = calculateRetirementReadiness(baseReadiness);
    expect(result.socialSecurityByClaimAge.age62).toBeLessThan(
      result.socialSecurityByClaimAge.age67,
    );
    expect(result.socialSecurityByClaimAge.age67).toBeLessThan(
      result.socialSecurityByClaimAge.age70,
    );
  });

  it('SS at age 62 reflects 30% reduction', () => {
    const result = calculateRetirementReadiness(baseReadiness);
    // age67 = $2,500/mo, age62 = $2,500 * (1 - 0.30) = $1,750
    expect(result.socialSecurityByClaimAge.age62).toBe(1_750);
    expect(result.socialSecurityByClaimAge.age67).toBe(2_500);
  });

  it('SS at age 70 reflects 24% bonus', () => {
    const result = calculateRetirementReadiness(baseReadiness);
    // age70 = $2,500 * (1 + 0.24) = $3,100
    expect(result.socialSecurityByClaimAge.age70).toBe(3_100);
  });

  it('monthly retirement income components sum correctly', () => {
    const result = calculateRetirementReadiness(baseReadiness);
    expect(result.monthlyRetirementIncome.total).toBe(
      result.monthlyRetirementIncome.portfolio + result.monthlyRetirementIncome.socialSecurity,
    );
  });

  it('warns about high withdrawal rate', () => {
    const highSWR: RetirementReadinessInput = {
      ...baseReadiness,
      withdrawalRate: 0.05,
    };
    const result = calculateRetirementReadiness(highSWR);
    expect(result.warnings.some(w => w.includes('withdrawal rate'))).toBe(true);
  });

  it('warns when goal is unreachable', () => {
    const hardGoal: RetirementReadinessInput = {
      ...baseReadiness,
      desiredAnnualIncome: 500_000, // Very high
      current401kBalance: 0,
      currentIRABalance: 0,
      contributionPercent: 5,
    };
    const result = calculateRetirementReadiness(hardGoal);
    if (result.shortfall > 0) {
      expect(result.warnings.some(w => w.includes('shortfall'))).toBe(true);
    }
  });
});

// ── calculateRothVsTraditional ────────────────────────────────────

describe('calculateRothVsTraditional', () => {
  const baseRothInput: RothVsTraditionalInput = {
    currentAge: 35,
    annualSalary: 200_000,
    filingStatus: 'married_filing_jointly',
    annualContribution: 20_000,
    current401kBalance: 100_000,
    targetRetirementAge: 65,
    expectedAnnualReturn: 0.07,
    retirementMarginalRate: 0.22,
  };

  it('both scenarios have same total contributed', () => {
    const result = calculateRothVsTraditional(baseRothInput);
    expect(result.traditional.summary.totalContributed).toBe(
      result.roth.summary.totalContributed,
    );
  });

  it('both have non-empty timelines', () => {
    const result = calculateRothVsTraditional(baseRothInput);
    expect(result.traditional.timeline.length).toBeGreaterThan(0);
    expect(result.roth.timeline.length).toBeGreaterThan(0);
  });

  it('traditional and roth timelines have same length', () => {
    const result = calculateRothVsTraditional(baseRothInput);
    expect(result.traditional.timeline.length).toBe(result.roth.timeline.length);
  });

  it('higher retirement tax rate should favor Roth', () => {
    const highRetirementTax: RothVsTraditionalInput = {
      ...baseRothInput,
      retirementMarginalRate: 0.37, // top bracket in retirement
    };
    const result = calculateRothVsTraditional(highRetirementTax);
    expect(result.rothWins).toBe(true);
  });

  it('lower retirement tax rate should favor Traditional', () => {
    const lowRetirementTax: RothVsTraditionalInput = {
      ...baseRothInput,
      retirementMarginalRate: 0.10, // low bracket in retirement
    };
    const result = calculateRothVsTraditional(lowRetirementTax);
    expect(result.rothWins).toBe(false);
  });

  it('breakEvenRetirementRate is between 0 and 1', () => {
    const result = calculateRothVsTraditional(baseRothInput);
    expect(result.breakEvenRetirementRate).toBeGreaterThanOrEqual(0);
    expect(result.breakEvenRetirementRate).toBeLessThanOrEqual(1);
  });

  it('recommendation string is non-empty', () => {
    const result = calculateRothVsTraditional(baseRothInput);
    expect(result.recommendation.length).toBeGreaterThan(0);
  });

  it('roth finalValue equals pre-tax balance (no tax on withdrawal)', () => {
    const result = calculateRothVsTraditional(baseRothInput);
    // Roth final = full balance. Traditional final = balance * (1 - retirementRate)
    // So roth final > traditional final when retirement rate > 0
    expect(result.roth.summary.finalValue).toBeGreaterThan(
      result.traditional.summary.finalValue,
    );
  });

  it('zero years to retire returns same starting balance', () => {
    const noTime: RothVsTraditionalInput = {
      ...baseRothInput,
      currentAge: 65,
      targetRetirementAge: 65,
    };
    const result = calculateRothVsTraditional(noTime);
    expect(result.traditional.timeline).toHaveLength(1);
    expect(result.roth.timeline).toHaveLength(1);
  });
});

// ── calculateMaxContributionImpact ────────────────────────────────

describe('calculateMaxContributionImpact', () => {
  it('maxed scenario always has higher final value than current', () => {
    const result = calculateMaxContributionImpact(200_000, 6, 35, {
      employerMatchPercent: 50,
      employerMatchLimit: 6,
      current401kBalance: 100_000,
      currentIRABalance: 25_000,
      targetRetirementAge: 65,
      expectedAnnualReturn: 0.07,
    });
    expect(result.maxed.summary.finalValue).toBeGreaterThan(
      result.current.summary.finalValue,
    );
  });

  it('additionalWealth is positive', () => {
    const result = calculateMaxContributionImpact(200_000, 6, 35, {
      employerMatchPercent: 50,
      employerMatchLimit: 6,
      current401kBalance: 100_000,
      currentIRABalance: 25_000,
      targetRetirementAge: 65,
      expectedAnnualReturn: 0.07,
    });
    expect(result.additionalWealth).toBeGreaterThan(0);
    expect(result.additionalMonthly).toBeGreaterThan(0);
  });

  it('already maxed out → produces warning', () => {
    // 15% of 200k = 30k > 24,500 limit
    const result = calculateMaxContributionImpact(200_000, 15, 35, {
      employerMatchPercent: 50,
      employerMatchLimit: 6,
      current401kBalance: 100_000,
      currentIRABalance: 25_000,
      targetRetirementAge: 65,
      expectedAnnualReturn: 0.07,
    });
    expect(result.warnings.some(w => w.includes('already contributing'))).toBe(true);
  });
});

// ── Legacy adapters: projectRetirement & calculate401kMaxOut ──────

describe('projectRetirement (legacy adapter)', () => {
  it('delegates to calculate401kProjection correctly', () => {
    const input: RetirementInput = {
      ...DEFAULT_RETIREMENT,
      current401kBalance: 100_000,
      contributionPercent: 10,
      employerMatchPercent: 50,
      employerMatchLimit: 6,
      expectedAnnualReturn: 0.07,
      targetRetirementAge: 65,
      currentIRABalance: 25_000,
      socialSecurityEstimate: 2_500,
    };
    const result = projectRetirement(STEVEN_PROFILE, input);
    expect(result.name).toBeTruthy();
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.summary.finalValue).toBeGreaterThan(0);
  });

  it('zero contribution + zero balance → zero final value', () => {
    const input: RetirementInput = {
      ...DEFAULT_RETIREMENT,
      current401kBalance: 0,
      contributionPercent: 0,
      employerMatchPercent: 0,
      employerMatchLimit: 0,
      expectedAnnualReturn: 0.07,
      currentIRABalance: 0,
    };
    const result = projectRetirement(STEVEN_PROFILE, input);
    expect(result.summary.finalValue).toBe(0);
  });

  it('age already past retirement produces minimal result', () => {
    const oldProfile = { ...STEVEN_PROFILE, age: 70 };
    const input: RetirementInput = {
      ...DEFAULT_RETIREMENT,
      targetRetirementAge: 65,
    };
    const result = projectRetirement(oldProfile, input);
    expect(result).toBeDefined();
    expect(Array.isArray(result.timeline)).toBe(true);
    expect(result.timeline).toHaveLength(0);
  });

  it('employer match: 50% on 6% of $200k salary → $6k match', () => {
    const input: RetirementInput = {
      ...DEFAULT_RETIREMENT,
      current401kBalance: 0,
      contributionPercent: 6,
      employerMatchPercent: 50,
      employerMatchLimit: 6,
      expectedAnnualReturn: 0,
      currentIRABalance: 0,
      targetRetirementAge: 36, // 1 year
    };
    const result = projectRetirement(STEVEN_PROFILE, input);
    if (result.timeline.length > 1) {
      // Employee: 6% * 200k = 12k, Match: 50% * 12k = 6k, Total = 18k
      expectInRange(result.timeline[1].value, 17_000, 19_000);
    }
  });
});

describe('calculate401kMaxOut (legacy adapter)', () => {
  it('returns a ScenarioResult with name and timeline', () => {
    const result = calculate401kMaxOut(STEVEN_PROFILE, DEFAULT_RETIREMENT);
    expect(result.name).toBeTruthy();
    expect(Array.isArray(result.timeline)).toBe(true);
  });

  it('maxed-out always produces a positive final value', () => {
    const result = calculate401kMaxOut(STEVEN_PROFILE, DEFAULT_RETIREMENT);
    expect(result.summary.finalValue).toBeGreaterThan(0);
  });
});
