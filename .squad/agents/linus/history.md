# Linus — History

## Project Context
- **App:** ma-finance — personal finance scenario planner for Steven and his wife
- **Stack:** React + TypeScript
- **Scenarios:** 401k max-out, retirement projections, home affordability, renovation vs savings

## Learnings

### Compensation Engine (2026-04-25)
- Created `src/engine/compensation.ts` with 4 exports: `calculateTotalComp`, `analyzeCompHistory`, `projectCompensation`, `calculateMicrosoftComp`
- Added 9 new interfaces to `src/engine/types.ts`: `CompActivity`, `CompHistoryEntry`, `CompTrajectory`, `CompBreakdown`, `CompProjectionYear`, `CompProjection`, `CompProjectionAssumptions`
- Personal data pattern: `src/data/` is gitignored; seed files live there, engine functions stay generic in `src/engine/`
- Microsoft 401k model: 50% match on employee contributions up to IRS limit ($23,500 in 2025). ESPP is 15% discount modeled as discount/(1-discount) benefit.
- `analyzeCompHistory` computes YoY base growth, avg merit %, avg bonus %, total comp CAGR — all from a generic `CompHistoryEntry[]`
- `projectCompensation` uses configurable assumptions (merit %, promo cadence, stock growth, inflation) with sensible Microsoft defaults

## Team Update — Full Buildout Session (2026-04-25 21:48:31)

### Completed Deliverables
- **linus**: housing.ts calculation engine (18/19 tests)
- **rusty**: HousingPanel and RenovationPanel UI components (TypeScript clean)
- **basher**: 163 unit tests across all engines (all passing)
- **danny**: Express backend with scenario CRUD and calculation APIs

---

## Team Update — Comp Data Integration Session (2026-04-26 05:01:01Z)

### Session Focus: User directives, compensation engine + real data, decision consolidation

**Linus Accomplishments:**
- Compensation engine (`src/engine/compensation.ts`) complete with 4 core exports
- 9 new interfaces in `src/engine/types.ts` for comp modeling
- Created `src/data/steven-comp.ts` with Steven's real FY22-FY25 comp history (gitignored)
- Data isolation pattern working: UI hooks → seed data → engine functions (all pure)

**Team Directives Captured:**
1. Steven's 401k switching from Roth → Traditional after Apr 15, 2026 (affects take-home, tax, retirement projections)
2. ADP paystub YTD data through Apr 15, 2026 (for paycheck modeling)
3. Node.js compatibility requirement for financial engine

**Next Steps:**
- Consolidate Rusty's hard-coded comp history with Linus's engine
- Implement 401k Traditional pre-tax logic in paycheck calculator
- Real estate affordability engine (Reuben/Linus collab)

---

## Bug Fix Session (2026-04-26T05:11:52Z)

### Fixes Applied
- **C1/C2 (Critical):** 401k match computed on employee contributions capped at IRS limit, not salary. Old formula overstated by 6.5×. Added `employee401kContribution` field to `PersonComp` in mockEngine.
- **W1:** Replaced hardcoded `IRS_401K_LIMIT_2025 = 23_500` in compensation.ts with import of `CONTRIBUTION_LIMIT_UNDER_50` from constants.ts ($24,500).
- **W2:** ESPP formula fixed to `contribution × discount / (1 - discount)` in mockEngine.
- **W3:** `analyzeCompHistory([])` guard clause added — returns zeroed trajectory instead of crashing.
- **W4:** Zero salary now produces zero 401k match via `min(contribution, IRS_LIMIT, salary)`.
- All 254 tests pass after fixes. Bug-documenting test assertions updated to correct-behavior assertions.

## Team Update — Math Audit + Test Validation (2026-04-26T05:11:52Z)

### Saul's Audit Findings (2 Critical, 7 Warning, 17 Verified)

**CRITICAL ISSUES TO FIX:**
1. **mockEngine.ts 401k Match (C1+C2)**: Currently computes match as `salary × matchLimit% × matchPercent%` = $79,206/yr. Correct formula is `min(employeeContribution, IRS_limit) × 50%` = $12,250/yr. This 6.5× error inflates UI total comp display and retirement projections by hundreds of thousands.
2. **compensation.ts IRS limit (W1)**: Uses 2025 limit ($23,500) instead of 2026 ($24,500). Affects all Microsoft comp calculations. Fix: Import `CONTRIBUTION_LIMIT_UNDER_50` from constants.ts.

**MEDIUM ISSUES:**
3. **ESPP formula in mockEngine.ts (W2)**: Uses `contrib × 0.15` instead of correct `contrib × 0.15 / 0.85`. Understates benefit by ~$419/yr.
4. **housing.ts back-end DTI (W3)**: Missing monthlyDebts parameter — currently identical to front-end ratio.

