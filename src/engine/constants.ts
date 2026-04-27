/**
 * 2026 Financial Constants
 * All dollar amounts and rates verified against Saul's financial-reference.md (April 25, 2026).
 */

// ── 401(k) Employee Contribution Limits ───────────────────────────
/** Employee elective deferral limit for ages < 50 (2026) */
export const CONTRIBUTION_LIMIT_UNDER_50 = 24_500;
/** Total limit for age 50+ (base $24,500 + $8,000 catch-up) */
export const CONTRIBUTION_LIMIT_CATCHUP_50 = 32_500;
/** Total limit for ages 60–63 (base $24,500 + $11,250 super catch-up) */
export const CONTRIBUTION_LIMIT_SUPER_CATCHUP_60_63 = 35_750;
/** Combined employee + employer total limit (excludes catch-up) */
export const CONTRIBUTION_LIMIT_COMBINED = 72_000;
/** Employer match does NOT count toward employee elective deferral limit */
export const EMPLOYER_MATCH_NOT_COUNTED = true;

// ── Microsoft 401(k) Match (Verified 2026) ────────────────────────
/** Microsoft matches 50¢ per dollar on employee contributions */
export const MSFT_MATCH_PERCENT = 0.50;
/** Maximum Microsoft match = 50% × $24,500 */
export const MSFT_MAX_MATCH = 12_250;
/** Vesting is immediate at Microsoft */
export const MSFT_VESTING_IMMEDIATE = true;

// ── IRA Limits ────────────────────────────────────────────────────
/** Traditional & Roth IRA limit for ages < 50 (2026) */
export const IRA_CONTRIBUTION_LIMIT = 7_500;
/** IRA limit for age 50+ (includes $1,100 catch-up) */
export const IRA_CATCHUP_LIMIT = 8_600;

// ── Roth IRA Income Phase-Out (MFJ, 2026) ─────────────────────────
export const ROTH_PHASEOUT_START_MFJ = 242_000;
export const ROTH_PHASEOUT_END_MFJ = 252_000;

// ── Federal Tax Brackets 2026 — Married Filing Jointly ────────────
// Source: Saul's financial-reference.md §2
export const FEDERAL_TAX_BRACKETS_MFJ: { min: number; max: number; rate: number }[] = [
  { min: 0,         max: 24_800,    rate: 0.10 },
  { min: 24_800,    max: 100_800,   rate: 0.12 },
  { min: 100_800,   max: 211_400,   rate: 0.22 },
  { min: 211_400,   max: 403_550,   rate: 0.24 },
  { min: 403_550,   max: 512_450,   rate: 0.32 },
  { min: 512_450,   max: 768_700,   rate: 0.35 },
  { min: 768_700,   max: Infinity,  rate: 0.37 },
];

// ── Federal Tax Brackets 2026 — Single ───────────────────────────
// Single brackets are approximately half of MFJ thresholds (2026 structure)
export const FEDERAL_TAX_BRACKETS_SINGLE: { min: number; max: number; rate: number }[] = [
  { min: 0,         max: 12_400,    rate: 0.10 },
  { min: 12_400,    max: 50_400,    rate: 0.12 },
  { min: 50_400,    max: 105_700,   rate: 0.22 },
  { min: 105_700,   max: 201_775,   rate: 0.24 },
  { min: 201_775,   max: 256_225,   rate: 0.32 },
  { min: 256_225,   max: 384_350,   rate: 0.35 },
  { min: 384_350,   max: Infinity,  rate: 0.37 },
];

// ── Federal Tax Brackets 2026 — Head of Household ─────────────────
export const FEDERAL_TAX_BRACKETS_HOH: { min: number; max: number; rate: number }[] = [
  { min: 0,         max: 18_600,    rate: 0.10 },
  { min: 18_600,    max: 75_600,    rate: 0.12 },
  { min: 75_600,    max: 105_700,   rate: 0.22 },
  { min: 105_700,   max: 201_775,   rate: 0.24 },
  { min: 201_775,   max: 256_225,   rate: 0.32 },
  { min: 256_225,   max: 384_350,   rate: 0.35 },
  { min: 384_350,   max: Infinity,  rate: 0.37 },
];

// ── Long-Term Capital Gains Brackets (MFJ, 2026) ──────────────────
export const LTCG_BRACKETS_MFJ: { min: number; max: number; rate: number }[] = [
  { min: 0,         max: 98_900,    rate: 0.00 },
  { min: 98_900,    max: 583_750,   rate: 0.15 },
  { min: 583_750,   max: Infinity,  rate: 0.20 },
];
/** Net Investment Income Tax threshold (MFJ) — 3.8% additional tax */
export const NIIT_THRESHOLD_MFJ = 250_000;
export const NIIT_RATE = 0.038;

