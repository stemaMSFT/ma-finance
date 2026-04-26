# Basher — History

## Project Context
- **App:** ma-finance — personal finance scenario planner for Steven and his wife
- **Stack:** React + TypeScript
- **Scenarios:** 401k max-out, retirement projections, home affordability, renovation vs savings

## Learnings

### 2026-04-26T05:04:06Z — Comprehensive Engine Validation (254 tests)
- Wrote 91 new tests across 3 files: compensation.test.ts, mockEngine.test.ts, financial-validation.test.ts
- **Found critical bug**: compensation.ts uses stale 2025 401k limit ($23,500 vs correct $24,500). Causes $500/yr match undercount.
- **Found structural bug**: mockEngine.ts calculates 401k match as `salary × matchLimit% × matchPercent%` instead of `min(employeeContribution, IRS_limit) × matchPercent%`. With matchLimit=100, gives $79k match instead of $12,250 max.
- **Found edge case**: analyzeCompHistory crashes on empty array input.
- **Found edge case**: calculateMicrosoftComp gives match on zero salary because default contribution param isn't salary-capped.
- Monthly vs annual compounding matters: compoundGrowth (monthly) yields ~2% more than futureValue (annual) over 10yr at 7%. Both are correct for their use case.
- Steven's CAGR appears negative because FY22 includes $120k on-hire stock grant inflating that year's total comp.
- All 254 tests green. Financial formulas in retirement.ts and housing.ts are solid.

## Team Update — Full Buildout Session (2026-04-25 21:48:31)

### Completed Deliverables
- **linus**: housing.ts calculation engine (18/19 tests)
- **rusty**: HousingPanel and RenovationPanel UI components (TypeScript clean)
- **basher**: 163 unit tests across all engines (all passing)
- **danny**: Express backend with scenario CRUD and calculation APIs

---

## Team Update — Math Audit + Test Validation (2026-04-26T05:11:52Z)

### Saul's Audit & Basher's Test Findings Summary for Basher

**CRITICAL ISSUES TO FIX (confirm Linus's work):**
1. **mockEngine.ts 401k Match (C1+C2)**: Salary-based formula gives $79,206 match instead of correct $12,250. Fix: Use `min(employeeContribution, IRS_limit) × 50%`. Affects UI display and retirement projections (overstates by hundreds of thousands).
2. **compensation.ts IRS limit (W1)**: Stale 2025 limit ($23,500) vs 2026 ($24,500). Import `CONTRIBUTION_LIMIT_UNDER_50` from constants.ts.

**CONFIRMED BUG FINDINGS:**
- Saul found 2 critical issues in mockEngine.ts, 7 warnings across engines, 17 verified-correct items
- Basher wrote 91 tests (254 total passing) and confirmed all 4 bugs (1 CRITICAL, 3 secondary)
- Tests provide regression coverage for Linus's fixes

**VERIFIED SOLID IN YOUR ENGINE:**
- compensation.ts 401k match formula (correct) — just uses wrong year's limit (W1)
- retirement.ts bracket calculations, Roth vs Traditional logic
- housing.ts mortgage amortization, DTI limits
- All tax calculations, SS base, RMD age

---
