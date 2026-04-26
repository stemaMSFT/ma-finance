/**
 * Mortgage, home affordability, and renovation calculations.
 * Pure TypeScript — no React dependencies.
 */

import type {
  HousingInput,
  RenovationInput,
  ScenarioResult,
  TimelinePoint,
  UserProfile,
} from './types';
import { monthlyPayment, futureValue } from './projections';
import {
  PMI_RATE,
  PMI_REMOVAL_LTV,
  HOME_APPRECIATION_MODERATE,
} from './constants';

// ── Monthly Housing Cost Breakdown ────────────────────────────────

export interface MonthlyHousingBreakdown {
  principal: number;
  interest: number;
  propertyTax: number;
  insurance: number;
  hoa: number;
  pmi: number;
  total: number;
}

/**
 * Calculate a detailed monthly housing cost breakdown for a given home purchase.
 * Uses the first month's amortization split for principal vs interest.
 *
 * @param input - Housing purchase parameters
 * @returns Itemized monthly cost breakdown
 */
export function calculateMonthlyHousingCost(input: HousingInput): MonthlyHousingBreakdown {
  const downPayment = input.homePrice * input.downPaymentPercent;
  const loanAmount = input.homePrice - downPayment;

  const monthlyPmt = monthlyPayment(loanAmount, input.mortgageRate, input.mortgageTermYears);
  const monthlyRate = input.mortgageRate / 12;

  // First-month interest; remainder is principal
  const firstMonthInterest = loanAmount * monthlyRate;
  const firstMonthPrincipal = monthlyPmt - firstMonthInterest;

  const propertyTax = (input.homePrice * input.propertyTaxRate) / 12;
  const insurance = input.annualInsurance / 12;
  const hoa = input.monthlyHOA;
  const pmi = input.pmiRequired ? (loanAmount * PMI_RATE) / 12 : 0;

  return {
    principal: firstMonthPrincipal,
    interest: firstMonthInterest,
    propertyTax,
    insurance,
    hoa,
    pmi,
    total: monthlyPmt + propertyTax + insurance + hoa + pmi,
  };
}

// ── Home Affordability ────────────────────────────────────────────

/** Front-end DTI limit: housing costs ≤ 28% of gross monthly income */
const FRONT_END_DTI_LIMIT = 0.28;
/** Back-end DTI limit: total debt ≤ 36% of gross monthly income */
const BACK_END_DTI_LIMIT = 0.36;

/**
 * Calculate home affordability including monthly costs, DTI analysis,
 * closing costs, and an equity-buildup timeline.
 *
 * @param profile - Buyer's income and age info
 * @param input - Home purchase parameters
 * @returns ScenarioResult with payment breakdown, warnings, and equity timeline
 */
export function calculateAffordability(
  profile: UserProfile,
  input: HousingInput,
): ScenarioResult {
  const warnings: string[] = [];
  const downPayment = input.homePrice * input.downPaymentPercent;
  const loanAmount = input.homePrice - downPayment;
  const closingCosts = input.homePrice * input.closingCostPercent;

  // Monthly mortgage P&I
  const monthlyMortgage = monthlyPayment(loanAmount, input.mortgageRate, input.mortgageTermYears);
  const monthlyRate = input.mortgageRate / 12;
  const totalMonths = input.mortgageTermYears * 12;

  // Monthly non-mortgage costs
  const monthlyPropertyTax = (input.homePrice * input.propertyTaxRate) / 12;
  const monthlyInsurance = input.annualInsurance / 12;
  const monthlyHOA = input.monthlyHOA;
  const monthlyPMI = input.pmiRequired ? (loanAmount * PMI_RATE) / 12 : 0;

  const totalMonthlyHousing =
    monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyHOA + monthlyPMI;

  // DTI checks
  const grossMonthlyIncome = profile.annualIncome / 12;
  const frontEndRatio = totalMonthlyHousing / grossMonthlyIncome;
  if (frontEndRatio > FRONT_END_DTI_LIMIT) {
    warnings.push(
      `Front-end DTI ratio is ${(frontEndRatio * 100).toFixed(1)}%, exceeding the recommended 28% limit.`,
    );
  }
  // Back-end uses the same housing cost (no other debts tracked in UserProfile)
  const backEndRatio = totalMonthlyHousing / grossMonthlyIncome;
  if (backEndRatio > BACK_END_DTI_LIMIT) {
    warnings.push(
      `Back-end DTI ratio is ${(backEndRatio * 100).toFixed(1)}%, exceeding the recommended 36% limit.`,
    );
  }

  // PMI warning
  if (input.pmiRequired) {
    warnings.push(
      `PMI of $${Math.round(monthlyPMI)}/mo required until LTV drops below ${PMI_REMOVAL_LTV * 100}%.`,
    );
  }

  // Build year-by-year equity timeline via amortization + appreciation
  const timeline: TimelinePoint[] = [];
  const appreciationRate = HOME_APPRECIATION_MODERATE;
  let remainingBalance = loanAmount;
  let homeValue = input.homePrice;

  // Year 0: equity = down payment
  timeline.push({
    year: 0,
    age: profile.age,
    value: Math.round(downPayment),
  });

  let totalPaid = 0;
  for (let y = 1; y <= input.mortgageTermYears; y++) {
    // Amortize 12 months
    for (let m = 0; m < 12; m++) {
      if (remainingBalance > 0) {
        const interestPmt = remainingBalance * monthlyRate;
        const principalPmt = monthlyMortgage - interestPmt;
        remainingBalance = Math.max(0, remainingBalance - principalPmt);
        totalPaid += monthlyMortgage;
      }
    }
    // Home appreciates
    homeValue = homeValue * (1 + appreciationRate);
    const equity = homeValue - remainingBalance;
    timeline.push({
      year: y,
      age: profile.age + y,
      value: Math.round(equity),
    });
  }

  // Total payments over the full term (mortgage + taxes + insurance + HOA + PMI)
  const totalMortgagePayments = totalPaid;
  const totalNonMortgage =
    (monthlyPropertyTax + monthlyInsurance + monthlyHOA) * totalMonths;
  // PMI only until ~80% LTV — approximate as full-term for simplicity in summary
  const totalPMI = input.pmiRequired ? monthlyPMI * totalMonths : 0;

  // totalContributed = upfront cash needed (down payment + closing costs)
  const totalContributed = downPayment + closingCosts;
  // totalGrowth = total interest paid over the loan life
  const totalInterestPaid = totalMortgagePayments - (loanAmount - remainingBalance);
  const totalGrowth = totalInterestPaid;
  // finalValue = total cost of homeownership over the full term
  const finalValue = totalContributed + totalMortgagePayments + totalNonMortgage + totalPMI;

  return {
    name: 'Home Affordability',
    description: 'Monthly payment breakdown and affordability analysis',
    timeline,
    summary: {
      totalContributed: Math.round(totalContributed),
      totalGrowth: Math.round(totalGrowth),
      finalValue: Math.round(finalValue),
    },
    warnings,
  };
}

