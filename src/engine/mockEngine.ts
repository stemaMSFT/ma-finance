/**
 * Mock engine functions — returns realistic computed data.
 * These will be replaced by Linus's real engine implementations.
 */

import {
  CONTRIBUTION_LIMIT_UNDER_50,
  DEFAULT_MARKET_RETURN,
  DEFAULT_SAFE_WITHDRAWAL_RATE,
  DEFAULT_PROPERTY_TAX_RATE,
  DEFAULT_HOME_INSURANCE,
  PMI_RATE,
} from './constants';

// ── Compensation ───────────────────────────────────────────────────

export interface PersonComp {
  baseSalary: number;
  bonusTargetPercent: number;
  rsuAnnual: number;
  employer401kMatchPercent: number;
  employer401kMatchLimit: number;
  employee401kContribution: number; // annual employee 401k contribution in dollars
  esppDiscountPercent: number;
  esppContributionPercent: number;
}

export interface CompSummary {
  baseSalary: number;
  bonusAmount: number;
  rsuAnnual: number;
  esppBenefit: number;
  employer401kMatch: number;
  totalComp: number;
  breakdown: { name: string; value: number; color: string }[];
}

export function calcCompensation(p: PersonComp): CompSummary {
  const bonusAmount = p.baseSalary * (p.bonusTargetPercent / 100);
  const esppContrib = p.baseSalary * (p.esppContributionPercent / 100);
  const discount = p.esppDiscountPercent / 100;
  const esppBenefit = esppContrib * discount / (1 - discount);
  // 401k match: employer matches a percentage of employee contributions, capped at IRS limit
  const cappedContribution = Math.min(p.employee401kContribution, CONTRIBUTION_LIMIT_UNDER_50);
  const employer401kMatch = cappedContribution * (p.employer401kMatchPercent / 100);
  const totalComp = p.baseSalary + bonusAmount + p.rsuAnnual + esppBenefit + employer401kMatch;

  return {
    baseSalary: p.baseSalary,
    bonusAmount,
    rsuAnnual: p.rsuAnnual,
    esppBenefit,
    employer401kMatch,
    totalComp,
    breakdown: [
      { name: 'Base Salary', value: p.baseSalary, color: '#6c63ff' },
      { name: 'Bonus', value: bonusAmount, color: '#48cae4' },
      { name: 'RSUs', value: p.rsuAnnual, color: '#06d6a0' },
      { name: 'ESPP Benefit', value: esppBenefit, color: '#ffd166' },
      { name: '401k Match', value: employer401kMatch, color: '#ef476f' },
    ].filter((item) => item.value > 0),
  };
}

// ── Retirement ─────────────────────────────────────────────────────

export interface RetirementProjection {
  timeline: { year: number; age: number; current: number; maxed: number }[];
  currentFinalBalance: number;
  maxedFinalBalance: number;
  yearsToRetirement: number;
  annualIncomeAtRetirement: number;
  maxedAnnualIncome: number;
  taxSavings: number;
  readinessScore: number;
  readinessLabel: string;
  readinessColor: string;
}

