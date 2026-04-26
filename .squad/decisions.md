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

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
