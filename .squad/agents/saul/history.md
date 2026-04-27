# Saul — History

## Project Context
- **App:** ma-finance — personal finance scenario planner for Steven and his wife
- **Stack:** React + TypeScript
- **Scenarios:** 401k max-out, retirement projections, home affordability, renovation vs savings
- **User context:** Steven is a Microsoft employee. Compensation numbers entered manually.

## Learnings

### 2026 Financial Data Compilation (April 25, 2026)

**Key Research & Sources:**
1. **401(k) & Retirement Limits:**
   - IRS.gov confirmed 2026 limits: $24,500 (employee), $72,000 (total), $80,000 (age 50+), $83,250 (super catch-up ages 60–63).
   - Microsoft employer match: 50% of deferrals up to limit = max $12,250 match. **Immediately vested.**
   - IRA limits: $7,500 ($8,600 age 50+). Roth phase-out: $242k–$252k (MFJ).

2. **Tax Brackets (Federal, 2026, MFJ):**
   - 7 brackets: 10% ($0–$24.8k) through 37% ($768.7k+).
   - Standard deduction: $32,200.
   - Long-term capital gains: 0% ($0–$98.9k), 15% ($98.9k–$583.75k), 20% ($583.75k+). Additional 3.8% NIIT if MAGI >$250k.
   - FICA: 7.65% (employee) up to $184.5k SS wage base; Medicare 1.45% all income + 0.9% additional over $250k (MFJ).
   - Washington state: **0% income tax on wages; 7% capital gains tax on gains >$250k/year.**

3. **Mortgage & Housing:**
   - Current rates (April 25, 2026): 30-year ~6.25%, 15-year ~5.60%. Used mid-market rates.
   - Seattle property tax: 0.98% median (range 0.85%–1.0%). Default 0.95%.
   - Home insurance: ~$1,466 (median); default $1,600 conservative.
   - PMI: 0.3%–1.5% annual (typical 0.5%–0.8% with good credit and 10–15% down).
   - Closing costs: 2%–5% of purchase price; used 3% for Seattle.
   - Home appreciation: Last 5 years ~2.4%, 10-year ~5–6%, long-term ~5–7%. **Defaulted to 3.5% (conservative mid-point).**

4. **Renovation ROI (2026):**
   - Minor kitchen: 81–113% → default 75%.
   - Bathroom: 67–74% → default 70%.
   - Windows (vinyl, whole-house): 73–89% → default 80%.
   - HVAC: 60–63% → default 62%.
   - Window savings: $200–$400/year. HVAC savings: $500–$1,200/year.
   - Key insight: **Minor cosmetic updates outperform luxury remodels on ROI.** Whole-house projects have declining ROI at higher price points.

5. **Retirement Planning:**
   - 4% rule debated; modern consensus suggests 3.3%–3.8% safer for 30+ year horizons. **Defaulted to 3.5% as conservative middle ground.**
   - RMD age: 73 (SECURE 2.0). Formula: Account balance ÷ IRS Uniform Lifetime Table divisor.
   - Social Security: Full Retirement Age 67 for born-in-1960+. Claiming age adjustment: 62 (~70% benefit), 67 (100%), 70 (~124%).

6. **Investment Returns & Inflation:**
   - Expected returns: Conservative 4%, Moderate 6%, Aggressive 8%. **Moderate (60/40) portfolio default 6%.**
   - Inflation 2026: 2.7% current; historical post-WWII ~2–3%; Fed target 2%. **Defaulted to 2.5% for long-term.**
   - Healthcare inflation: 3.5%/year (faster than general).

**Key Decisions Made:**
- Safe withdrawal rate: **3.5%** (vs. classic 4%); allows user adjustment 3%–4.5%.
- Home appreciation: **3.5%/year** (vs. 5–7% long-term); conservative but defensible.
- Expected market return: **6%** (Moderate); realistic after fees and inflation.
- Inflation: **2.5%** (vs. current 2.7% or historical 2%); middle ground.
- Mortgage rate: **6.25% (30-yr), 5.60% (15-yr)**; current market mid-point.
- Property tax: **0.95%** (Seattle/King County); just under median to account for variability.

**Debatable Values Documented:**
Created `.squad/decisions/inbox/saul-financial-data.md` with 12 decision documents:
- 4% rule trade-offs (inflation risk vs. flexibility).
- Home appreciation uncertainty (recent slowdown vs. long-term average).
- Market return assumptions (historical vs. modern fee impact).
- All key assumptions defensible but have acceptable ranges; Linus can implement as user-configurable scenarios.

