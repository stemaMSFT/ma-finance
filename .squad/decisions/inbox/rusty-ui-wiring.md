# Decision: Wire RetirementProjectionPanel to Real Engine + UI Polish

**Author:** Rusty (UI Dev)  
**Date:** 2026-04-26  
**Status:** Implemented

## Context
RetirementProjectionPanel was shipping with 4 inline mock generators producing fake data. Linus's projection engine (`src/engine/projection.ts`) was complete and tested but not wired to the UI.

## Decisions Made

### 1. Exported engine constants
Added `export` to `TRACK_PROMOTIONS`, `TRACK_MERIT_RATES`, `DEFAULT_TRACK_WEIGHTS` in projection.ts so the UI can display promotion schedules and merit rates per track. These were module-private.

### 2. Added Velocity Track setting
New `velocityTrack` field on `ProjectionSettings` (fast/average/slow). Drives which promotion schedule and merit rates feed the engine. Default: fast (matching Steven's L62→L66+ trajectory).

### 3. Risk profile → return rate mapping
- Conservative → overrideMarketReturn: 5.5%
- Moderate → no override (uses engine's glide path)
- Aggressive → overrideMarketReturn: 8.5%

### 4. SWR stored as percentage in UI
Settings store SWR as `3.5` (percent), `buildConfig()` divides by 100 to give engine `0.035`. Avoids user confusion.

### 5. Scenarios tab uses engine ScenarioComparison directly
`runScenarioComparison()` already defines conservative/base/optimistic internally. The UI renders its output rather than constructing scenarios client-side.

## Impact
- All 313 tests pass, TypeScript clean
- No engine logic changed (only `export` keywords added)
- Panel is fully data-driven by engine output