**LOWER PRIORITY:**
5. Tax savings hardcoded at 22% (should use retirement.ts bracket calculation)
6. Promotion assumptions may overstate L63+ growth (recommend 2y→L63, 3y→L64, 4+y→L64+)
7. DEFAULT_MARKET_RETURN ambiguity (verify inflation adjustment downstream)
8. Break-even years formula is heuristic, not real break-even calculation

**VERIFIED CORRECT:** Tax brackets, SS wage base, ESPP formula in compensation.ts, DTI limits, RMD age (73), retirement readiness logic, 401k contribution limits by age — 17 items total.

### Basher's Test Validation

Wrote 91 new tests (254 total passing):
- **compensation.test.ts**: 32 tests
- **mockEngine.test.ts**: 22 tests
- **financial-validation.test.ts**: 37 tests (tax accuracy, FICA, 401k, ESPP, housing, paystub cross-check)

**Confirmed bugs:** BUG 1 (CRITICAL — stale IRS limit), BUG 2 (MEDIUM — salary-based match), BUG 3–4 (LOW — edge cases).

**ACTION:** Linus to fix C1+C2 (mockEngine 401k) and W1 (compensation.ts IRS limit) as priority 1. Tests provide regression coverage. Consider wiring UI to Linus's real engine (compensation.ts/retirement.ts/housing.ts) to deprecate buggy mockEngine.ts entirely.

---

## Retirement Projection Engine (2026-04-26T05:17:51Z)

### Deliverables
- Created `src/engine/projection.ts` with 5 exports: `createDefaultConfig`, `projectCompensationGrowth`, `projectRetirementTimeline`, `calculateRetirementReadiness`, `runScenarioComparison`
- Added 9 new interfaces to `src/engine/types.ts`: `ProjectionConfig`, `YearlyProjection`, `CompYearProjection`, `RetirementReadiness`, `ScenarioComparison`, `PromotionEvent`, `LevelCompParams`, `GlidePath`, `SSClaimAge`
- 18 new tests in `src/engine/__tests__/projection.test.ts` — all passing (272 total suite)

### Key Learnings
- Promotion-driven comp modeling produces significantly higher terminal portfolios than flat merit assumptions — Steven's L62→L64 path adds ~$70k to base salary over the projection
- ESPP benefit compounding into the portfolio produces higher numbers than Saul's 401k-focused estimates (~$7.2M vs $3.6M). This is because we're tracking all wealth accumulation streams, not just 401k
- Lifecycle glide path returns matter: switching from 8% to 4% in the final 5 years before retirement materially reduces terminal balance vs a flat 6.5% assumption
- IRS limit growth at 2%/yr with $500 rounding approximation closely tracks historical IRS adjustment patterns
- The `ProjectionConfig` interface is designed to be fully overridable — scenarios just spread overrides on top of base config

---

## Three-Track Velocity Engine (2026-04-26T05:30:14Z)

### Deliverables
- Updated `createDefaultConfig()` to `currentAge: 27` (was 30) - adds 3 more years of compounding (38 years to 65)
- Implemented Saul's three-track promotion velocity model (fast/average/slow) with `TRACK_PROMOTIONS`, `TRACK_MERIT_RATES`, `TRACK_LEVEL_PARAMS` constants
- Added `projectWeightedTimeline()` - runs all 3 tracks, produces weighted E[value] = 0.50*fast + 0.35*avg + 0.15*slow, returns both weighted + individual tracks
- Updated `runScenarioComparison()` - conservative=slow track + 5.5% returns, base=weighted three-track, optimistic=fast track + 7.5% returns
- Added `VelocityTrack`, `TrackWeights`, `WeightedProjection` types to types.ts
- Added `velocityTrack` and `trackWeights` fields to `ProjectionConfig`
- 29 tests in projection.test.ts (all passing, 283 total suite)

### Key Learnings
- Portfolio ending balances are nearly identical across velocity tracks because the main investment vehicles (401k maxed + ESPP) are contribution-capped and don't vary with comp. The tracks primarily differ in total comp, take-home pay, and lifestyle capacity - not portfolio size.
- The glide path minAge needed to extend down to 27 (was 30) to cover the new starting age.
- `buildTrackConfig()` helper makes it clean to construct per-track ProjectionConfigs from a base config.
- Blending timelines (weighted average of numeric fields) works well for the most likely line but loses the portfolio path-dependency. Acceptable because the portfolio inputs are capped anyway.