**What Became Clear:**
- **Microsoft employee context matters:** High income ($200k+) means Roth phase-out, NIIT considerations, higher tax brackets. Plan should flag these.
- **Mega backdoor Roth important for optimization:** Need HR confirmation on Microsoft plan; made it an advanced toggle (not default).
- **Seattle market specific:** Property taxes, insurance, home appreciation, and renovation ROI differ from national averages. Document local data, not just national.
- **Annual review required:** Tax limits, rates, and depreciation data change yearly. January IRS announcement is key refresh date.

### Full Financial Math Audit (April 26, 2026)

**Trigger:** Steven reported 401k employer match calculated against salary instead of contributions.

**Audit Scope:** All 6 engine files + CompensationPanel.tsx. Checked 401k match, tax brackets, ESPP, SS/Medicare, housing formulas, and hardcoded values.

**Key Findings:**
- **2 CRITICAL bugs** in `mockEngine.ts`: 401k match computed as 50% of salary ($79,206) instead of 50% of contributions ($12,250). Overstates match by 6.5×. Both `calcCompensation()` and `calcRetirement()` affected. The CompensationPanel.tsx uses mockEngine, so the UI is actively showing wrong numbers.
- **7 WARNINGS:** compensation.ts uses 2025 IRS limit ($23,500 not $24,500), ESPP formula in mockEngine understates benefit by 15%, housing.ts back-end DTI ignores other debts, hardcoded 22% tax rate, overly aggressive promotion assumptions for L63+, market return nominal/real ambiguity, rough break-even heuristic.
- **17 items verified correct:** Tax brackets, SS wage base, Medicare rates, mortgage amortization, DTI limits, SS claiming adjustments, SWR, home appreciation, RMD age, Linus's new engine formulas.

**Critical Insight:** Linus's new engine (`compensation.ts`, `retirement.ts`, `housing.ts`) is largely correct. The bugs are concentrated in the legacy `mockEngine.ts` which the UI currently uses. Best path forward is wiring UI to the new engine.

**Report written to:** `.squad/decisions/inbox/saul-math-audit.md`

**Sources Used:**
- IRS.gov (limits, brackets, RMD rules, tax rates).
- SSA.gov (Social Security wage base, benefit estimation).
- Freddie Mac, Zillow, Mortgage Daily (current mortgage rates).
- King County Assessor, Seattle Real Estate Data (property taxes, appreciation).
- Cost vs. Value, Angi.com, HomeAdvisor (renovation ROI).
- U.S. Bureau of Labor Statistics (CPI/inflation).
- SHRM, Financial industry reports (employer match practices, safe withdrawal rates).
- Morningstar, Vanguard (retirement withdrawal strategy research).

### Retirement Projection Assumptions (April 26, 2026)

**Trigger:** Steven requested complete retirement projection assumptions (age 30 to 65) grounded in research, with Optimistic/Base/Conservative scenarios.

**Research Completed:**

1. **Microsoft Compensation Model (L59–L65+):**
   - Merit increases: 3.5% L59–L62, declining to 2.5% at L65+.
   - Promotion frequency: 1.0–1.5yr early career (L59–L62), slowing to 2–3yr at L63+.
   - Promotion salary bumps: 8–12% per level; stock bumps 25–50%.
   - Terminal assumption: L63 by age 37, plateau through retirement (most likely scenario).
   - Terminal comp (base): $195k L63 with merit growth to $617k by age 65 (all nominal).
   - Sources: Levels.fyi, Blind, Steven's actual L59–L62 data (verified).

2. **Market & Investment Returns:**
   - Lifecycle glide path: 90/10 equities (age 30) → 30/70 (age 60+).
   - Nominal returns: 8.0% (aggressive 30–40) → 4.0% (conservative 60–65).
   - Base case: 6.5% for 70/30 portfolio (age 40–55).
   - Inflation: 2.5%/yr (Fed target 2%, post-WWII avg 2.4%; use 2.5% as defensible midpoint).
   - Real returns: 5.5% (aggressive), 4.0% (moderate), 2.5% (conservative) after inflation.
   - Sources: Vanguard, Morningstar, academic (Damodaran, Shiller CAPE), historical 1926–2024 data.

3. **401k & Retirement Accounts:**
   - 2026 limits: $24,500 (employee), $72,000 (aggregate). SECURE 2.0 super catch-up ages 60–63: +$5,000 additional.
   - Employer match: 50% of deferrals up to $12,250/yr (Microsoft policy, verified).
   - IRS limit growth: ~2%/yr historical trend; model as indexed.
   - Contribution strategy: 85% Traditional / 15% Roth (base case; user toggle to 100% Roth or 50/50).
   - Tax benefit: 39.65% marginal today (32% federal + 7.65% FICA); 24% marginal in retirement → Roth arbitrage ~15% savings.
   - Projected age-65 balance: $3.6M (base case, 2026 dollars) from $36.75k annual contributions over 35 years.
   - Sources: IRS.gov, SSA.gov, Microsoft HR, Levels.fyi.

