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
