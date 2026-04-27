# Decision: Three-Track Velocity Engine Implementation

**Date:** 2026-04-26T05:30:14Z
**Author:** Linus (Engine Dev)
**Status:** Implemented
**Input:** Saul's promotion velocity research (saul-promotion-velocity.md)

## Changes Made

### 1. Age Correction: 27 (not 30)
- `createDefaultConfig()` now sets `currentAge: 27`
- Glide path extended to cover age 27+ (was 30+)
- This adds 3 more years of compounding: 38 years to retirement instead of 35

### 2. Three-Track Promotion Velocity Model
- **Fast track** (50% weight): L63 at 30, L64 at 33, L65 at 37 — terminal L65, 5% merit
- **Average track** (35% weight): L63 at 31, L64 at 35 — terminal L64, 3.5% merit
- **Slow track** (15% weight): L63 at 33 — terminal L63, 2.5% merit

### 3. New Exports
- `projectWeightedTimeline()` — produces E[value] = weighted sum across all 3 tracks, returns both weighted timeline AND individual tracks for confidence bands
- All existing exports preserved: `projectRetirementTimeline`, `calculateRetirementReadiness`, `runScenarioComparison`, `createDefaultConfig`

### 4. Updated Scenario Comparison
- Conservative = slow track + 5.5% flat return + 3.0% SWR
- Base = weighted three-track + glide path returns + 3.5% SWR
- Optimistic = fast track + 7.5% flat return + 4.0% SWR

### 5. New Types (types.ts)
- `VelocityTrack = 'fast' | 'average' | 'slow'`
- `TrackWeights { fast, average, slow }`
- `WeightedProjection { weighted, tracks, weights }`
- `ProjectionConfig` gained `velocityTrack?` and `trackWeights?` fields

## Observation for Saul
Portfolio ending balances are nearly identical across tracks because 401k contributions are maxed and ESPP is fixed. The velocity tracks primarily differentiate **total comp and take-home pay**, not investment portfolio size. If we want portfolio divergence, we'd need to model additional taxable brokerage contributions from the higher take-home of fast-track earners.

## Test Coverage
29 tests — all passing. 283 total suite green.