// ── Standard Deduction 2026 ───────────────────────────────────────
/** Source: Saul's financial-reference.md §2 — $32,200 for MFJ */
export const STANDARD_DEDUCTION_MFJ = 32_200;
export const STANDARD_DEDUCTION_SINGLE = 15_000;
export const STANDARD_DEDUCTION_HOH = 22_500;

// ── Social Security & Medicare (2026) ─────────────────────────────
/** SS wage base 2026 — Source: Saul's financial-reference.md §2 */
export const SS_WAGE_BASE = 184_500;
export const SS_TAX_RATE = 0.062;
export const MEDICARE_TAX_RATE = 0.0145;
export const MEDICARE_SURTAX_THRESHOLD_MFJ = 250_000;
export const MEDICARE_SURTAX_RATE = 0.009;

// ── RMD (Required Minimum Distribution) ──────────────────────────
/** Starting age for RMDs under SECURE 2.0 Act */
export const RMD_START_AGE = 73;
/** IRS Uniform Lifetime Table divisor for key ages */
export const RMD_DIVISORS: Record<number, number> = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2,
  87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1,
};

// ── Housing Defaults (Seattle Metro, 2026) ────────────────────────
/** Seattle/King County effective property tax rate (~0.95%) */
export const DEFAULT_PROPERTY_TAX_RATE = 0.0095;
/** Seattle-area annual homeowner's insurance (Saul's reference: $1,500–$1,700/yr) */
export const DEFAULT_HOME_INSURANCE = 1_600;
/** PMI midpoint rate (0.7% — good credit, 10–15% down; range 0.5%–1.0%) */
export const PMI_RATE = 0.007;
/** PMI removed once LTV drops to 80% (can request removal); auto-cancels at 78% */
export const PMI_REMOVAL_LTV = 0.80;
/** Standard closing costs for Washington state buyers (Saul: 2–3% typical) */
export const DEFAULT_CLOSING_COST_PERCENT = 0.03;
/** Default mortgage rate: 30-year fixed midpoint (Saul: 6.15–6.28% range) */
export const DEFAULT_MORTGAGE_RATE_30 = 0.0625;
/** Default mortgage rate: 15-year fixed midpoint (Saul: 5.55–5.64% range) */
export const DEFAULT_MORTGAGE_RATE_15 = 0.0560;
/** Annual maintenance rule of thumb: 1% of home value */
export const DEFAULT_MAINTENANCE_RATE = 0.01;

// ── Home Appreciation Rates (Seattle Metro) ───────────────────────
export const HOME_APPRECIATION_CONSERVATIVE = 0.025;  // 2.5%/yr — slow market
export const HOME_APPRECIATION_MODERATE = 0.035;      // 3.5%/yr — recommended default
export const HOME_APPRECIATION_OPTIMISTIC = 0.05;     // 5.0%/yr — recovery to historical avg

// ── General Market Assumptions ────────────────────────────────────
export const DEFAULT_INFLATION_RATE = 0.025;          // 2.5% (balanced long-term assumption)
export const CURRENT_INFLATION_RATE = 0.027;          // 2.7% (April 2026 actuals)
export const DEFAULT_MARKET_RETURN = 0.07;            // 7% nominal (moderate 60/40 portfolio)
export const MARKET_RETURN_AGGRESSIVE = 0.08;         // 8% (80% stocks / 20% bonds)
export const MARKET_RETURN_CONSERVATIVE = 0.04;       // 4% (80% bonds / 20% stocks)
/** Saul recommends 3.5% as middle ground between classic 4% and modern caution */
export const DEFAULT_SAFE_WITHDRAWAL_RATE = 0.035;
export const SWR_CONSERVATIVE = 0.030;
export const SWR_OPTIMISTIC = 0.040;

// ── Social Security Claiming Age Adjustments ──────────────────────
export const SS_FULL_RETIREMENT_AGE = 67;       // Born 1960 or later
export const SS_EARLY_CLAIM_AGE = 62;
export const SS_DELAYED_CLAIM_AGE = 70;
export const SS_EARLY_REDUCTION_RATE = 0.30;    // 30% reduction at age 62
export const SS_DELAYED_BONUS_RATE = 0.24;      // 24% bonus at age 70 vs 67

// ── Renovation ROI Data (National Averages, 2026) ─────────────────
// Source: Saul's financial-reference.md §5
export interface RenovationROIData {
  name: string;
  minCost: number;
  maxCost: number;
  minROI: number;       // as decimal, e.g. 0.73
  maxROI: number;
  energySavingsMin: number;  // annual, dollars
  energySavingsMax: number;
}