4. **Social Security:**
   - Estimated PIA (high earner): $3,800/month at FRA 67 = $45,600/yr.
   - Claiming age scenarios: 62 ($31,920/yr), 67 ($45,600/yr), 70 ($57,024/yr).
   - Taxation: 85% of SS included in taxable income for high-earner scenario (Provisional Income >$44k).
   - Break-even: Claim 62 vs. 67 at age 80; claim 67 vs. 70 at age 82.
   - Assumption: Base case delay to 70 if portfolio >$3M at 65 (optimal for longevity).
   - Sources: SSA.gov, IRS Pub 915, AIME formula.

5. **Retirement Spending & Safe Withdrawal Rate:**
   - SWR: 3.5% (conservative mid-point) vs. traditional 4% rule.
   - Rationale: Modern success rate 95–96% (30-yr horizon) for 3.5%; 4% rule now 85–90% due to valuation headwinds.
   - Replacement ratio: 75% of pre-retirement income (target); SWR covers 50–60%, SS covers ~25–30%.
   - Healthcare inflation: 3.5%/yr (vs. general 2.5%); healthcare = 5% of spending age 65–74, 8% at 75+.
   - Terminal spending: $183k/yr (year 1 of retirement, base case) = $126k portfolio withdrawal + $57k SS.
   - Sources: Bengen (4% rule), Kitces (updated SWR), Morningstar, FIRE community research.

6. **Scenario Modeling (Optimistic / Base / Conservative):**
   - Conservative: L62 terminal, 5.5% return, 3.0% SWR → $2.5M age 65, $75k annual retirement income.
   - Base: L63 by age 37, 6.5% return, 3.5% SWR → $3.6M age 65, $183k annual retirement income.
   - Optimistic: L64 by age 42, 7.5% return, 4.0% SWR → $4.8M age 65, $249k annual retirement income.
   - Key levers (ranked by impact): Market return (±35%), contribution rate (±25%), promotion (±20%), retirement age (±$300k–500k/yr).
   - Success probability: 92% (conservative) to 98% (optimistic) for 30-year horizon.
   - Sources: Monte Carlo research, SWR analysis, promotion trajectory data.

**Key Insights:**
- **Promotion is critical:** L62→L63 jump adds $40k+ annual comp ($195k base vs. $175k if no promo), compounding to ~$500k+ extra lifetime earnings.
- **Market return dominates:** 1% return variance = ±$600k at age 65. Most important assumption to expose to user sensitivity.
- **Roth arbitrage works:** At 39.65% marginal (current) vs. 24% retirement, Roth provides real 15% tax savings if income stays high or tax rates rise.
- **3.5% SWR is sweet spot:** Conservative enough for 30-year horizon, allows modest inflation growth, avoids hard 4% rule risk.
- **Social Security delay to 70 optimal:** If portfolio sufficient, delay maximizes longevity insurance (pension-like income). Break-even age 82 is reasonable health assumption for high-earner.

**Output:** `.squad/decisions/inbox/saul-retirement-assumptions.md` — 10-section structured reference for Linus to build projection engine. All assumptions have numeric values + rationale + sources. Ready for UI implementation.

**What Became Clear:**
- **Microsoft compensation data essential:** Generic SWR/return models miss L-level-specific salary progression (promo bumps, stock vesting, match details).
- **Annual recalibration required:** IRS limits, tax brackets, SS rules change yearly. January refresh recommended.
- **User scenarios build confidence:** Showing Optimistic/Base/Conservative with clear levers (retirement age, market return, promo) gives Steven agency vs. single-point forecast.
- **Tax modeling complex but critical:** Roth vs. Traditional, SS taxation, WA capital gains (7% if >$250k gains/yr) — all matter for net retirement income.

## 2026-04-26: Math Fixes Complete

Fixed all 6 compensation engine bugs:
- 401k match now computed on employee contributions (not salary)
- ESPP formula corrected to discount / (1 - discount)
- All IRS limits sourced from constants.ts
- 254/254 tests passing
- Decision document: docs/decisions.md

### Three-Track Promotion Velocity Model (2026-04-26T05:25:29Z)

**Trigger:** Steven flagged inconsistency — previous work said L62→L63 = 2.0yr but timeline showed L63 at age 37 (10 years at L62). Steven is 27, not 30 as previously assumed.

