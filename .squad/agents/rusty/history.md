# Rusty — History

## Project Context
- **App:** ma-finance — personal finance scenario planner for Steven and his wife
- **Stack:** React + TypeScript
- **Scenarios:** 401k max-out, retirement projections, home affordability, renovation vs savings

## Learnings

### 2026-04-25 — CompensationPanel real data + history viz
- Updated DEFAULT_STEVEN from mock ($185k/$80k RSU) to real comp ($158,412 base, 10% bonus, $18k RSU, 15% ESPP)
- Added `history` tab alongside steven/partner/combined using Recharts directly (LineChart for base progression, stacked BarChart for total comp by FY)
- Hard-coded comp history data inline — will migrate to Linus's `steven-comp.ts` when available
- ReferenceLine and stacked bars work well for annotated financial charts in Recharts
- The `formatCurrency(v, true)` shorthand is used project-wide for axis tick formatting


## Team Update — Full Buildout Session (2026-04-25 21:48:31)

### Completed Deliverables
- **linus**: housing.ts calculation engine (18/19 tests)
- **rusty**: HousingPanel and RenovationPanel UI components (TypeScript clean)
- **basher**: 163 unit tests across all engines (all passing)
- **danny**: Express backend with scenario CRUD and calculation APIs

---

## Team Update — Comp Data Integration Session (2026-04-26 05:01:01Z)

### Session Focus: User directives, compensation engine + real data, decision consolidation

**Rusty Accomplishments:**
- CompensationPanel.tsx updated with real Steven defaults ($158,412 base, 10% bonus, $18k stock, 15% ESPP)
- History tab added (4th visualization tab) with Recharts:
  - Base salary progression line chart (FY22-FY25)
  - Total comp stacked bar chart with level annotations (L59→L62)
  - Detail table with year-by-year breakdown
- Data interim: hard-coded compensation arrays will be consolidated with Linus's engine when integrated

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
