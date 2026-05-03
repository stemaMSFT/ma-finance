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
  spouse: UserProfile;       // Sonya
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

export type ScenarioTab = 'compensation' | 'expenses' | 'cashflow' | 'retirement' | 'projection' | 'housing' | 'renovation';

// ── Expense Budget ────────────────────────────────────────────────

export type ExpenseGroup = 'essential' | 'lifestyle' | 'obligations' | 'future';

export interface ExpenseCategoryDef {
  id: string;
  label: string;
  icon: string;
  group: ExpenseGroup;
  defaultMonthly: number;
  description: string;
  min: number;
  max: number;
  step: number;
}

export interface ExpenseBudget {
  categories: Record<string, number>;   // category id → monthly amount
  totalMonthly: number;
  totalAnnual: number;
}

export interface SavingsAnalysis {
  grossHouseholdIncome: number;
  estimatedTaxes: number;
  afterTaxIncome: number;
  totalAnnualExpenses: number;
  annualSavings: number;
  monthlySavings: number;
  savingsRate: number;                  // as decimal (of gross)
  afterTaxSavingsRate: number;          // as decimal (of after-tax)
}

export interface ExpenseFIREImpact {
  fireNumber: number;
  coastFIRENumber: number;
  yearsToFIRE: number;
  fireAge: number;
  savingsRate: number;
}

// ── Savings Allocation ────────────────────────────────────────────

export type SavingsBucketGroup = 'tax_advantaged' | 'goals' | 'cash';

export interface SavingsBucketDef {
  id: string;
  label: string;
  icon: string;
  group: SavingsBucketGroup;
  annualLimit: number | null;  // null = no hard limit
  description: string;
  defaultAnnual: number;
}

export interface SavingsAllocation {
  buckets: Record<string, number>;  // bucket id → annual amount
  totalAllocated: number;
  unallocated: number;
  availableSavings: number;  // after-tax income minus expenses
}

// ── Compensation History & Trajectory ─────────────────────────────

export interface CompActivity {
  type: 'new_hire' | 'merit' | 'promotion' | 'bonus' | 'special_cash' | 'stock_award' | 'sign_on' | 'on_hire_stock';
  amount: number;
  date: string;       // ISO date string
  description?: string;
}

export interface CompHistoryEntry {
  fiscalYear: number;  // e.g. 2025 for FY25
  level: number;       // IC level (59, 60, 61, 62, …)
  basePay: number;     // end-of-FY annual base salary
  meritIncrease: number;
  promotionIncrease: number;
  bonus: number;
  specialCash: number;
  stockAward: number;  // annual stock award grant value
  signOnBonus: number;
  onHireStock: number; // on-hire stock grant value
  activities: CompActivity[];
}

export interface CompTrajectory {
  entries: CompHistoryEntry[];
  yoyBaseGrowth: number[];       // percent growth in base, per FY transition
  avgMeritPercent: number;       // average merit as % of prior-year base
  avgBonusPercent: number;       // average bonus as % of that FY's base
  avgTotalCompGrowth: number;    // average YoY total comp growth %
  cagr: number;                  // compound annual growth rate of total comp
}

export interface CompBreakdown {
  baseSalary: number;
  bonus: number;
  stockAward: number;
  employer401kMatch: number;
  esppBenefit: number;
  totalCash: number;
  totalComp: number;
}

export interface CompProjectionYear {
  year: number;
  level: number;
  basePay: number;
  bonus: number;
  stockAward: number;
  totalCash: number;
  totalComp: number;
}

export interface CompProjection {
  current: CompBreakdown;
  projectedYears: CompProjectionYear[];
  assumptions: CompProjectionAssumptions;
}

export interface CompProjectionAssumptions {
  annualMeritPercent: number;
  promoEveryNYears: number;
  promoBaseIncreasePercent: number;
  bonusTargetPercent: number;
  stockGrowthPercent: number;
  inflationPercent: number;
  employer401kMatchPercent: number;
  employer401kMatchCapPercent: number;
  esppDiscountPercent: number;
  esppContributionPercent: number;
}

// ── Velocity Track Types ──────────────────────────────────────────

/** Promotion velocity track based on Saul's three-track model */
export type VelocityTrack = 'fast' | 'average' | 'slow';