export function calcRetirement(
  currentAge: number,
  retirementAge: number,
  currentBalance: number,
  salary: number,
  contributionPercent: number,
  employerMatchPercent: number,
  employerMatchLimitPercent: number,
  returnRate: number,
): RetirementProjection {
  const years = Math.max(0, retirementAge - currentAge);
  const currentContrib = salary * (contributionPercent / 100);
  // Match is based on employee contributions capped at IRS limit, not on salary
  const cappedContrib = Math.min(currentContrib, CONTRIBUTION_LIMIT_UNDER_50);
  const employerMatch = cappedContrib * (employerMatchPercent / 100);
  const maxContrib = CONTRIBUTION_LIMIT_UNDER_50;
  const maxWithMatch = maxContrib + employerMatch;
  const currentWithMatch = Math.min(currentContrib, maxContrib) + employerMatch;

  const timeline: { year: number; age: number; current: number; maxed: number }[] = [];
  let currentBal = currentBalance;
  let maxedBal = currentBalance;
  const startYear = new Date().getFullYear();

  for (let i = 0; i <= years; i++) {
    timeline.push({
      year: startYear + i,
      age: currentAge + i,
      current: Math.round(currentBal),
      maxed: Math.round(maxedBal),
    });
    currentBal = (currentBal + currentWithMatch) * (1 + returnRate);
    maxedBal = (maxedBal + maxWithMatch) * (1 + returnRate);
  }

  const currentFinalBalance = timeline[timeline.length - 1]?.current ?? currentBalance;
  const maxedFinalBalance = timeline[timeline.length - 1]?.maxed ?? currentBalance;

  const annualIncomeAtRetirement = currentFinalBalance * DEFAULT_SAFE_WITHDRAWAL_RATE;
  const maxedAnnualIncome = maxedFinalBalance * DEFAULT_SAFE_WITHDRAWAL_RATE;

  // Estimate tax savings at 22% marginal rate
  const taxSavings = Math.min(currentContrib, maxContrib) * 0.22;

  // Readiness: target is 10x salary at retirement (Fidelity guideline)
  const targetBalance = salary * 10;
  const score = Math.min(100, Math.round((currentFinalBalance / targetBalance) * 100));

  let readinessLabel = 'Needs Attention';
  let readinessColor = '#ef476f';
  if (score >= 85) { readinessLabel = 'Excellent'; readinessColor = '#06d6a0'; }
  else if (score >= 65) { readinessLabel = 'On Track'; readinessColor = '#06d6a0'; }
  else if (score >= 40) { readinessLabel = 'Making Progress'; readinessColor = '#ffd166'; }

  return {
    timeline,
    currentFinalBalance,
    maxedFinalBalance,
    yearsToRetirement: years,
    annualIncomeAtRetirement,
    maxedAnnualIncome,
    taxSavings,
    readinessScore: score,
    readinessLabel,
    readinessColor,
  };
}

// ── Housing ────────────────────────────────────────────────────────

export interface MortgageBreakdown {
  monthlyPI: number;
  propertyTax: number;
  insurance: number;
  pmi: number;
  hoa: number;
  total: number;
  loanAmount: number;
  downPayment: number;
  pieData: { name: string; value: number; color: string }[];
}

export interface AffordabilityResult {
  mortgage: MortgageBreakdown;
  frontEndRatio: number;
  backEndRatio: number;
  comfortStatus: 'green' | 'yellow' | 'red';
  comfortLabel: string;
  comfortDescription: string;
  totalInterestPaid: number;
  totalCostOverLife: number;
  breakEvenYears: number;
  comparison: {
    monthly15: number;
    monthly30: number;
    totalInterest15: number;
    totalInterest30: number;
    interestSavings: number;
  };
}

function calcMonthlyPI(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0 || n === 0) return principal / (n || 1);
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function calcMortgage(
  homePrice: number,
  downPaymentPercent: number,
  mortgageRate: number,
  termYears: 15 | 30,
  annualIncome: number,
  monthlyDebts: number,
  propertyTaxRate: number = DEFAULT_PROPERTY_TAX_RATE,
  annualInsurance: number = DEFAULT_HOME_INSURANCE,
  monthlyHOA: number = 0,
): AffordabilityResult {
  const downPayment = homePrice * (downPaymentPercent / 100);
  const loanAmount = homePrice - downPayment;
  const monthlyPI = calcMonthlyPI(loanAmount, mortgageRate, termYears);
  const propertyTax = (homePrice * propertyTaxRate) / 12;
  const insurance = annualInsurance / 12;
  const pmi = downPaymentPercent < 20 ? (loanAmount * PMI_RATE) / 12 : 0;
  const total = monthlyPI + propertyTax + insurance + pmi + monthlyHOA;

  const totalInterestPaid = Math.max(0, monthlyPI * termYears * 12 - loanAmount);
  const totalCostOverLife = total * termYears * 12;

  const monthlyGross = annualIncome / 12;
  const frontEndRatio = monthlyGross > 0 ? (total / monthlyGross) * 100 : 0;
  const backEndRatio = monthlyGross > 0 ? ((total + monthlyDebts) / monthlyGross) * 100 : 0;

  let comfortStatus: 'green' | 'yellow' | 'red' = 'green';
  let comfortLabel = 'Comfortable';
  let comfortDescription = "Housing costs are within the comfortable 24% threshold. You have buffer if income dips.";
  if (frontEndRatio > 28 || backEndRatio > 36) {
    comfortStatus = 'red';
    comfortLabel = 'At Stretch Limit';
    comfortDescription = "Exceeds bank's 28/36 guidelines. High financial stress risk if income changes.";
  } else if (frontEndRatio > 24 || backEndRatio > 32) {
    comfortStatus = 'yellow';
    comfortLabel = 'Moderate Stretch';
    comfortDescription = "Within bank limits but above comfortable threshold. Make sure both incomes are stable.";
  }

  const monthly15 = calcMonthlyPI(loanAmount, mortgageRate, 15);
  const monthly30 = calcMonthlyPI(loanAmount, mortgageRate, 30);
  const totalInterest15 = Math.max(0, monthly15 * 15 * 12 - loanAmount);
  const totalInterest30 = Math.max(0, monthly30 * 30 * 12 - loanAmount);

  // Break-even for buying vs renting (simplified: assumes rent grows 3%/yr)
  const breakEvenYears = homePrice > 0 ? Math.round(homePrice * 0.03 / (total * 0.15)) : 7;

  return {
    mortgage: {
      monthlyPI,
      propertyTax,
      insurance,
      pmi,
      hoa: monthlyHOA,
      total,
      loanAmount,
      downPayment,
      pieData: [
        { name: 'Principal & Interest', value: Math.round(monthlyPI), color: '#6c63ff' },
        { name: 'Property Tax', value: Math.round(propertyTax), color: '#48cae4' },
        { name: 'Insurance', value: Math.round(insurance), color: '#06d6a0' },
        ...(pmi > 0 ? [{ name: 'PMI', value: Math.round(pmi), color: '#ffd166' }] : []),
        ...(monthlyHOA > 0 ? [{ name: 'HOA', value: Math.round(monthlyHOA), color: '#ef476f' }] : []),
      ].filter((d) => d.value > 0),
    },
    frontEndRatio,
    backEndRatio,
    comfortStatus,
    comfortLabel,
    comfortDescription,
    totalInterestPaid,
    totalCostOverLife,
    breakEvenYears,
    comparison: {
      monthly15,
      monthly30,
      totalInterest15,
      totalInterest30,
      interestSavings: totalInterest30 - totalInterest15,
    },
  };
}

