/**
 * Shared test utilities for ma-finance engine tests.
 * Provides fixtures, helpers, and assertion utilities.
 */

import type {
  UserProfile,
  HouseholdFinances,
  CompensationInput,
  RetirementInput,
  HousingInput,
  RenovationInput,
} from '../types';

// ── Assertion Helpers ─────────────────────────────────────────────

/**
 * Assert that `actual` is within `toleranceFraction` of `expected`.
 * Default tolerance is ±1% (0.01).
 *
 * Example: expectApprox(196715, 196715, 0.001) passes if within 0.1%
 */
export function expectApprox(
  actual: number,
  expected: number,
  toleranceFraction = 0.01,
): void {
  const tolerance = Math.abs(expected) * toleranceFraction;
  const low = expected - tolerance;
  const high = expected + tolerance;
  expect(actual).toBeGreaterThanOrEqual(low);
  expect(actual).toBeLessThanOrEqual(high);
}

/**
 * Assert a value is within an absolute dollar range (inclusive).
 */
export function expectInRange(actual: number, low: number, high: number): void {
  expect(actual).toBeGreaterThanOrEqual(low);
  expect(actual).toBeLessThanOrEqual(high);
}

// ── Standard Fixture Profiles ─────────────────────────────────────

export const STEVEN_PROFILE: UserProfile = {
  name: 'Steven',
  age: 35,
  annualIncome: 200_000,
  filingStatus: 'married_filing_jointly',
  state: 'WA',
};

export const SPOUSE_PROFILE: UserProfile = {
  name: 'Sonya',
  age: 33,
  annualIncome: 120_000,
  filingStatus: 'married_filing_jointly',
  state: 'WA',
};

export const DEFAULT_HOUSEHOLD: HouseholdFinances = {
  primary: STEVEN_PROFILE,
  spouse: SPOUSE_PROFILE,
  jointAccounts: {
    checkingSavings: 50_000,
    taxableBrokerage: 100_000,
    emergencyFund: 30_000,
    hsaBalance: 10_000,
  },
  monthlyExpenses: 8_000,
};

export const DEFAULT_COMPENSATION: CompensationInput = {
  baseSalary: 200_000,
  bonusTargetPercent: 15,
  stockGrantsAnnual: 50_000,
  vestingSchedule: 'quarterly',
  employer401kMatchPercent: 50,
  employer401kMatchLimit: 6,
  esppDiscountPercent: 15,
  esppContributionPercent: 10,
};

export const DEFAULT_RETIREMENT: RetirementInput = {
  current401kBalance: 150_000,
  contributionPercent: 10,
  employerMatchPercent: 50,
  employerMatchLimit: 6,
  rothVsTraditional: 'traditional',
  targetRetirementAge: 65,
  expectedAnnualReturn: 0.07,
  currentIRABalance: 25_000,
  socialSecurityEstimate: 2_500,
};

export const DEFAULT_HOUSING: HousingInput = {
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

export const DEFAULT_RENOVATION: RenovationInput = {
  projectName: 'Window Replacement',
  projectCost: 8_000,
  expectedValueAdd: 6_400, // 80% ROI
  financing: 'cash',
  urgency: 0,
  alternativeSavingsReturn: 0.07,
};