/** Probability weights for each velocity track */
export interface TrackWeights {
  fast: number;
  average: number;
  slow: number;
}

/** Result of running all three tracks with weighted expected values */
export interface WeightedProjection {
  /** Weighted expected-value timeline: E[v] = w_fast×fast + w_avg×avg + w_slow×slow */
  weighted: YearlyProjection[];
  /** Individual track timelines for confidence bands */
  tracks: Record<VelocityTrack, YearlyProjection[]>;
  /** Track weights used */
  weights: TrackWeights;
}

// ── Retirement Projection Engine Types ────────────────────────────

/** A single promotion event with its timing and comp impact */
export interface PromotionEvent {
  fromLevel: number;
  toLevel: number;
  /** Age at which the promotion occurs */
  atAge: number;
  /** Base salary bump as a decimal (e.g. 0.12 = +12%) */
  baseBumpPercent: number;
  /** Stock award bump as a decimal (e.g. 0.50 = +50%) */
  stockBumpPercent: number;
  /** New annual stock award after promotion */
  newStockAward: number;
  /** New bonus target percent after promotion */
  newBonusTargetPercent: number;
}

/** Level-specific compensation parameters */
export interface LevelCompParams {
  meritPercent: number;        // annual merit raise as decimal (e.g. 0.035)
  bonusTargetPercent: number;  // bonus target as decimal (e.g. 0.12)
  stockAward: number;          // annual stock award in dollars
}

/** Market return rates by age band (lifecycle glide path) */
export interface GlidePath {
  minAge: number;
  maxAge: number;
  annualReturn: number;  // as decimal (e.g. 0.08)
  stockAllocation: number;
  bondAllocation: number;
}

/** Social Security claiming strategy */
export type SSClaimAge = 62 | 67 | 70;

/** Full configuration for the retirement projection engine */
export interface ProjectionConfig {
  // Personal
  currentAge: number;
  retirementAge: number;
  currentYear: number;

  // Current comp
  currentBase: number;
  currentLevel: number;
  currentBonusTargetPercent: number;  // as decimal (e.g. 0.12)
  currentStockAward: number;

  // Promotion schedule
  promotions: PromotionEvent[];
  /** Level-specific comp params (keyed by level number) */
  levelParams: Record<number, LevelCompParams>;

  // 401k
  current401kBalance: number;
  currentRothBalance: number;
  /** Year when Roth→Traditional switch happens (e.g. 2026) */
  rothToTraditionalSwitchYear: number;
  /** Roth contributions already made in the switch year */
  rothContribInSwitchYear: number;
  /** Employer match rate as decimal (e.g. 0.50) */
  employerMatchRate: number;
  /** Base 401k limit in the starting year */
  base401kLimit: number;
  /** Annual growth rate for IRS limits (e.g. 0.02) */
  irsLimitGrowthRate: number;
  /** Catch-up contribution for age 50+ */
  catchUpAmount: number;
  /** Additional super catch-up for age 60-63 */
  superCatchUpAmount: number;

  // ESPP
  annualEsppContribution: number;
  esppDiscountPercent: number;   // as decimal (e.g. 0.15)

  // Market
  glidePath: GlidePath[];
  inflationRate: number;         // as decimal (e.g. 0.025)

  // Social Security
  ssMonthlyPIA: number;          // PIA at FRA in today's dollars
  ssClaimAge: SSClaimAge;

  // Tax
  filingStatus: FilingStatus;

  // Withdrawal
  safeWithdrawalRate: number;    // as decimal (e.g. 0.035)

  // Velocity track (three-track promotion model)
  velocityTrack?: VelocityTrack;
  trackWeights?: TrackWeights;

  // Scenario overrides
  scenarioName?: 'conservative' | 'base' | 'optimistic';
  overrideMarketReturn?: number; // flat override instead of glide path
  overrideMeritRate?: number;    // flat override across all levels
}

/** Compensation-only yearly snapshot */
export interface CompYearProjection {
  year: number;
  calendarYear: number;
  age: number;
  level: number;
  baseSalary: number;
  bonus: number;
  stockAward: number;
  totalCash: number;
  totalComp: number;
  promotedThisYear: boolean;
  meritRate: number;
}

