/**
 * Core TypeScript interfaces for ma-finance scenario planner.
 * All financial data models live here — shared across engine and UI.
 */

// ── User & Household ──────────────────────────────────────────────

export type FilingStatus = 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';

export interface UserProfile {
  name: string;
  age: number;
  annualIncome: number;
  filingStatus: FilingStatus;
  state: string; // US state abbreviation
}

export interface HouseholdFinances {
  primary: UserProfile;      // Steven
  spouse: UserProfile;       // Wife
  jointAccounts: {
    checkingSavings: number;
    taxableBrokerage: number;
    emergencyFund: number;
    hsaBalance: number;
  };
  monthlyExpenses: number;   // Combined household spend
}

// ── Compensation ──────────────────────────────────────────────────

export interface CompensationInput {
  baseSalary: number;
  bonusTargetPercent: number;    // e.g. 15 for 15%
  stockGrantsAnnual: number;     // RSU total annual vest value
  vestingSchedule: 'monthly' | 'quarterly' | 'annual';
  employer401kMatchPercent: number;  // e.g. 50 for 50% match
  employer401kMatchLimit: number;    // max % of salary they match on
  esppDiscountPercent: number;       // e.g. 15 for 15% ESPP discount
  esppContributionPercent: number;   // % of salary contributed to ESPP
}

// ── Retirement / 401k ─────────────────────────────────────────────

export interface RetirementInput {
  current401kBalance: number;
  contributionPercent: number;       // % of salary
  employerMatchPercent: number;      // e.g. 50 means 50¢ per dollar
  employerMatchLimit: number;        // match up to this % of salary
  rothVsTraditional: 'roth' | 'traditional' | 'mixed';
  rothPercent?: number;              // if mixed, how much goes Roth
  targetRetirementAge: number;
  expectedAnnualReturn: number;      // e.g. 0.07 for 7%
  currentIRABalance: number;
  socialSecurityEstimate: number;    // monthly estimate at full retirement
}

// ── Housing ───────────────────────────────────────────────────────

export interface HousingInput {
  homePrice: number;
  downPaymentPercent: number;
  mortgageRate: number;             // annual rate, e.g. 0.065 for 6.5%
  mortgageTermYears: 15 | 20 | 30;
  propertyTaxRate: number;          // annual, as decimal
  annualInsurance: number;
  monthlyHOA: number;
  closingCostPercent: number;       // typically 2-5%
  pmiRequired: boolean;             // true if down payment < 20%
}

// ── Renovation ────────────────────────────────────────────────────

export interface RenovationInput {
  projectName: string;
  projectCost: number;
  expectedValueAdd: number;         // how much it increases home value
  financing: 'cash' | 'heloc' | 'personal_loan';
  loanRate?: number;                // if financed
  loanTermYears?: number;
  urgency: number;                  // years until needed (0 = now)
  alternativeSavingsReturn: number; // what the money would earn if invested
}

// ── Results ───────────────────────────────────────────────────────

export interface TimelinePoint {
  year: number;
  age: number;
  value: number;
  label?: string;
}

export interface ScenarioResult {
  name: string;
  description: string;
  timeline: TimelinePoint[];
  summary: {
    totalContributed: number;
    totalGrowth: number;
    finalValue: number;
  };
  comparison?: {
    vsBaseline: number;      // difference from doing nothing / default
    vsAlternative?: number;  // difference from another scenario
  };
  warnings: string[];          // e.g. "Exceeds 401k limit"
}

// ── Scenario Tabs ─────────────────────────────────────────────────

export type ScenarioTab = 'compensation' | 'retirement' | 'housing' | 'renovation';
