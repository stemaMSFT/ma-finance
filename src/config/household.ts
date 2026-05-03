/**
 * Single source of truth for household compensation data.
 * All panels import from here instead of defining their own constants.
 */

import type { PersonComp } from '../engine/mockEngine';

export const STEVEN_COMP: PersonComp = {
  baseSalary: 158_412,
  bonusTargetPercent: 10,
  rsuAnnual: 18_000,
  employer401kMatchPercent: 50,
  employer401kMatchLimit: 100,
  employee401kContribution: 24_500,
  esppDiscountPercent: 15,
  esppContributionPercent: 10,
};

export const SONYA_COMP: PersonComp = {
  baseSalary: 150_697,            // $86.67/hr × 2080
  bonusTargetPercent: 10,
  rsuAnnual: 13_899,              // 2025 Stock Award Income from paystub
  employer401kMatchPercent: 50,
  employer401kMatchLimit: 100,
  employee401kContribution: 24_500,
  esppDiscountPercent: 15,
  esppContributionPercent: 10,
};

export const HSA_FAMILY_LIMIT = 8_550; // 2026 IRS family limit
