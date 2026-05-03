/**
 * Expense Budget Engine.
 * 15 expense categories with Seattle-calibrated defaults for a tech couple.
 * Core equation: Income − Expenses = Savings → feeds FIRE calculations.
 *
 * Pure TypeScript — no React dependencies.
 */

import type { ExpenseCategoryDef, ExpenseGroup, ExpenseBudget, SavingsAnalysis, ExpenseFIREImpact, SavingsBucketDef, SavingsBucketGroup, SavingsAllocation } from './types';
import { calcFIRENumber, calcCoastFIRENumber, calcYearsToFIRE } from './fire';
import { FIRE_DEFAULT_SWR, FIRE_GROWTH_RATE_NOMINAL } from './constants';

// ── Category Definitions ──────────────────────────────────────────

/** All 15 expense categories with Seattle-calibrated defaults (2026 dollars). */
export const EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  // ── Essential / Fixed ──
  {
    id: 'housing',
    label: 'Housing',
    icon: '🏠',
    group: 'essential',
    defaultMonthly: 3_200,
    description: 'Rent or mortgage, property tax, insurance, HOA',
    min: 0, max: 8_000, step: 100,
  },
  {
    id: 'transportation',
    label: 'Transportation',
    icon: '🚗',
    group: 'essential',
    defaultMonthly: 800,
    description: 'Car payment, insurance, gas, maintenance, parking',
    min: 0, max: 3_000, step: 50,
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: '⚡',
    group: 'essential',
    defaultMonthly: 350,
    description: 'Electric, water, internet, phone plans',
    min: 0, max: 1_500, step: 25,
  },
  {
    id: 'groceries',
    label: 'Groceries',
    icon: '🛒',
    group: 'essential',
    defaultMonthly: 800,
    description: 'Food at home — Seattle prices, two adults',
    min: 0, max: 2_500, step: 50,
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    group: 'essential',
    defaultMonthly: 200,
    description: 'Premiums, copays, dental, vision (beyond employer)',
    min: 0, max: 2_000, step: 25,
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: '🛡️',
    group: 'essential',
    defaultMonthly: 150,
    description: 'Life, disability, umbrella policies',
    min: 0, max: 1_000, step: 25,
  },

  // ── Lifestyle / Variable ──
  {
    id: 'dining',
    label: 'Dining Out',
    icon: '🍽️',
    group: 'lifestyle',
    defaultMonthly: 600,
    description: 'Restaurants, delivery, coffee shops',
    min: 0, max: 3_000, step: 50,
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: '📱',
    group: 'lifestyle',
    defaultMonthly: 200,
    description: 'Streaming, software, gym, memberships',
    min: 0, max: 1_000, step: 25,
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
    group: 'lifestyle',
    defaultMonthly: 400,
    description: 'Clothing, electronics, household goods',
    min: 0, max: 2_000, step: 50,
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: '🎭',
    group: 'lifestyle',
    defaultMonthly: 500,
    description: 'Travel, hobbies, events, concerts',
    min: 0, max: 3_000, step: 50,
  },
  {
    id: 'personalCare',
    label: 'Personal Care',
    icon: '💆',
    group: 'lifestyle',
    defaultMonthly: 150,
    description: 'Haircuts, grooming, wellness',
    min: 0, max: 800, step: 25,
  },

  // ── Obligations ──
  {
    id: 'debt',
    label: 'Debt Payments',
    icon: '💳',
    group: 'obligations',
    defaultMonthly: 0,
    description: 'Student loans, credit cards, personal loans',
    min: 0, max: 5_000, step: 50,
  },
  {
    id: 'giving',
    label: 'Giving',
    icon: '🎁',
    group: 'obligations',
    defaultMonthly: 200,
    description: 'Charitable giving, tithes, family gifts',
    min: 0, max: 2_000, step: 25,
  },

  // ── Future Planning ──
  {
    id: 'childcare',
    label: 'Childcare / Education',
    icon: '👶',
    group: 'future',
    defaultMonthly: 0,
    description: 'Daycare, school, 529 contributions — toggle for future planning',
    min: 0, max: 5_000, step: 100,
  },
  {
    id: 'misc',
    label: 'Miscellaneous',
    icon: '📦',
    group: 'future',
    defaultMonthly: 300,
    description: 'Buffer for unexpected or uncategorized spending',
    min: 0, max: 2_000, step: 25,
  },
];

/** Group labels for display */
export const GROUP_LABELS: Record<ExpenseGroup, string> = {
  essential: 'Essential / Fixed',
  lifestyle: 'Lifestyle / Variable',
  obligations: 'Obligations',
  future: 'Future Planning',
};

/** Group display order */
export const GROUP_ORDER: ExpenseGroup[] = ['essential', 'lifestyle', 'obligations', 'future'];

// ── Default Budget ────────────────────────────────────────────────

/** Get default monthly amounts for all categories */
export function getDefaultExpenses(): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const cat of EXPENSE_CATEGORIES) {
    defaults[cat.id] = cat.defaultMonthly;
  }
  return defaults;
}

