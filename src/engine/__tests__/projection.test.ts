/**
 * Tests for the retirement projection engine.
 * Validates core calculations against Saul's three-track velocity model.
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
import type { ProjectionConfig, VelocityTrack } from '../types';

describe('Retirement Projection Engine', () => {
  const baseConfig = createDefaultConfig();

  describe('createDefaultConfig', () => {
    it('returns Steven baseline with age 27', () => {
      expect(baseConfig.currentAge).toBe(27);
      expect(baseConfig.retirementAge).toBe(65);
      expect(baseConfig.currentBase).toBe(158_412);
      expect(baseConfig.currentLevel).toBe(62);
    });

    it('defaults to fast track with 3 promotions', () => {
      expect(baseConfig.velocityTrack).toBe('fast');
      expect(baseConfig.promotions).toHaveLength(3);
    });

    it('has track weights summing to 1.0', () => {
      const w = baseConfig.trackWeights!;
      expect(w.fast + w.average + w.slow).toBeCloseTo(1.0);
      expect(w.fast).toBe(0.50);
      expect(w.average).toBe(0.35);
      expect(w.slow).toBe(0.15);
    });
  });

  describe('projectCompensationGrowth', () => {
    it('returns 39 years of data (age 27-65)', () => {
      const comp = projectCompensationGrowth(baseConfig);
      expect(comp).toHaveLength(39); // year 0 through year 38
      expect(comp[0]!.age).toBe(27);
      expect(comp[0]!.level).toBe(62);
      expect(comp[comp.length - 1]!.age).toBe(65);
    });

    it('fast track: L63 at age 30', () => {
      const comp = projectCompensationGrowth(baseConfig);
      const atAge30 = comp.find(c => c.age === 30)!;
      expect(atAge30.level).toBe(63);
      expect(atAge30.promotedThisYear).toBe(true);
      // Base should jump 12% promo + 5% merit
      const priorYear = comp.find(c => c.age === 29)!;
      expect(atAge30.baseSalary).toBeGreaterThan(priorYear.baseSalary * 1.10);
    });

    it('fast track: L64 at age 33', () => {
      const comp = projectCompensationGrowth(baseConfig);
      const atAge33 = comp.find(c => c.age === 33)!;
      expect(atAge33.level).toBe(64);
      expect(atAge33.promotedThisYear).toBe(true);
    });

    it('fast track: L65 at age 37', () => {
      const comp = projectCompensationGrowth(baseConfig);
      const atAge37 = comp.find(c => c.age === 37)!;
      expect(atAge37.level).toBe(65);
      expect(atAge37.promotedThisYear).toBe(true);
    });

    it('stays at L65 after age 37', () => {
      const comp = projectCompensationGrowth(baseConfig);
      const year20 = comp.find(c => c.age === 50)!;
      expect(year20.level).toBe(65);
      expect(year20.promotedThisYear).toBe(false);
    });

    it('starts at $158k base and grows over 38 years', () => {
      const comp = projectCompensationGrowth(baseConfig);
      expect(comp[0]!.baseSalary).toBe(158_412);
      const final = comp[comp.length - 1]!;
      // After 38 years of 5% merit + promotions, should be well over $400k
      expect(final.baseSalary).toBeGreaterThan(400_000);
    });
  });

  describe('projectRetirementTimeline', () => {
    it('returns 39 yearly snapshots (age 27-65)', () => {
      const timeline = projectRetirementTimeline(baseConfig);
      expect(timeline).toHaveLength(39);
      expect(timeline[0]!.age).toBe(27);
      expect(timeline[38]!.age).toBe(65);
    });

    it('starts with current 401k balance', () => {
      const timeline = projectRetirementTimeline(baseConfig);
      expect(timeline[0]!.beginningBalance).toBe(baseConfig.current401kBalance);
    });

    it('portfolio grows to millions by retirement', () => {
      const timeline = projectRetirementTimeline(baseConfig);
      const final = timeline[timeline.length - 1]!;
      // 38 years of compounding with promotions + ESPP + 401k
      expect(final.endingBalance).toBeGreaterThan(3_000_000);
      expect(final.endingBalance).toBeLessThan(15_000_000);
    });

    it('tracks promotions as milestones (fast track = 3 promos)', () => {
      const timeline = projectRetirementTimeline(baseConfig);
      const promoYears = timeline.filter(y => y.promotedThisYear);
      expect(promoYears).toHaveLength(3); // L63, L64, L65
    });

    it('applies lifecycle glide path returns', () => {
      const timeline = projectRetirementTimeline(baseConfig);
      // Age 27-40: 8%
      expect(timeline[5]!.marketReturnRate).toBe(0.08);
      // Age 41-55: 6.5%
      expect(timeline[18]!.marketReturnRate).toBe(0.065);
      // Age 61-65: 4%
      expect(timeline[36]!.marketReturnRate).toBe(0.04);
    });

    it('401k contributions max out each year', () => {
      const timeline = projectRetirementTimeline(baseConfig);
      expect(timeline[0]!.employee401kContrib).toBe(baseConfig.base401kLimit);
    });

    it('real ending balance is less than nominal', () => {
      const timeline = projectRetirementTimeline(baseConfig);
      const final = timeline[timeline.length - 1]!;
      expect(final.realEndingBalance).toBeLessThan(final.endingBalance);
      // ~2.5% inflation over 38 years: real should be roughly 35-55% of nominal
      expect(final.realEndingBalance).toBeGreaterThan(final.endingBalance * 0.25);
      expect(final.realEndingBalance).toBeLessThan(final.endingBalance * 0.60);
    });
  });

  describe('calculateRetirementReadiness', () => {
    it('produces readiness metrics for base case', () => {
      const timeline = projectRetirementTimeline(baseConfig);
      const readiness = calculateRetirementReadiness(timeline, baseConfig);
      expect(readiness.projectedPortfolio).toBeGreaterThan(0);
      expect(readiness.swrIncome).toBeGreaterThan(0);
      expect(readiness.ssAnnualIncome).toBe(Math.round(3_800 * 12)); // PIA × 12 at FRA
      expect(readiness.totalRetirementIncome).toBe(readiness.swrIncome + readiness.ssAnnualIncome);
      expect(readiness.replacementRatio).toBeGreaterThan(0);
      expect(readiness.successProbability).toBeGreaterThan(0.80);
    });

    it('SS benefit varies by claim age', () => {
      const timeline62 = projectRetirementTimeline({ ...baseConfig, ssClaimAge: 62 });
      const readiness62 = calculateRetirementReadiness(timeline62, { ...baseConfig, ssClaimAge: 62 });

      const timeline70 = projectRetirementTimeline({ ...baseConfig, ssClaimAge: 70 });
      const readiness70 = calculateRetirementReadiness(timeline70, { ...baseConfig, ssClaimAge: 70 });

      // Age 70 benefit should be ~77% more than age 62 (1.24/0.70)
      expect(readiness70.ssMonthlyBenefit).toBeGreaterThan(readiness62.ssMonthlyBenefit * 1.5);
    });
  });

  describe('runScenarioComparison', () => {
    it('produces three scenarios with increasing portfolios', () => {
      const comparison = runScenarioComparison(baseConfig);

      const conPort = comparison.conservative.readiness.projectedPortfolio;
      const basePort = comparison.base.readiness.projectedPortfolio;
      const optPort = comparison.optimistic.readiness.projectedPortfolio;

      expect(conPort).toBeLessThan(basePort);
      expect(basePort).toBeLessThan(optPort);

      // With 38 years of compounding, numbers should be larger than before
      expect(conPort).toBeGreaterThan(1_500_000);
      expect(basePort).toBeGreaterThan(2_500_000);
      expect(optPort).toBeGreaterThan(4_000_000);
    });

    it('conservative uses slow track (terminal L63)', () => {
      const comparison = runScenarioComparison(baseConfig);
      const conProj = comparison.conservative.projection;
      // Slow track: only one promotion (L62→L63 at 33)
      const promos = conProj.filter(y => y.promotedThisYear);
      expect(promos).toHaveLength(1);
      expect(conProj[conProj.length - 1]!.level).toBe(63);
    });

    it('summary has portfolio and income ranges', () => {
      const comparison = runScenarioComparison(baseConfig);
      expect(comparison.summary.portfolioRange[0]).toBeLessThan(comparison.summary.portfolioRange[1]);
      expect(comparison.summary.incomeRange[0]).toBeLessThan(comparison.summary.incomeRange[1]);
    });
  });

  describe('Three-Track Velocity Model', () => {
    it('age 27 produces 38 years of projection', () => {
      const config = createDefaultConfig();
      expect(config.retirementAge - config.currentAge).toBe(38);
      const timeline = projectRetirementTimeline(config);
      expect(timeline).toHaveLength(39); // 0 through 38
    });

    it('fast track hits L63 at 30, L64 at 33, L65 at 37', () => {
      const fastConfig = createDefaultConfig({ velocityTrack: 'fast' });
      const comp = projectCompensationGrowth(fastConfig);

      expect(comp.find(c => c.age === 30)!.level).toBe(63);
      expect(comp.find(c => c.age === 33)!.level).toBe(64);
      expect(comp.find(c => c.age === 37)!.level).toBe(65);
    });

    it('average track hits L63 at 31, L64 at 35, terminates at L64', () => {
      const avgConfig = createDefaultConfig({
        promotions: [
          { fromLevel: 62, toLevel: 63, atAge: 31, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
          { fromLevel: 63, toLevel: 64, atAge: 35, baseBumpPercent: 0.10, stockBumpPercent: 0.40, newStockAward: 35_000, newBonusTargetPercent: 0.15 },
        ],
      });
      const comp = projectCompensationGrowth(avgConfig);

      expect(comp.find(c => c.age === 31)!.level).toBe(63);
      expect(comp.find(c => c.age === 35)!.level).toBe(64);
      // Stays at L64
      expect(comp.find(c => c.age === 50)!.level).toBe(64);
    });

    it('slow track terminates at L63', () => {
      const slowConfig = createDefaultConfig({
        promotions: [
          { fromLevel: 62, toLevel: 63, atAge: 33, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
        ],
      });
      const comp = projectCompensationGrowth(slowConfig);

      expect(comp.find(c => c.age === 33)!.level).toBe(63);
      // Stays at L63 forever
      expect(comp.find(c => c.age === 50)!.level).toBe(63);
      expect(comp.find(c => c.age === 65)!.level).toBe(63);
    });

    it('weighted projection is between fast and slow', () => {
      const weighted = projectWeightedTimeline(baseConfig);

      const fastFinalComp = weighted.tracks.fast[weighted.tracks.fast.length - 1]!.totalComp;
      const slowFinalComp = weighted.tracks.slow[weighted.tracks.slow.length - 1]!.totalComp;
      const weightedFinalComp = weighted.weighted[weighted.weighted.length - 1]!.totalComp;

      // Fast track comp should exceed slow track comp significantly
      expect(fastFinalComp).toBeGreaterThan(slowFinalComp);
      // Weighted comp should be between fast and slow
      expect(weightedFinalComp).toBeGreaterThanOrEqual(slowFinalComp);
      expect(weightedFinalComp).toBeLessThanOrEqual(fastFinalComp);
    });

    it('weighted projection returns all three track timelines', () => {
      const weighted = projectWeightedTimeline(baseConfig);
      expect(weighted.tracks.fast).toHaveLength(39);
      expect(weighted.tracks.average).toHaveLength(39);
      expect(weighted.tracks.slow).toHaveLength(39);
      expect(weighted.weighted).toHaveLength(39);
    });

    it('fast track merit rate is 5%', () => {
      const comp = projectCompensationGrowth(baseConfig);
      // Year 1 (before any promo at age 28) should use 5% merit
      expect(comp[1]!.meritRate).toBe(0.05);
    });

    it('slow track merit rate is 2.5%', () => {
      const slowConfig = createDefaultConfig({
        promotions: [
          { fromLevel: 62, toLevel: 63, atAge: 33, baseBumpPercent: 0.12, stockBumpPercent: 0.50, newStockAward: 25_000, newBonusTargetPercent: 0.15 },
        ],
        overrideMeritRate: 0.025,
      });
      const comp = projectCompensationGrowth(slowConfig);
      expect(comp[1]!.meritRate).toBe(0.025);
    });
  });
});
