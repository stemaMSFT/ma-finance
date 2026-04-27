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

## Team Update — Retirement Projection Panel (2026-04-26 05:17:51Z)

### Session Focus: New RetirementProjectionPanel visualization component

**Rusty Accomplishments:**
- Built `src/components/scenarios/RetirementProjectionPanel.tsx` — full 5-tab interactive panel
  - **Overview**: Hero portfolio metric ($3.6M), SVG readiness gauge, metric cards, promotion timeline, mini chart
  - **Projection**: 3-scenario area chart (age 30→95) + stacked contribution breakdown bar chart
  - **Compensation**: Comp trajectory with scenario bands + stacked base/bonus/stock bars + promotion markers
  - **Scenarios**: 3-column comparison table, horizontal bar chart, lever differentiation grid
  - **Settings**: Sliders, segmented controls, toggles — all update projections via useMemo
- Mock data inline — designed for swap with Linus's projection engine
- Color tokens: conservative=blue, base=green, optimistic=purple
- Wired into app: ScenarioTab union, Sidebar, App.tsx panel registry
- TypeScript clean, all 254 tests pass

### 2026-04-26 — Engine wiring + UI polish pass
- **Replaced ALL mock generators** (generatePortfolioProjection, generateCompTrajectory, generateContributionBreakdown, computeReadiness) with real imports from Linus's `projection.ts` engine
- Engine functions used: `createDefaultConfig`, `projectRetirementTimeline`, `projectCompensationGrowth`, `calculateRetirementReadiness`, `runScenarioComparison`
- Engine constants exported: `TRACK_PROMOTIONS`, `TRACK_MERIT_RATES`, `DEFAULT_TRACK_WEIGHTS` (had to add `export` keyword — were module-private)
- **New setting: Velocity Track selector** (fast/average/slow) drives promotions, merit rates, and level params
- `buildConfig()` maps UI settings → `ProjectionConfig` overrides cleanly
- Scenario comparison table now uses real engine `ScenarioComparison` readiness data (7 metrics × 3 scenarios)
- Milestones on projection chart come from engine `YearlyProjection.milestones[]` — promotions, $1M/$2M/$3M crossings, catch-up eligibility
- **UI polish**: New tab bar (pill style), card system with subtle shadows, TrackBadge pill, LoadingOverlay spinner, responsive grid, Toggle/SegmentedGroup components, glassmorphism tooltips, consistent COLORS tokens
- Recharts `Cell` import added for per-bar coloring in terminal portfolio chart (replaces broken `<rect>` approach)
- `SSClaimAge` type imported from engine types instead of inline `62 | 67 | 70`
- All 313 tests pass, TypeScript clean

---

## Team Update — CompensationPanel Modernization (2026-04-26 21:30:55Z)

### Session Focus: Overhaul CompensationPanel UI to match RetirementProjectionPanel quality

**Rusty Accomplishments:**
- Full rewrite of `src/components/scenarios/CompensationPanel.tsx`
- Replaced flat 4-tab layout (steven/partner/combined/history) with polished 4-tab pill bar (Overview/Breakdown/History/Projections)
- **Design system**: Same COLORS tokens + S style object as RetirementProjectionPanel; glassmorphism ChartTooltip; LoadingOverlay spinner
- **Overview tab**: Dark hero card with household total comp prominent ($307k+), 6 metric cards with accent left borders, ComparisonChart side-by-side
- **Breakdown tab**: Per-person segmented selector (Steven/Partner); all inputs preserved; hero total comp card with gradient; BreakdownChart pie + inline styled detail table
- **History tab**: FY milestone cards with YoY growth indicators; base salary LineChart with gradient + ReferenceLine; stacked BarChart; styled table — all matching S.card/S.cardTitle pattern
- **Projections tab**: Wired to real engine — `createDefaultConfig()` + `projectCompensationGrowth()` (next 15 years); AreaChart with area gradient + promotion ReferenceLine markers; stacked BarChart (base/bonus/stock); info callout card
- Removed all class-based CSS (metric-card, panel-grid, comp-table, etc.) — all inline styles matching RetirementProjectionPanel
- Imported `formatPercent` (was missing), `useEffect`, `AreaChart`, `Area` from Recharts
- TypeScript clean; all 313 tests pass

---