// ── Budget Calculations ───────────────────────────────────────────

/** Calculate budget totals from category amounts */
export function calculateBudget(amounts: Record<string, number>): ExpenseBudget {
  let totalMonthly = 0;
  for (const cat of EXPENSE_CATEGORIES) {
    totalMonthly += amounts[cat.id] ?? 0;
  }
  return {
    categories: amounts,
    totalMonthly,
    totalAnnual: totalMonthly * 12,
  };
}

/** Get spending breakdown by group */
export function getGroupTotals(amounts: Record<string, number>): Record<ExpenseGroup, number> {
  const totals: Record<ExpenseGroup, number> = {
    essential: 0,
    lifestyle: 0,
    obligations: 0,
    future: 0,
  };
  for (const cat of EXPENSE_CATEGORIES) {
    totals[cat.group] += amounts[cat.id] ?? 0;
  }
  return totals;
}

// ── Savings Analysis ──────────────────────────────────────────────

/**
 * Estimate effective tax rate for a Seattle tech couple (MFJ, WA = no state tax).
 * Simplified progressive federal + FICA calculation.
 */
export function estimateEffectiveTaxRate(grossIncome: number): number {
  // Simplified: federal progressive + FICA (7.65% up to SS wage base)
  // For $305K MFJ household: ~22-24% effective federal + ~7% FICA = ~29-31%
  if (grossIncome <= 0) return 0;

  const ssWageBase = 176_100; // 2026 estimate
  const ficaRate = 0.0765;
  const medicareAdditional = 0.009; // additional Medicare over $200K

  // FICA for two earners (simplified: split income evenly)
  const perPerson = grossIncome / 2;
  const ficaPerPerson =
    Math.min(perPerson, ssWageBase) * ficaRate +
    Math.max(0, perPerson - 200_000) * medicareAdditional;
  const totalFica = ficaPerPerson * 2;

  // Federal income tax (MFJ brackets, 2026 — simplified)
  const standardDeduction = 32_300; // 2026 MFJ estimate
  const taxable = Math.max(0, grossIncome - standardDeduction);
  const brackets = [
    { limit: 24_800, rate: 0.10 },
    { limit: 76_000, rate: 0.12 },
    { limit: 110_600, rate: 0.22 },
    { limit: 192_150, rate: 0.24 },
    { limit: 108_900, rate: 0.32 },
    { limit: 256_250, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ];

  let federalTax = 0;
  let remaining = taxable;
  for (const { limit, rate } of brackets) {
    const taxableInBracket = Math.min(remaining, limit);
    federalTax += taxableInBracket * rate;
    remaining -= taxableInBracket;
    if (remaining <= 0) break;
  }

  return (totalFica + federalTax) / grossIncome;
}

/**
 * Full savings analysis: income → taxes → after-tax → expenses → savings.
 * This is the core "income - expenses = savings" equation.
 */
export function analyzeSavings(
  grossHouseholdIncome: number,
  monthlyExpenses: Record<string, number>,
): SavingsAnalysis {
  const budget = calculateBudget(monthlyExpenses);
  const effectiveTaxRate = estimateEffectiveTaxRate(grossHouseholdIncome);
  const estimatedTaxes = grossHouseholdIncome * effectiveTaxRate;
  const afterTaxIncome = grossHouseholdIncome - estimatedTaxes;
  const annualSavings = afterTaxIncome - budget.totalAnnual;

  return {
    grossHouseholdIncome,
    estimatedTaxes,
    afterTaxIncome,
    totalAnnualExpenses: budget.totalAnnual,
    annualSavings,
    monthlySavings: annualSavings / 12,
    savingsRate: grossHouseholdIncome > 0 ? annualSavings / grossHouseholdIncome : 0,
    afterTaxSavingsRate: afterTaxIncome > 0 ? annualSavings / afterTaxIncome : 0,
  };
}

// ── FIRE Impact ───────────────────────────────────────────────────

/**
 * Calculate how the current expense level impacts FIRE projections.
 * Uses annual expenses for FIRE number and derived savings for timeline.
 */
export function calculateFIREImpact(
  annualExpenses: number,
  annualSavings: number,
  currentPortfolio: number,
  currentAge: number,
  targetRetirementAge: number,
  swr: number = FIRE_DEFAULT_SWR,
  growthRate: number = FIRE_GROWTH_RATE_NOMINAL,
): ExpenseFIREImpact {
  const fireNumber = calcFIRENumber(annualExpenses, swr);
  const yearsToRetirement = Math.max(0, targetRetirementAge - currentAge);
  const coastFIRENumber = calcCoastFIRENumber(fireNumber, growthRate, yearsToRetirement);
  const yearsToFIRE = calcYearsToFIRE(currentPortfolio, annualSavings, growthRate, fireNumber);

  return {
    fireNumber,
    coastFIRENumber,
    yearsToFIRE,
    fireAge: currentAge + yearsToFIRE,
    savingsRate: annualSavings > 0 ? annualSavings / (annualExpenses + annualSavings) : 0,
  };
}

// ── Scenario Presets ──────────────────────────────────────────────

export interface ExpensePreset {
  id: string;
  label: string;
  description: string;
  multiplier: number; // multiplied against defaults
}

export const EXPENSE_PRESETS: ExpensePreset[] = [
  { id: 'lean', label: 'Lean', description: 'Minimal — cut discretionary to the bone', multiplier: 0.65 },
  { id: 'moderate', label: 'Moderate', description: 'Balanced — some trade-offs for savings', multiplier: 0.85 },
  { id: 'current', label: 'Current', description: 'Seattle defaults — as calibrated', multiplier: 1.0 },
  { id: 'comfortable', label: 'Comfortable', description: 'Upgraded lifestyle — more travel & dining', multiplier: 1.25 },
  { id: 'premium', label: 'Premium', description: 'No compromises — premium everything', multiplier: 1.5 },
];

/** Apply a preset multiplier to default expenses */
export function applyPreset(presetId: string): Record<string, number> {
  const preset = EXPENSE_PRESETS.find((p) => p.id === presetId);
  const multiplier = preset?.multiplier ?? 1.0;
  const result: Record<string, number> = {};
  for (const cat of EXPENSE_CATEGORIES) {
    result[cat.id] = Math.round(cat.defaultMonthly * multiplier / cat.step) * cat.step;
  }
  return result;
}

// ── Savings Allocation ────────────────────────────────────────────

export const SAVINGS_BUCKET_GROUPS: Record<SavingsBucketGroup, string> = {
  tax_advantaged: 'Tax-Advantaged',
  goals: 'Goal-Based',
  cash: 'Cash & Flexible',
};

export const SAVINGS_BUCKETS: SavingsBucketDef[] = [
  // Tax-advantaged
  { id: 'traditional_401k', label: 'Traditional 401k', icon: '🏛️', group: 'tax_advantaged', annualLimit: 24_500, description: 'Pre-tax contributions, reduces current taxable income', defaultAnnual: 24_500 },
  { id: 'roth_401k', label: 'Roth 401k', icon: '🔮', group: 'tax_advantaged', annualLimit: 24_500, description: 'After-tax contributions, tax-free growth & withdrawal. Shares limit with Traditional 401k.', defaultAnnual: 0 },
  { id: 'espp', label: 'ESPP', icon: '📈', group: 'tax_advantaged', annualLimit: 25_000, description: 'Microsoft ESPP: 15% discount on stock, up to $25K/yr IRS limit', defaultAnnual: 25_000 },
  { id: 'hsa', label: 'HSA', icon: '🏥', group: 'tax_advantaged', annualLimit: 8_550, description: 'Triple tax advantage: deductible, grows tax-free, tax-free medical withdrawals', defaultAnnual: 8_550 },
  { id: 'roth_ira', label: 'Roth IRA', icon: '⭐', group: 'tax_advantaged', annualLimit: 7_500, description: 'Post-tax, tax-free growth. Income phaseout at $242K–$252K MAGI (MFJ). Consider backdoor Roth.', defaultAnnual: 7_500 },

  // Goals
  { id: '529_education', label: '529 Education', icon: '🎓', group: 'goals', annualLimit: 18_000, description: 'Tax-free growth for education. $18K/yr per beneficiary avoids gift tax.', defaultAnnual: 0 },
  { id: 'house_downpayment', label: 'House Down Payment', icon: '🏠', group: 'goals', annualLimit: null, description: 'Saving toward Eastside Seattle home purchase', defaultAnnual: 24_000 },
  { id: 'emergency_fund', label: 'Emergency Fund', icon: '🛡️', group: 'goals', annualLimit: null, description: 'Target 6 months of expenses', defaultAnnual: 6_000 },

  // Cash & Flexible
  { id: 'hysa', label: 'HYSA', icon: '💰', group: 'cash', annualLimit: null, description: 'High-yield savings for short-term goals and liquidity', defaultAnnual: 12_000 },
  { id: 'brokerage', label: 'Brokerage', icon: '📊', group: 'cash', annualLimit: null, description: 'Taxable investment account for additional wealth building', defaultAnnual: 0 },
];

export const SAVINGS_GROUP_ORDER: SavingsBucketGroup[] = ['tax_advantaged', 'goals', 'cash'];

export function getDefaultAllocations(): Record<string, number> {
  const allocs: Record<string, number> = {};
  for (const b of SAVINGS_BUCKETS) allocs[b.id] = b.defaultAnnual;
  return allocs;
}

export function calculateAllocation(
  availableSavings: number,
  bucketAmounts: Record<string, number>,
): SavingsAllocation {
  let totalAllocated = 0;
  for (const b of SAVINGS_BUCKETS) {
    totalAllocated += bucketAmounts[b.id] ?? 0;
  }
  return {
    buckets: { ...bucketAmounts },
    totalAllocated,
    unallocated: availableSavings - totalAllocated,
    availableSavings,
  };
}
