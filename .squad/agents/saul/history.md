# Saul — History (Summarized)

## Project Context
- **App:** ma-finance — personal finance scenario planner for Steven and his wife
- **Stack:** React + TypeScript
- **User context:** Steven is a Microsoft employee (L62, age 27). Compensation numbers entered manually.

## Key Achievements

### Financial Data Compilation & Math Audit (April 25-26, 2026)
- Researched 2026 IRS limits, tax brackets, Social Security, mortgage rates, Seattle property taxes, renovation ROI
- Conducted full financial audit: Found 2 critical bugs in mockEngine.ts (401k match formula), 7 warnings (IRS limit stale, ESPP formula, DTI, etc.), 17 items verified correct
- **Critical Finding:** Linus's new engine (compensation.ts, retirement.ts, housing.ts) is mostly correct. Bugs concentrated in legacy mockEngine.ts which UI currently uses. Recommendation: wire UI to new engine.
- **Sources:** IRS.gov, SSA.gov, Freddie Mac, Zillow, King County Assessor, Cost vs. Value, BLS, SHRM, Morningstar, Vanguard

### Retirement Projection Assumptions (April 26, 2026)
- Microsoft compensation model L59–L65+: promotion frequency 1.0–1.5yr early career, slowing to 2–3yr at L63+; terminal comp $195k L63 with merit to $617k by age 65
- Lifecycle glide path: 90/10 equities (age 30) → 30/70 (age 60+); nominal returns 8.0% (age 30–40) → 4.0% (age 60–65); base case 6.5%
- 401k: $24,500 limit (2026); 50% employer match up to $12,250/yr; projected age-65 balance $3.6M
- Social Security: estimated $45,600/yr at FRA 67; break-even delays to age 80–82; base case delay to 70 if portfolio sufficient
- Safe Withdrawal Rate: 3.5% (vs. traditional 4%); replacement ratio target 75% pre-retirement income
- Scenario modeling: Conservative $2.5M/age-65, Base $3.6M, Optimistic $4.8M with 92–98% success rates

### Three-Track Promotion Velocity Model (April 26, 2026)
- Deep-dive research across 11 sources (Levels.fyi, Blind, Promotions.fyi, leaked pay docs)
- **Key finding:** L62→L63 is primary career cliff; ~60–70% of L62s never reach L63 at Microsoft
- Fast track L62→L63 = 24–30 mo; Average = 36–48 mo; Slow = 60+ mo or never
- Steven classified Fast Track (top 10–15%) based on L59→L62 in 50 months
- **Correction:** L63-at-37 was slow-track assumption. Fast track projects L63 at age 29–30, terminal L65 at ~37–38
- Weighted model: 50% fast / 35% average / 15% slow
- **Key learnings:** L62 cliff is real but not universal; merit rates differ by track (5%/fast, 3.5%/avg, 2.5%/slow); stock refreshes are wealth driver at L64+; uncertainty grows exponentially

### FIRE Methodology Research (April 26, 2026)
- Four FIRE variants defined: Traditional FIRE, Coast FIRE, Lean FIRE, Fat FIRE
- Coast FIRE formula: `FIRE Number / (1 + g)^n` (consistency warning: nominal vs. real)
- Seattle tech couple spending tiers: Lean $55K, Regular $100K, Chubby $130K (recommended default), Fat $160K+
- Healthcare pre-Medicare: $28K/yr unsubsidized ACA; Medicare cliff at 65; healthcare inflation 3.5%/yr
- Steven at Chubby target ($130K/yr, 3.5% SWR, FIRE = $3.71M): Age-50 Coast ~$1.75M; Age-65 Coast ~$683K
- **Key risk:** WA 7% capital gains tax on decumulation (if gains >$250K/yr); Roth accounts are hedge
- Engine spec ready: `calcFIRENumber()`, `calcCoastFIRENumber()`, `calcYearsToFIRE()`, `calcHealthcareCost()`

### Learnings Summary
- **Promotion is critical:** L62→L63 adds $40k+ annual comp, compounding to ~$500k+ lifetime earnings
- **Market return dominates:** 1% variance = ±$600k at age 65
- **3.5% SWR is sweet spot:** Conservative for 30-year horizon, allows inflation growth
- **Microsoft-specific context matters:** Generic SWR models miss L-level-specific salary progression
- **Annual recalibration required:** IRS limits, tax brackets, SS rules change yearly (January refresh recommended)

## Status: All research outputs documented in decisions.md. Engine integration specs ready for Linus.
- The recommended default FIRE target for Steven's profile is **Chubby FIRE at $130K/yr = $3.71M FIRE Number**.
