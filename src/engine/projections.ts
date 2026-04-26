/**
 * General financial projection utilities.
 * Compound growth, savings trajectories, etc.
 * Linus owns implementation — this is the scaffold.
 */

import type { TimelinePoint } from './types';

export function compoundGrowth(
  _principal: number,
  _annualContribution: number,
  _annualReturn: number,
  _years: number,
): TimelinePoint[] {
  // TODO: Linus to implement
  return [];
}

export function futureValue(
  principal: number,
  rate: number,
  years: number,
): number {
  return principal * Math.pow(1 + rate, years);
}

export function presentValue(
  futureAmount: number,
  rate: number,
  years: number,
): number {
  return futureAmount / Math.pow(1 + rate, years);
}

export function monthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  const monthlyRate = annualRate / 12;
  const payments = termYears * 12;
  if (monthlyRate === 0) return principal / payments;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, payments))
    / (Math.pow(1 + monthlyRate, payments) - 1);
}
