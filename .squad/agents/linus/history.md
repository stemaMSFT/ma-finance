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