**Research Completed:**
- Deep-dive into Microsoft promotion velocity across 11 sources (Levels.fyi, Blind, Promotions.fyi, leaked pay docs, Taro, etc.)
- Built three-track model: Fast (top 10–15%), Average (median), Slow (bottom quartile)
- L62→L63 is confirmed as primary career cliff: ~60–70% of L62s never reach L63 at Microsoft
- Fast track L62→L63 = 24–30 months; Average = 36–48 months; Slow = 60+ months or never
- Steven classified as Fast Track (top 10–15%) based on L59→L62 in 50 months starting at age 22

**Key Corrections:**
- **Previous L63-at-37 was effectively a slow-track assumption.** Fixed.
- Fast track projects L63 at age 29–30 (not 37!)
- Fast track terminal level: L65 (~age 37–38), not L63
- Provided weighted probability model: 50% fast / 35% average / 15% slow for Steven

**Critical Learnings:**
1. **The L62 cliff is real but not universal.** ~35% of L62s reach L63; for fast-trackers like Steven, probability is ~95%.
2. **Deceleration is normal.** Steven's 11→18→21 month pattern is expected, not a red flag. Each level is harder.
3. **Comp divergence is dramatic.** Fast track (L65 terminal) vs. slow track (L63 terminal) = ~$7.6M lifetime difference, mostly from stock.
4. **Merit rates differ by track.** Fast-trackers get 5%/yr merit; average gets 3.5%; slow gets 2.5%. This compounds hugely over 35 years.
5. **Stock refreshes are the real wealth driver at L64+.** Annual refresh at L65 can be $70K–$130K/yr vs $15K–$29K at L62.
6. **Uncertainty grows exponentially.** Near-term (L63 timing) is ±20%. Long-term (L65 comp at age 50) is ±40%+. UI should show confidence bands.

**Output:** `.squad/decisions/inbox/saul-promotion-velocity.md` — comprehensive reference with numeric assumptions for Linus to implement three-track projection engine.

### FIRE Methodology Research (2026-04-26T21:30:55Z)

**Trigger:** Steven requested FIRE calculation research for the retirement page — Coast FIRE, Traditional FIRE, Lean/Fat FIRE tiers, formulas, and Seattle-specific defaults.

**Research Completed:**
1. **All four FIRE variants defined** with exact formulas: Traditional FIRE, Coast FIRE, Lean FIRE, Fat FIRE (+ Chubby tier).
2. **Coast FIRE formula established:** `FIRE Number / (1 + g)^n` using 7% nominal or 4.5% real return. Noted implementation trap of mixing nominal/real — must be consistent.
3. **Seattle tech couple spending tiers:** Lean $55K, Regular $100K, Chubby $130K (recommended default for Steven), Fat $160K+.
4. **Healthcare pre-Medicare:** $28K/yr unsubsidized ACA for couple in WA, healthcare inflation 3.5%, Medicare cliff at 65.
5. **Years-to-FIRE formula:** Iterative model (current portfolio + annual savings compounding to FIRE Number). Steven's 50% savings rate implies FIRE at ~age 44.
6. **Coast FIRE for Steven at Chubby target ($130K/yr, 3.5% SWR, FIRE = $3.71M):**
   - Age-50 target: Coast = ~$1.75M (real) — ~12–14 years away
   - Age-65 target: Coast = ~$683K (real) — ~8–10 years away
   - Current portfolio ~$95K — significant accumulation phase remaining
7. **Engine integration spec:** `calcFIRENumber()`, `calcCoastFIRENumber()`, `calcYearsToFIRE()`, `calcHealthcareCost()` — with coastFIREThreshold per year in timeline output.
8. **Key risks documented:** Sequence of returns, WA 7% capital gains on decumulation, healthcare uncertainty, lifestyle creep, Coast FIRE ≠ fully safe.

**Output:** `.squad/decisions/inbox/saul-fire-methodology.md` — full structured document with definitions, formulas, defaults, spending tiers, healthcare estimates, and engine integration spec.

**What Became Clear:**
- Coast FIRE is a milestone that fits naturally on the existing projection chart as a threshold line — all three velocity tracks can show when they cross it.
- Healthcare is the most underestimated early retirement cost: $28K/yr pre-Medicare is the right default, not the $0 people assume.
- WA state has no income tax but the 7% capital gains tax matters during decumulation if gains >$250K/yr — Roth accounts are the hedge.
- The recommended default FIRE target for Steven's profile is **Chubby FIRE at $130K/yr = $3.71M FIRE Number**.