// ── Renovation vs. Save ───────────────────────────────────────────

/**
 * Compare the ROI of a home renovation against investing the same money.
 *
 * - Renovation path: cost → value add → appreciation on that value over time.
 * - Investment path: invest the cost at `alternativeReturn` → compound growth.
 * - If financed, calculates loan payments and total interest.
 *
 * @param renovation - Renovation project details
 * @param alternativeReturn - Annual return rate if the money were invested instead
 * @returns ScenarioResult with side-by-side timeline and comparison
 */
export function compareRenovationVsSave(
  renovation: RenovationInput,
  alternativeReturn: number,
): ScenarioResult {
  const warnings: string[] = [];
  const horizonYears = 10; // standard comparison horizon
  const appreciationRate = HOME_APPRECIATION_MODERATE;

  const cost = renovation.projectCost;
  const valueAdd = renovation.expectedValueAdd;
  const isFinanced = renovation.financing !== 'cash';

  // Financing costs
  let totalInterestPaid = 0;
  let monthlyLoanPayment = 0;
  if (isFinanced && renovation.loanRate && renovation.loanTermYears) {
    monthlyLoanPayment = monthlyPayment(cost, renovation.loanRate, renovation.loanTermYears);
    const totalLoanPayments = monthlyLoanPayment * renovation.loanTermYears * 12;
    totalInterestPaid = totalLoanPayments - cost;
  }

  const totalCost = cost + totalInterestPaid;

  // ROI warning
  if (valueAdd < cost) {
    const roi = ((valueAdd - cost) / cost) * 100;
    warnings.push(
      `Renovation ROI is ${roi.toFixed(1)}% — you may not recoup the full cost.`,
    );
  }

  // High financing cost warning
  if (totalInterestPaid > cost * 0.25) {
    warnings.push(
      `Financing adds $${Math.round(totalInterestPaid).toLocaleString()} in interest (${((totalInterestPaid / cost) * 100).toFixed(0)}% of project cost).`,
    );
  }

  // Build side-by-side timeline
  const timeline: TimelinePoint[] = [];

  // Year 0
  timeline.push({ year: 0, age: 0, value: Math.round(valueAdd), label: 'Renovation' });
  timeline.push({ year: 0, age: 0, value: Math.round(cost), label: 'Invest' });

  for (let y = 1; y <= horizonYears; y++) {
    // Renovation: value add appreciates over time
    const renovationValue = futureValue(valueAdd, appreciationRate, y);
    timeline.push({ year: y, age: y, value: Math.round(renovationValue), label: 'Renovation' });

    // Investment: compound growth on the cash
    const investmentValue = futureValue(cost, alternativeReturn, y);
    timeline.push({ year: y, age: y, value: Math.round(investmentValue), label: 'Invest' });
  }

  // Net benefits at end of horizon
  const renovationFinalValue = futureValue(valueAdd, appreciationRate, horizonYears);
  const renovationNetBenefit = renovationFinalValue - totalCost;

  const investmentFinalValue = futureValue(cost, alternativeReturn, horizonYears);
  const investmentNetBenefit = investmentFinalValue - cost;

  const vsAlternative = renovationNetBenefit - investmentNetBenefit;

  if (vsAlternative < 0) {
    warnings.push(
      `Investing the money would yield $${Math.round(Math.abs(vsAlternative)).toLocaleString()} more than the renovation over ${horizonYears} years.`,
    );
  }

  return {
    name: 'Renovation vs. Save',
    description: `Compare "${renovation.projectName}" ROI against investing the cash`,
    timeline,
    summary: {
      totalContributed: Math.round(totalCost),
      totalGrowth: Math.round(renovationFinalValue - valueAdd),
      finalValue: Math.round(renovationFinalValue),
    },
    comparison: {
      vsBaseline: Math.round(renovationNetBenefit),
      vsAlternative: Math.round(vsAlternative),
    },
    warnings,
  };
}