export const RENOVATION_ROI_DATA: Record<string, RenovationROIData> = {
  minor_kitchen: {
    name: 'Minor Kitchen Remodel',
    minCost: 14_000, maxCost: 41_000,
    minROI: 0.81, maxROI: 1.13,
    energySavingsMin: 0, energySavingsMax: 0,
  },
  major_kitchen: {
    name: 'Major Kitchen Remodel',
    minCost: 65_000, maxCost: 120_000,
    minROI: 0.60, maxROI: 0.66,
    energySavingsMin: 0, energySavingsMax: 500,
  },
  bathroom_midrange: {
    name: 'Midrange Bathroom Remodel',
    minCost: 6_000, maxCost: 25_000,
    minROI: 0.67, maxROI: 0.74,
    energySavingsMin: 0, energySavingsMax: 0,
  },
  window_vinyl: {
    name: 'Vinyl Window Replacement',
    minCost: 17_000, maxCost: 20_000,
    minROI: 0.73, maxROI: 0.89,
    energySavingsMin: 200, energySavingsMax: 400,
  },
  hvac: {
    name: 'HVAC System Replacement',
    minCost: 8_500, maxCost: 12_000,
    minROI: 0.60, maxROI: 0.63,
    energySavingsMin: 500, energySavingsMax: 1_200,
  },
  garage_door: {
    name: 'Garage Door Replacement',
    minCost: 3_000, maxCost: 8_000,
    minROI: 1.94, maxROI: 1.94,
    energySavingsMin: 0, energySavingsMax: 0,
  },
};

// ── Window Replacement Data (Seattle / Mild Climate) ──────────────
export const WINDOW_COST_PER_WINDOW_MIN = 300;
export const WINDOW_COST_PER_WINDOW_MAX = 1_500;
export const WINDOW_ENERGY_SAVINGS_SINGLE_TO_DOUBLE_MIN = 200;   // $/yr
export const WINDOW_ENERGY_SAVINGS_SINGLE_TO_DOUBLE_MAX = 400;   // $/yr
export const WINDOW_ENERGY_SAVINGS_DOUBLE_TO_TRIPLE_MIN = 50;    // $/yr
export const WINDOW_ENERGY_SAVINGS_DOUBLE_TO_TRIPLE_MAX = 100;   // $/yr

// ── HELOC Rate Assumptions (2026) ────────────────────────────────
/** HELOC: Prime + 0–2%, typical range 7–9% */
export const HELOC_RATE_LOW = 0.07;
export const HELOC_RATE_HIGH = 0.09;
export const HELOC_RATE_DEFAULT = 0.08;

// ── FIRE Calculation Defaults ─────────────────────────────────────
/** 3.5% SWR — appropriate for 40-year early retirement horizon (not classic 4%) */
export const FIRE_DEFAULT_SWR = 0.035;
/** 7% nominal growth rate for Coast FIRE projection */
export const FIRE_GROWTH_RATE_NOMINAL = 0.07;
/** 6% conservative nominal growth rate for downside scenarios */
export const FIRE_GROWTH_RATE_CONSERVATIVE = 0.06;

// ── Eastside Seattle Market Defaults (Reuben's 2026 Assessment) ───
export const EASTSIDE_CITIES = ['kirkland', 'redmond', 'bellevue'] as const;
export type EastsideCity = typeof EASTSIDE_CITIES[number];

export const EASTSIDE_MARKET_DATA: Record<EastsideCity, {
  medianSFH: number;
  medianCondo: number;
  medianTownhome: number;
  propertyTaxRate: number;
  appreciationRate: number;
  annualInsurance: number;
  hoaSFH: number;
  hoaCondo: number;
  hoaTownhome: number;
}> = {
  kirkland: {
    medianSFH: 1_400_000,
    medianCondo: 640_000,
    medianTownhome: 750_000,
    propertyTaxRate: 0.0085,
    appreciationRate: 0.045,
    annualInsurance: 2_400,
    hoaSFH: 100,
    hoaCondo: 400,
    hoaTownhome: 300,
  },
  redmond: {
    medianSFH: 1_375_000,
    medianCondo: 600_000,
    medianTownhome: 900_000,
    propertyTaxRate: 0.0085,
    appreciationRate: 0.045,
    annualInsurance: 2_400,
    hoaSFH: 100,
    hoaCondo: 400,
    hoaTownhome: 300,
  },
  bellevue: {
    medianSFH: 1_590_000,
    medianCondo: 875_000,
    medianTownhome: 1_125_000,
    propertyTaxRate: 0.0085,
    appreciationRate: 0.045,
    annualInsurance: 2_800,
    hoaSFH: 100,
    hoaCondo: 500,
    hoaTownhome: 350,
  },
};

/** 30-year conforming loan rate (April 2026) */
export const MORTGAGE_RATE_CONFORMING = 0.0610;
/** 30-year jumbo loan rate (April 2026) */
export const MORTGAGE_RATE_JUMBO = 0.0650;
/** King County conforming loan limit (2026) */
export const CONFORMING_LOAN_LIMIT_KING_COUNTY = 1_063_750;