/** One year's full financial snapshot in the retirement projection */
export interface YearlyProjection {
  year: number;           // projection year (0 = current)
  calendarYear: number;
  age: number;
  level: number;

  // Compensation
  baseSalary: number;
  bonus: number;
  stockAward: number;
  totalComp: number;
  promotedThisYear: boolean;

  // 401k
  employee401kContrib: number;
  employerMatch: number;
  is401kRoth: boolean;
  contributionLimit: number;

  // ESPP
  esppContribution: number;
  esppBenefit: number;

  // Portfolio
  beginningBalance: number;
  investmentReturn: number;
  marketReturnRate: number;
  endingBalance: number;

  // Taxes (simplified annual)
  federalTax: number;
  ficaTax: number;
  takeHomePay: number;

  // Inflation-adjusted values
  realEndingBalance: number;
  realTotalComp: number;

  // Milestones
  milestones: string[];
}

/** Summary retirement readiness metrics */
export interface RetirementReadiness {
  // Portfolio
  projectedPortfolio: number;
  projectedPortfolioReal: number;  // in today's dollars
  targetPortfolio: number;

  // Income in retirement (annual)
  swrIncome: number;
  ssAnnualIncome: number;
  totalRetirementIncome: number;
  replacementRatio: number;        // vs final working comp

  // Social Security detail
  ssClaimAge: SSClaimAge;
  ssMonthlyBenefit: number;
  ssTaxablePercent: number;

  // Safety metrics
  safeWithdrawalRate: number;
  yearsUntilDepletion: number | null;  // null = indefinite
  successProbability: number;          // estimated % (heuristic)

  // Gap analysis
  gap: number;                         // positive = surplus, negative = shortfall
  onTrack: boolean;
  warnings: string[];
}

// ── FIRE (Financial Independence, Retire Early) ───────────────────

export type FIREVariant = 'lean' | 'regular' | 'chubby' | 'fat' | 'custom';

export interface FIREConfig {
  annualExpenses: number;
  safeWithdrawalRate: number;        // default 0.035
  expectedGrowthRate: number;        // default 0.07 nominal
  currentPortfolio: number;          // current invested assets
  annualSavings: number;             // annual contributions
  currentAge: number;
  targetRetirementAge: number;
  variant: FIREVariant;
}

export interface FIREResult {
  fireNumber: number;
  coastFIRENumber: number;
  yearsToFIRE: number;
  fireAge: number;
  coastFIREAge: number;              // age when portfolio crosses coast threshold
  yearsToCoastFIRE: number;
  savingsRate: number;               // as decimal
  variant: FIREVariant;
  portfolioTimeline: Array<{
    age: number;
    year: number;
    portfolio: number;
    coastThreshold: number;          // declining coast line for that year
    isCoastFIRE: boolean;
    isFIRE: boolean;
  }>;
  milestones: Array<{
    label: string;
    age: number;
    amount: number;
  }>;
}

export interface FIREScenarioComparison {
  variant: FIREVariant;
  annualExpenses: number;
  fireNumber: number;
  coastFIRENumber: number;
  yearsToFIRE: number;
  fireAge: number;
}

// ── Eastside Housing ──────────────────────────────────────────────

export type PropertyType = 'sfh' | 'condo' | 'townhome';
export type EastsideCity = 'kirkland' | 'redmond' | 'bellevue';

export interface EastsideHousingConfig {
  city: EastsideCity;
  propertyType: PropertyType;
  combinedAnnualIncome: number;      // from comp page
  downPaymentPercent: number;
  // override defaults if user wants
  customHomePrice?: number;
  customMortgageRate?: number;
}

/** Side-by-side scenario comparison */
export interface ScenarioComparison {
  conservative: {
    config: ProjectionConfig;
    projection: YearlyProjection[];
    readiness: RetirementReadiness;
  };
  base: {
    config: ProjectionConfig;
    projection: YearlyProjection[];
    readiness: RetirementReadiness;
  };
  optimistic: {
    config: ProjectionConfig;
    projection: YearlyProjection[];
    readiness: RetirementReadiness;
  };
  summary: {
    portfolioRange: [number, number];    // [conservative, optimistic]
    incomeRange: [number, number];
    bestCase: string;
    worstCase: string;
  };
}
