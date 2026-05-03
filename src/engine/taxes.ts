/**
 * Shared tax calculation module — single source of truth for
 * federal income tax, FICA, and household tax computations.
 */

import { HSA_FAMILY_LIMIT } from '../config/household';
import type { PersonComp } from './mockEngine';
import {
  FEDERAL_TAX_BRACKETS_MFJ,
  STANDARD_DEDUCTION_MFJ,
  SS_WAGE_BASE,
  SS_TAX_RATE,
  MEDICARE_TAX_RATE,
  MEDICARE_SURTAX_RATE,
} from './constants';

/**
 * Calculate federal income tax using MFJ brackets.
 * Brackets are { min, max, rate } from constants.ts — compute tax by iterating widths.
 */
export function calcFederalIncomeTax(taxableIncome: number): number {
  let tax = 0;
  let remaining = Math.max(0, taxableIncome);
  for (const bracket of FEDERAL_TAX_BRACKETS_MFJ) {
    const width = bracket.max - bracket.min;
    const inBracket = Math.min(remaining, width);
    tax += inBracket * bracket.rate;
    remaining -= inBracket;
    if (remaining <= 0) break;
  }
  return tax;
}

/**
 * Calculate FICA taxes for one person's wages.
 * SS: 6.2% up to SS_WAGE_BASE
 * Medicare: 1.45% on all wages + 0.9% additional on wages over $200K per-person
 */
export function calcFICA(wages: number): number {
  const ss = Math.min(wages, SS_WAGE_BASE) * SS_TAX_RATE;
  const medicare = wages * MEDICARE_TAX_RATE;
  const additionalMedicare = Math.max(0, wages - 200_000) * MEDICARE_SURTAX_RATE;
  return ss + medicare + additionalMedicare;
}

/**
 * Calculate full household tax picture.
 * Returns all tax components + take-home pay.
 */
export function calcHouseholdTaxes(steven: PersonComp, sonya: PersonComp) {
  const stevenCashIncome = steven.baseSalary + steven.baseSalary * steven.bonusTargetPercent / 100;
  const sonyaCashIncome = sonya.baseSalary + sonya.baseSalary * sonya.bonusTargetPercent / 100;
  const totalCashIncome = stevenCashIncome + sonyaCashIncome;

  const preTax401k = steven.employee401kContribution + sonya.employee401kContribution;
  const preTaxHSA = HSA_FAMILY_LIMIT;

  const federalTaxable = Math.max(0, totalCashIncome - preTax401k - preTaxHSA - STANDARD_DEDUCTION_MFJ);
  const federalIncomeTax = calcFederalIncomeTax(federalTaxable);

  // FICA is computed per-person on their gross wages (401k does NOT reduce FICA base)
  const stevenFICA = calcFICA(steven.baseSalary);
  const sonyaFICA = calcFICA(sonya.baseSalary);
  const totalFICA = stevenFICA + sonyaFICA;

  const totalTaxes = federalIncomeTax + totalFICA;
  const takeHome = totalCashIncome - preTax401k - preTaxHSA - totalTaxes;

  return {
    totalCashIncome,
    preTax401k,
    preTaxHSA,
    federalTaxable,
    federalIncomeTax,
    stevenFICA,
    sonyaFICA,
    totalFICA,
    totalTaxes,
    takeHome,
    effectiveTaxRate: totalCashIncome > 0 ? totalTaxes / totalCashIncome : 0,
  };
}
