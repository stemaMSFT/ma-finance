# Squad Decisions

## User Directives & Data

### 2026-04-26T04:29:40Z: Node.js Financial Engine
**By:** Steven (via Copilot)  
**Decision:** The financial engine should work in both browser and Node.js contexts, not just the browser.

### 2026-04-26T04:56:56Z: Real Compensation Data
**By:** Steven (via Copilot)  
**Decision:** Use real Microsoft Total Rewards compensation history (FY22–FY25). Personal data stored in gitignored `src/data/` only, never committed.

**Data:**
- Current: L62, base $158,412, FY25 bonus $14,500, FY25 stock $18,000
- Hired Jul 2021: L59, $110,500 base, $120k on-hire stock grant
- Progression: L59→L60 (Jun 2022), L60→L61 (Dec 2023), L61→L62 (Sep 2025)
- 401k match: 50% on 100% of salary

### 2026-04-26T04:58:00Z: ADP Paystub YTD Data
**By:** Steven (via Copilot)  
**Data through Apr 15, 2026:**
- YTD Gross: $51,936.23 | Base: $46,203.50 (~$158,412 annualized)
- Stock Award Income: $4,320.14 (~$14,800/yr)
- Perks+ Taxable: $1,412.59
- Fed Tax: -$9,099.47 (~$31,200/yr) | Effective rate: ~17.5%
- Social Security: -$3,232.40 | Medicare: -$755.97
- 401k Roth: -$7,392.56 (front-loading, ~$25,350/yr)
- ESPP: -$6,930.56 net (-$5,465.60, ~$18,740/yr)
- LTD Imputed: $143.22

### 2026-04-26T05:01:01Z: 401k Roth → Traditional Switch
**By:** Steven (via Copilot)  
**Decision:** Switch from Roth to Traditional (pre-tax) 401k after Apr 15, 2026.
- Jan 1–Apr 15: Roth 401k ($7,392.56 YTD)
- Apr 16–Dec 31: Traditional 401k
- 2027+: Default to Traditional
- Affects: take-home modeling, retirement projections, tax calculations

## Architectural Decisions

### Decision: Data Flow (UI → Engine → Result)
**Date:** 2026-04-25 | **Author:** Danny (Lead)  
**Status:** Approved

**Pattern:** Unidirectional flow: `[User Input] → [React State] → [engine/*.ts pure function] → [ScenarioResult] → [Charts/Display]`

**Rationale:**
- Engine functions are pure (no side effects, no state)
- UI owns all state; engine is calculation library
- ScenarioResult is universal output type
- Charts consume ScenarioResult.timeline

**Consequences:**
- Linus writes pure functions in `src/engine/` (no React imports)
- Rusty writes components in `src/components/` (calls engine, renders results)
- `types.ts` is the contract between layers
- No caching layer initially

### Decision: Navigation (Sidebar Tabs, No Router)
**Date:** 2026-04-25 | **Author:** Danny (Lead)  
**Status:** Approved

**Pattern:** React state-driven sidebar tabs without React Router.

**Rationale:**
- Single-page tool, not multi-page app — no deep linking needed
- Simple `useState<ScenarioTab>` drives panel rendering
- Avoids router dependency complexity
- Can add React Router later if shareable URLs needed

