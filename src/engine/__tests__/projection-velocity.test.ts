/**
 * Integration tests for the projection engine's velocity model.
 * Tests three-track promotion system (fast/average/slow), scenario comparison,
 * weighted projections, and edge cases.
 *
 * Written: 2026-04-26T21:15:01Z
 */
import { describe, it, expect } from 'vitest';
import {
  createDefaultConfig,
  projectCompensationGrowth,
  projectRetirementTimeline,
  calculateRetirementReadiness,
  runScenarioComparison,
  projectWeightedTimeline,
} from '../projection';
import type { ProjectionConfig, PromotionEvent } from '../types';

// ── Helpers ──────────────────────────────────────────────────────

/** Build a comp growth config for a specific velocity track */
function buildTrackCompConfig(track: 'fast' | 'average' | 'slow') {
  const cfg = createDefaultConfig({ velocityTrack: track });

  // Track-specific promotions (mirrors the engine internals)
  const trackPromos: Record<string, PromotionEvent[]> = {
    fast: [
      { fromLevel: 62, toLevel: 63, atAge: 30, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
      { fromLevel: 63, toLevel: 64, atAge: 33, baseBumpPercent: 0.15, stockBumpPercent: 0.40, newStockAward: 35_000, newBonusTargetPercent: 0.15 },
      { fromLevel: 64, toLevel: 65, atAge: 37, baseBumpPercent: 0.15, stockBumpPercent: 0.60, newStockAward: 35_000, newBonusTargetPercent: 0.15 },
    ],
    average: [
      { fromLevel: 62, toLevel: 63, atAge: 31, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
      { fromLevel: 63, toLevel: 64, atAge: 35, baseBumpPercent: 0.10, stockBumpPercent: 0.40, newStockAward: 35_000, newBonusTargetPercent: 0.15 },
    ],
    slow: [
      { fromLevel: 62, toLevel: 63, atAge: 33, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
    ],
  };

  const meritRates: Record<string, number> = { fast: 0.05, average: 0.035, slow: 0.025 };

  const levelParams: Record<string, Record<number, { meritPercent: number; bonusTargetPercent: number; stockAward: number }>> = {
    fast: {
      62: { meritPercent: 0.05, bonusTargetPercent: 0.12, stockAward: 18_000 },
      63: { meritPercent: 0.05, bonusTargetPercent: 0.15, stockAward: 25_000 },
      64: { meritPercent: 0.05, bonusTargetPercent: 0.15, stockAward: 35_000 },
      65: { meritPercent: 0.05, bonusTargetPercent: 0.15, stockAward: 35_000 },
    },
    average: {
      62: { meritPercent: 0.035, bonusTargetPercent: 0.12, stockAward: 18_000 },
      63: { meritPercent: 0.035, bonusTargetPercent: 0.15, stockAward: 25_000 },
      64: { meritPercent: 0.035, bonusTargetPercent: 0.15, stockAward: 35_000 },
      65: { meritPercent: 0.035, bonusTargetPercent: 0.15, stockAward: 35_000 },
    },
    slow: {
      62: { meritPercent: 0.025, bonusTargetPercent: 0.12, stockAward: 18_000 },
      63: { meritPercent: 0.025, bonusTargetPercent: 0.15, stockAward: 25_000 },
      64: { meritPercent: 0.025, bonusTargetPercent: 0.15, stockAward: 35_000 },
      65: { meritPercent: 0.025, bonusTargetPercent: 0.15, stockAward: 35_000 },
    },
  };

  return {
    currentAge: cfg.currentAge,
    retirementAge: cfg.retirementAge,
    currentYear: cfg.currentYear,
    currentBase: cfg.currentBase,
    currentLevel: cfg.currentLevel,
    currentBonusTargetPercent: cfg.currentBonusTargetPercent,
    currentStockAward: cfg.currentStockAward,
    promotions: trackPromos[track]!,
    levelParams: levelParams[track]!,
    overrideMeritRate: meritRates[track],
  };
}

/** Build a full ProjectionConfig for a specific velocity track */
function buildTrackFullConfig(track: 'fast' | 'average' | 'slow'): ProjectionConfig {
  const compCfg = buildTrackCompConfig(track);
  return createDefaultConfig({
    velocityTrack: track,
    promotions: compCfg.promotions,
    levelParams: compCfg.levelParams,
    overrideMeritRate: compCfg.overrideMeritRate,
  });
}


// ═══════════════════════════════════════════════════════════════════
// 1. Age 27 Correction
// ═══════════════════════════════════════════════════════════════════

describe('Age 27 Correction', () => {
  it('createDefaultConfig() returns currentAge: 27', () => {
    const cfg = createDefaultConfig();
    expect(cfg.currentAge).toBe(27);
  });

  it('timeline has 39 entries (age 27→65 inclusive, i.e. 38 years of data)', () => {
    const cfg = createDefaultConfig();
    const timeline = projectRetirementTimeline(cfg);
    // 65 - 27 = 38 years, plus year 0 = 39 entries
    expect(timeline).toHaveLength(39);
  });

  it('first year is age 27', () => {
    const cfg = createDefaultConfig();
    const timeline = projectRetirementTimeline(cfg);
    expect(timeline[0]!.age).toBe(27);
  });

  it('last year is age 65', () => {
    const cfg = createDefaultConfig();
    const timeline = projectRetirementTimeline(cfg);
    expect(timeline[timeline.length - 1]!.age).toBe(65);
  });
});


// ═══════════════════════════════════════════════════════════════════
// 2. Fast Track Promotions
// ═══════════════════════════════════════════════════════════════════

describe('Fast Track Promotions', () => {
  const compCfg = buildTrackCompConfig('fast');
  const comp = projectCompensationGrowth(compCfg);

  it('hits L63 at age 30', () => {
    const atAge30 = comp.find(y => y.age === 30);
    expect(atAge30).toBeDefined();
    expect(atAge30!.level).toBe(63);
    expect(atAge30!.promotedThisYear).toBe(true);
  });

  it('hits L64 at age 33', () => {
    const atAge33 = comp.find(y => y.age === 33);
    expect(atAge33).toBeDefined();
    expect(atAge33!.level).toBe(64);
    expect(atAge33!.promotedThisYear).toBe(true);
  });

  it('hits L65 at age 37', () => {
    const atAge37 = comp.find(y => y.age === 37);
    expect(atAge37).toBeDefined();
    expect(atAge37!.level).toBe(65);
    expect(atAge37!.promotedThisYear).toBe(true);
  });

  it('comp jumps at each promotion year (base bump ≥ 10%)', () => {
    for (const promoAge of [30, 33, 37]) {
      const promoYear = comp.find(y => y.age === promoAge)!;
      const prevYear = comp.find(y => y.age === promoAge - 1)!;
      // Base salary should jump by at least 10% from promotion bump alone
      // (the bump is applied first, then merit on top, so actual increase > bump%)
      const baseBump = (promoYear.baseSalary - prevYear.baseSalary) / prevYear.baseSalary;
      expect(baseBump).toBeGreaterThanOrEqual(0.10);
    }
  });
});


// ═══════════════════════════════════════════════════════════════════
// 3. Average Track Promotions
// ═══════════════════════════════════════════════════════════════════

describe('Average Track Promotions', () => {
  const compCfg = buildTrackCompConfig('average');
  const comp = projectCompensationGrowth(compCfg);

  it('hits L63 at age 31', () => {
    const atAge31 = comp.find(y => y.age === 31);
    expect(atAge31).toBeDefined();
    expect(atAge31!.level).toBe(63);
    expect(atAge31!.promotedThisYear).toBe(true);
  });

  it('hits L64 at age 35', () => {
    const atAge35 = comp.find(y => y.age === 35);
    expect(atAge35).toBeDefined();
    expect(atAge35!.level).toBe(64);
    expect(atAge35!.promotedThisYear).toBe(true);
  });

  it('does NOT hit L65 (terminal at L64)', () => {
    const anyL65 = comp.find(y => y.level >= 65);
    expect(anyL65).toBeUndefined();
  });
});


// ═══════════════════════════════════════════════════════════════════
// 4. Slow Track Promotions
// ═══════════════════════════════════════════════════════════════════

describe('Slow Track Promotions', () => {
  const compCfg = buildTrackCompConfig('slow');
  const comp = projectCompensationGrowth(compCfg);

  it('hits L63 at age 33', () => {
    const atAge33 = comp.find(y => y.age === 33);
    expect(atAge33).toBeDefined();
    expect(atAge33!.level).toBe(63);
    expect(atAge33!.promotedThisYear).toBe(true);
  });

  it('does NOT hit L64 (terminal at L63)', () => {
    const anyL64 = comp.find(y => y.level >= 64);
    expect(anyL64).toBeUndefined();
  });
});


// ═══════════════════════════════════════════════════════════════════
// 5. Track Merit Rates
// ═══════════════════════════════════════════════════════════════════

describe('Track Merit Rates', () => {
  it('fast track applies 5% merit', () => {
    const comp = projectCompensationGrowth(buildTrackCompConfig('fast'));
    // Year 1 (no promo) should show ~5% merit
    const yr1 = comp.find(y => y.year === 1 && !y.promotedThisYear);
    if (yr1) {
      expect(yr1.meritRate).toBeCloseTo(0.05, 3);
    } else {
      // Year 2 won't have a promo either
      const yr2 = comp.find(y => y.year === 2 && !y.promotedThisYear);
      expect(yr2).toBeDefined();
      expect(yr2!.meritRate).toBeCloseTo(0.05, 3);
    }
  });

  it('average track applies 3.5% merit', () => {
    const comp = projectCompensationGrowth(buildTrackCompConfig('average'));
    const nonPromo = comp.find(y => y.year >= 1 && !y.promotedThisYear);
    expect(nonPromo).toBeDefined();
    expect(nonPromo!.meritRate).toBeCloseTo(0.035, 3);
  });

  it('slow track applies 2.5% merit', () => {
    const comp = projectCompensationGrowth(buildTrackCompConfig('slow'));
    const nonPromo = comp.find(y => y.year >= 1 && !y.promotedThisYear);
    expect(nonPromo).toBeDefined();
    expect(nonPromo!.meritRate).toBeCloseTo(0.025, 3);
  });

  it('after 10 years, fast track base salary > average > slow', () => {
    const fastComp = projectCompensationGrowth(buildTrackCompConfig('fast'));
    const avgComp = projectCompensationGrowth(buildTrackCompConfig('average'));
    const slowComp = projectCompensationGrowth(buildTrackCompConfig('slow'));

    const fastAt10 = fastComp.find(y => y.year === 10)!;
    const avgAt10 = avgComp.find(y => y.year === 10)!;
    const slowAt10 = slowComp.find(y => y.year === 10)!;

    expect(fastAt10.baseSalary).toBeGreaterThan(avgAt10.baseSalary);
    expect(avgAt10.baseSalary).toBeGreaterThan(slowAt10.baseSalary);
  });
});


// ═══════════════════════════════════════════════════════════════════
// 6. Scenario Comparison
// ═══════════════════════════════════════════════════════════════════

describe('Scenario Comparison', () => {
  const cfg = createDefaultConfig();
  const comparison = runScenarioComparison(cfg);

  it('returns all 3 scenarios', () => {
    expect(comparison.conservative).toBeDefined();
    expect(comparison.base).toBeDefined();
    expect(comparison.optimistic).toBeDefined();
  });

  it('conservative portfolio < base portfolio < optimistic portfolio', () => {
    const conservPort = comparison.conservative.readiness.projectedPortfolio;
    const basePort = comparison.base.readiness.projectedPortfolio;
    const optPort = comparison.optimistic.readiness.projectedPortfolio;

    expect(conservPort).toBeLessThan(basePort);
    expect(basePort).toBeLessThan(optPort);
  });

  it('all scenarios have valid readiness analysis', () => {
    for (const scenario of [comparison.conservative, comparison.base, comparison.optimistic]) {
      expect(scenario.readiness).toBeDefined();
      expect(scenario.readiness.projectedPortfolio).toBeGreaterThan(0);
      expect(scenario.readiness.swrIncome).toBeGreaterThan(0);
      expect(scenario.readiness.ssAnnualIncome).toBeGreaterThan(0);
      expect(scenario.readiness.totalRetirementIncome).toBeGreaterThan(0);
      expect(typeof scenario.readiness.replacementRatio).toBe('number');
      expect(typeof scenario.readiness.successProbability).toBe('number');
    }
  });

  it('replacement ratios are reasonable (25-150%)', () => {
    for (const scenario of [comparison.conservative, comparison.base, comparison.optimistic]) {
      const ratio = scenario.readiness.replacementRatio;
      // Conservative slow-track can dip below 30% due to high final comp + conservative SWR
      expect(ratio).toBeGreaterThanOrEqual(0.25);
      expect(ratio).toBeLessThanOrEqual(1.50);
    }
  });
});


// ═══════════════════════════════════════════════════════════════════
// 7. Weighted Projections
// ═══════════════════════════════════════════════════════════════════

describe('Weighted Projections', () => {
  const cfg = createDefaultConfig();
  const weighted = projectWeightedTimeline(cfg);

  it('returns weighted timeline and all 3 track timelines', () => {
    expect(weighted.weighted).toBeDefined();
    expect(weighted.weighted.length).toBeGreaterThan(0);
    expect(weighted.tracks.fast).toBeDefined();
    expect(weighted.tracks.average).toBeDefined();
    expect(weighted.tracks.slow).toBeDefined();
  });

  it('weighted ending balance is between slow and fast track values at retirement', () => {
    const lastIdx = weighted.weighted.length - 1;
    const weightedBal = weighted.weighted[lastIdx]!.endingBalance;
    const fastBal = weighted.tracks.fast[lastIdx]!.endingBalance;
    const slowBal = weighted.tracks.slow[lastIdx]!.endingBalance;

    expect(weightedBal).toBeGreaterThanOrEqual(slowBal);
    expect(weightedBal).toBeLessThanOrEqual(fastBal);
  });

  it('weighted base salary is between slow and fast at any given year', () => {
    // Check a mid-career year (year 15, age ~42)
    const yr = 15;
    const weightedSal = weighted.weighted[yr]!.baseSalary;
    const fastSal = weighted.tracks.fast[yr]!.baseSalary;
    const slowSal = weighted.tracks.slow[yr]!.baseSalary;

    expect(weightedSal).toBeGreaterThanOrEqual(slowSal);
    expect(weightedSal).toBeLessThanOrEqual(fastSal);
  });

  it('weights sum to 1.0', () => {
    const w = weighted.weights;
    expect(w.fast + w.average + w.slow).toBeCloseTo(1.0, 5);
  });
});


// ═══════════════════════════════════════════════════════════════════
// 8. Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe('Edge Cases', () => {
  it('config with empty promotions array → stays at L62 forever', () => {
    const cfg = buildTrackCompConfig('fast');
    cfg.promotions = [];
    const comp = projectCompensationGrowth(cfg);

    // Every year should be L62
    for (const yr of comp) {
      expect(yr.level).toBe(62);
      expect(yr.promotedThisYear).toBe(false);
    }
  });

  it('config with retirementAge = currentAge → returns 1 year of data', () => {
    const cfg = createDefaultConfig({ retirementAge: 27 });
    const timeline = projectRetirementTimeline(cfg);
    expect(timeline).toHaveLength(1);
    expect(timeline[0]!.age).toBe(27);
  });

  it('config with very high merit rate → salary grows but does not break', () => {
    const cfg = buildTrackCompConfig('fast');
    cfg.overrideMeritRate = 0.50; // absurd 50% annual merit
    const comp = projectCompensationGrowth(cfg);

    // Should still produce valid output
    expect(comp.length).toBeGreaterThan(0);
    for (const yr of comp) {
      expect(yr.baseSalary).toBeGreaterThan(0);
      expect(Number.isFinite(yr.baseSalary)).toBe(true);
      expect(yr.totalComp).toBeGreaterThan(0);
      expect(Number.isFinite(yr.totalComp)).toBe(true);
    }

    // Last year should be enormously larger but still finite
    const last = comp[comp.length - 1]!;
    expect(last.baseSalary).toBeGreaterThan(cfg.currentBase * 100);
    expect(Number.isFinite(last.baseSalary)).toBe(true);
  });

  it('full timeline with empty promotions produces valid portfolio growth', () => {
    const cfg = createDefaultConfig({ promotions: [] });
    const timeline = projectRetirementTimeline(cfg);

    // Portfolio should grow monotonically (contributions + returns)
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i]!.endingBalance).toBeGreaterThan(timeline[i - 1]!.endingBalance);
    }

    // Level stays at 62 throughout
    for (const yr of timeline) {
      expect(yr.level).toBe(62);
    }
  });

  it('readiness with no projection data returns empty readiness', () => {
    const cfg = createDefaultConfig();
    const readiness = calculateRetirementReadiness([], cfg);
    expect(readiness.projectedPortfolio).toBe(0);
    expect(readiness.onTrack).toBe(false);
    expect(readiness.warnings.length).toBeGreaterThan(0);
  });
});
