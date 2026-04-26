/**
 * 2026 Financial Constants
 * All dollar amounts and rates for the current tax year.
 */

// ── 401(k) Limits ─────────────────────────────────────────────────
// TODO: Saul to verify these values
export const CONTRIBUTION_LIMIT_UNDER_50 = 23_500;
export const CONTRIBUTION_LIMIT_CATCHUP = 31_000; // age 50+ (includes base)
export const EMPLOYER_MATCH_NOT_COUNTED = true;     // employer match doesn't count toward employee limit

// ── IRA Limits ────────────────────────────────────────────────────
// TODO: Saul to verify these values
export const IRA_CONTRIBUTION_LIMIT = 7_000;
export const IRA_CATCHUP_LIMIT = 8_000; // age 50+

// ── Tax Brackets 2026 — Married Filing Jointly ────────────────────
// TODO: Saul to verify these values
export const FEDERAL_TAX_BRACKETS_MFJ: { min: number; max: number; rate: number }[] = [
  { min: 0,       max: 23_850,   rate: 0.10 },
  { min: 23_850,  max: 96_950,   rate: 0.12 },
  { min: 96_950,  max: 206_700,  rate: 0.22 },
  { min: 206_700, max: 394_600,  rate: 0.24 },
  { min: 394_600, max: 501_050,  rate: 0.32 },
  { min: 501_050, max: 751_600,  rate: 0.35 },
  { min: 751_600, max: Infinity, rate: 0.37 },
];

// ── Standard Deduction 2026 ───────────────────────────────────────
// TODO: Saul to verify these values
export const STANDARD_DEDUCTION_MFJ = 30_000;
export const STANDARD_DEDUCTION_SINGLE = 15_000;

// ── Social Security ───────────────────────────────────────────────
// TODO: Saul to verify these values
export const SS_WAGE_BASE = 176_100;
export const SS_TAX_RATE = 0.062;
export const MEDICARE_TAX_RATE = 0.0145;
export const MEDICARE_SURTAX_THRESHOLD_MFJ = 250_000;
export const MEDICARE_SURTAX_RATE = 0.009;

// ── Housing Defaults ──────────────────────────────────────────────
export const DEFAULT_PROPERTY_TAX_RATE = 0.012;  // 1.2% national average
export const DEFAULT_HOME_INSURANCE = 2_400;       // annual
export const PMI_RATE = 0.005;                     // typical PMI rate
export const DEFAULT_CLOSING_COST_PERCENT = 0.03;

// ── General Assumptions ───────────────────────────────────────────
export const DEFAULT_INFLATION_RATE = 0.025;       // 2.5%
export const DEFAULT_MARKET_RETURN = 0.07;         // 7% nominal
export const DEFAULT_SAFE_WITHDRAWAL_RATE = 0.04;  // 4% rule