**Consequences:**
- Navigation is controlled component: `Sidebar` calls `onTabChange`, `App` switches
- No browser history integration (back button won't switch tabs)
- Clean, zero-dependency approach

### Decision: State Management (React Context + useReducer)
**Date:** 2026-04-25 | **Author:** Danny (Lead)  
**Status:** Approved

**Pattern:** Context + useReducer for shared household/scenario state. No external library initially.

**Rationale:**
- App scale doesn't justify dependency overhead
- useReducer gives predictable state transitions
- Zustand available as migration path if Context becomes unwieldy
- Pure engine functions called on-demand, not stored in state

**Consequences:**
- Each scenario panel has local draft inputs
- Shared `HouseholdFinances` lives in top-level Context provider
- Engine functions are pure, called on-demand

### Decision: Styling (Plain CSS, No Framework)
**Date:** 2026-04-25 | **Author:** Danny (Lead)  
**Status:** Approved

**Pattern:** Plain CSS files (one per component area). No CSS framework or CSS-in-JS.

**Rationale:**
- Two-person household app — not a design system
- Zero-runtime CSS, fast build, easy to understand
- Vite handles CSS hot reload perfectly
- CSS Modules available as next step if complexity grows

**Consequences:**
- Global class names — use descriptive names to avoid collision
- Use BEM-ish naming (`.sidebar-btn`, `.panel-description`)
- No scoping — disciplined naming required

### Decision: Personal Financial Data Isolation
**Date:** 2026-04-25 | **Author:** Linus (Engine Dev)  
**Status:** Implemented

**Pattern:** Personal data in `src/data/` (gitignored). Engine functions in `src/engine/` accept typed interfaces, never import from `src/data/` directly. UI wires seed data via hooks.

**Rationale:**
- Personal data must never be committed to git
- Engine functions stay generic and testable with mock data
- Clean separation: data files are "config", engine is "logic"

**Affected Files:**
- `.gitignore` — added `src/data/`
- `src/data/steven-comp.ts` — seed file (gitignored)
- `src/engine/compensation.ts` — generic comp engine
- `src/engine/types.ts` — comp interfaces

### Decision: Comp History Hard-Coded in CompensationPanel (Interim)
**Date:** 2026-04-25 | **Author:** Rusty (UI Dev)  
**Status:** Interim — pending consolidation with `steven-comp.ts`

**Pattern:** Steven's compensation history (FY22–FY25) initially hard-coded in `CompensationPanel.tsx`.

**Rationale:**
- Unblock UI development while Linus builds `steven-comp.ts`
- When Linus's data module lands, refactor to import and remove duplication

**Consequences:**
- Data duplication — needs consolidation
- History tab is 4th tab alongside Steven/Partner/Combined
- Consistent with existing inner-tab pattern

## Real Estate Scenario Scope

### Decision: Real Estate Scenarios (MVP)
**Date:** 2026-04-25 | **Owner:** Reuben (Real Estate Advisor)  
**Status:** Active

**In Scope:**
1. **Home Affordability Calculator** — dual-income, down payment options (5%/10%/20%), PMI, hidden costs, debt ratios + comfort thresholds
2. **Renovation vs. Save Framework** — windows case study, energy ROI, resale impact, QoL assessment, financing options (cash/HELOC/loan)
3. **Buy vs. Rent Analysis** — 5/10-year total cost, break-even timeline, opportunity cost, tax benefits, Seattle market context
4. **Market Timing Context** — interest rate sensitivity (±0.5%), appreciation variability (3–4% Seattle baseline), "time in market" messaging

**Out of Scope:** International property, investment property mechanics (depreciation, 1031 exchanges)

## Financial Planning Constants

### Decision: Safe Withdrawal Rate (3.5%)
**Date:** 2026-04-25 | **Author:** Saul (Finance Analyst)  
**Status:** Active

**Choice:** Default withdrawal rate = 3.5% (middle ground between 4% rule and modern caution).

**Rationale:**
- 4% rule (Trinity, 1994) may be unsafe for 40+ year retirements in current environment
- 2026 inflation (2.7% annualized) above historical average
- Bond yields lower than 1994, reduced portfolio diversification
- Modern research (Morningstar, Vanguard): 3.3%–3.8% safer for new retirees
- Conservative for Microsoft employee (high financial literacy)

**Implementation:**
- App default: 3.5%
- User-adjustable range: 3.0%–4.5%
- UI caveat: "Guideline only — consult financial advisor"

### Decision: Home Appreciation Rate (3.5%/year)
**Date:** 2026-04-25 | **Author:** Saul (Finance Analyst)  
**Status:** Active

**Choice:** Default = 3.5%/year for long-term planning.

**Rationale:**
- Last 5 years (2021–2026): ~2.4%/yr (market cooling)
- 10-year average (King County): ~5–6%/yr
- 20-year long-term: ~5–7%/yr
- Recent correction suggests slower forward appreciation
- Tech job growth + limited housing = long-term support
- Uncertainty about Fed/recession/rates argues for middle ground

## Audit Findings

### Math Audit (2026-04-26T05:04:06Z)
**By:** Saul (Finance Analyst)

**Critical Issues Found:** 2
- **C1: mockEngine.ts — 401k Match Computed on Salary, Not Contributions** (lines 41–42, 89–90)
  - Currently: `matchableBase = salary × 1.0 = $158,412 → match = $79,206` (WRONG)
  - Correct: Match should be 50% of employee contributions, max $12,250/year
  - Impact: Overstates 401k match by $66,956/year (6.5× error)
  - Fix: Replace salary-based formula with contribution-based calculation
  
- **C2: mockEngine.ts — Retirement Projection Uses Same Salary-Based Match** (lines 89–90)
  - Same bug as C1, compounds over 30-year retirement projection
  - Impact: Overstates retirement balance by hundreds of thousands of dollars

**Warnings Found:** 7
- **W1:** compensation.ts uses 2025 IRS limit ($23,500), not 2026 ($24,500) — import from constants.ts
- **W2:** mockEngine.ts ESPP formula incorrect — should be `contribution × 0.15 / 0.85`, not `contribution × 0.15`
- **W3:** housing.ts back-end DTI missing monthlyDebts parameter
- **W4:** Tax savings hardcoded at 22% — should use retirement.ts bracket calculation
- **W5:** Promotion frequency may overstate L63+ growth — assume 2y→L63, 3y→L64, 4+y→L64+
- **W6:** DEFAULT_MARKET_RETURN (7%) ambiguity — verify inflation adjustment downstream
- **W7:** Break-even years formula is heuristic, not real break-even calculation

**Verified Correct:** 17 items (tax brackets, SS base, ESPP formula in compensation.ts, DTI limits, RMD age, etc.)

**Priority Fix Order:**
1. C1 + C2 — Fix mockEngine.ts 401k match (currently giving wrong UI numbers)
2. W1 — Update compensation.ts to 2026 IRS limit
3. W2 — Fix ESPP formula in mockEngine.ts
4. W3–W7 — Lower priority cleanups

**Dual Engine Note:** Codebase has two parallel engines: `mockEngine.ts` (legacy, currently used by UI, has bugs) and new `compensation.ts`/`retirement.ts`/`housing.ts` (Linus's engine, largely correct). Best long-term: wire UI to Linus's engine.

### Test Findings (2026-04-26T05:04:06Z)
**By:** Basher (Tester)

**Tests:** 254 passing total (91 new added)

**Bugs Found:** 4
- **BUG 1 — CRITICAL:** Stale 401k limit in compensation.ts (line 20) — use 2026 limit $24,500, not $23,500
- **BUG 2 — MEDIUM:** mockEngine 401k match formula structurally wrong (lines 41–42) — matches Saul's C1 finding
- **BUG 3 — LOW:** analyzeCompHistory crashes on empty input — needs guard clause
- **BUG 4 — LOW:** Zero salary still gets 401k match — edge case

**Test Coverage Added:**
- compensation.test.ts: 32 tests
- mockEngine.test.ts: 22 tests
- financial-validation.test.ts: 37 tests (tax accuracy, FICA, 401k, ESPP, housing, paystub cross-check)

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