// ── Renovation ─────────────────────────────────────────────────────

export interface RenovationResult {
  roiPercent: number;
  paybackYears: number;
  totalBenefit: number;
  investmentFinalValue: number;
  renovateFinalValue: number;
  netBenefit: number;
  signal: 'green' | 'yellow' | 'red';
  signalLabel: string;
  signalReason: string;
  chartData: { year: number; renovate: number; invest: number }[];
}

export function calcRenovation(
  projectCost: number,
  expectedValueAdd: number,
  yearsUntilSelling: number,
  annualEnergySavings: number,
  alternativeReturn: number = DEFAULT_MARKET_RETURN,
): RenovationResult {
  const roiPercent = projectCost > 0 ? (expectedValueAdd / projectCost) * 100 : 0;
  const totalBenefit = expectedValueAdd + annualEnergySavings * yearsUntilSelling;
  const paybackYears =
    annualEnergySavings > 0 ? projectCost / annualEnergySavings : Infinity;

  const horizonYears = Math.max(yearsUntilSelling, 10);
  const chartData: { year: number; renovate: number; invest: number }[] = [];
  let investValue = projectCost;

  for (let y = 0; y <= horizonYears; y++) {
    const renovateValue = y === 0 ? 0 : expectedValueAdd + annualEnergySavings * y;
    chartData.push({
      year: y,
      renovate: Math.round(Math.max(0, renovateValue)),
      invest: Math.round(investValue),
    });
    investValue *= 1 + alternativeReturn;
  }

  const renovateFinalValue = expectedValueAdd + annualEnergySavings * yearsUntilSelling;
  const investmentFinalValue =
    projectCost * Math.pow(1 + alternativeReturn, yearsUntilSelling);
  const netBenefit = renovateFinalValue - investmentFinalValue;

  let signal: 'green' | 'yellow' | 'red' = 'yellow';
  let signalLabel = 'Consider Carefully';
  let signalReason =
    'Financial returns are moderate. Factor in quality-of-life and staying duration.';

  if (roiPercent >= 65 && yearsUntilSelling >= 5) {
    signal = 'green';
    signalLabel = 'Do It';
    signalReason =
      'Strong ROI with sufficient time to recoup costs at sale. Worth doing.';
  } else if (roiPercent < 30 || yearsUntilSelling < 2) {
    signal = 'red';
    signalLabel = 'Probably Skip';
    signalReason =
      'Low ROI or insufficient time to recover costs. The money earns more invested.';
  }

  return {
    roiPercent,
    paybackYears,
    totalBenefit,
    renovateFinalValue,
    investmentFinalValue,
    netBenefit,
    signal,
    signalLabel,
    signalReason,
    chartData,
  };
}
