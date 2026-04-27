# FIRE Methodology — Research Brief
**Author:** Saul (Finance Analyst)  
**Date:** 2026-04-26  
**Requested by:** Steven  
**Purpose:** Foundational research for the retirement page FIRE calculator. Exact formulas for Linus + defensible defaults for a Seattle tech couple (Steven, age 27, L62 Microsoft, combined ~$305K).

---

## 1. FIRE Variants — Clear Definitions

### 1.1 Traditional FIRE (Zero Income / Full Financial Independence)

You have accumulated enough portfolio assets that investment returns alone sustain your spending indefinitely — you never need earned income again.

**Key metric:** The FIRE Number (nest egg required at retirement day).

**Formula:**
```
FIRE Number = Annual Expenses / Safe Withdrawal Rate (SWR)
```

**Examples at 3.5% SWR (team's established default):**

| Annual Spending | FIRE Number |
|----------------|-------------|
| $60,000 | $1,714,286 |
| $80,000 | $2,285,714 |
| $100,000 | $2,857,143 |
| $120,000 | $3,428,571 |
| $150,000 | $4,285,714 |
| $180,000 | $5,142,857 |

The classic 4% rule (Bengen, 1994) applies a 40-year horizon. For early retirees with 40–50 year horizons, 3.5% is the appropriate default (team decision already established). If income drops sharply post-FIRE (no Social Security yet, no Medicare), the lower withdrawal rate provides crucial buffer.

**The 4% rule variations:**

| SWR | FIRE Multiple | Use Case |
|-----|--------------|----------|
| 3.0% | 33.3× | Ultra-conservative; 50+ year horizon or fat lifestyle |
| 3.5% | 28.6× | **Team default** — 40-year horizon, moderate portfolio |
| 4.0% | 25× | Classic rule; fine for 60–65 traditional retirement |
| 4.5% | 22.2× | Aggressive; assumes flexible spending + SS backstop |

**How it differs from Coast FIRE:** Traditional FIRE requires a *completed* nest egg. Coast FIRE requires a *sufficient intermediate milestone*. Coast says "we can stop adding fuel"; Traditional says "we can stop working."

---

### 1.2 Coast FIRE

The portfolio value you need *right now* so that even if you stop contributing entirely, compounding growth alone will carry the portfolio to your FIRE Number by your target retirement age.

**Definition:** You've "Coasted" when: `Current Portfolio × (1 + g)^n = FIRE Number`

**Formula:**
```
Coast FIRE Number = FIRE Number / (1 + g)^n
```

Where:
- `FIRE Number` = Annual Expenses / SWR  
- `g` = expected annual real (inflation-adjusted) growth rate  
- `n` = years from now to target retirement age  

**Why this formula works:** You're discounting the future FIRE Number back to today at the expected growth rate. If your portfolio equals or exceeds the Coast number, contributions are optional — growth gets you there.

**Standard growth rate assumptions for coasting:**
- **Nominal return (recommended for this calc):** 7% — accounts for a diversified portfolio without inflation adjustment. Linus can expose this as a parameter.
- **Real return (inflation-adjusted):** 4.5%–5.0% (subtract 2.5% inflation from 7% nominal). Using real rates means the FIRE Number is also in today's dollars, which is cleaner for a consistent UI.
- **Conservative coasting assumption:** 6% nominal / 3.5% real — appropriate if the couple wants safety margin in the Coast number itself.

**Recommendation for Linus:** Use **7% nominal** for Coast FIRE calculation (matches the existing moderate return assumption baseline). The FIRE Number should also be expressed in nominal terms (today's dollars × inflation factor to retirement year) for full consistency, OR use real rates throughout. Mixing is the main implementation trap.

**How Coast FIRE interacts with the existing projection engine:**
- The engine already has `projectRetirementTimeline()` which produces a year-by-year portfolio value.
- Coast FIRE is simply a horizontal threshold line on that chart: `fireNumber / (1 + g)^(retirementAge - currentAge)`.
- As each year passes, `n` decreases and the Coast number *rises* toward the FIRE Number. The chart can show: "You will hit Coast FIRE at age X" — the year the portfolio curve crosses the declining Coast threshold.
- The velocity model's three tracks (Fast/Average/Slow) each produce different portfolio curves. Show all three crossing the Coast FIRE line at different ages.

---

### 1.3 Lean FIRE

Retirement funded by a *minimal* budget — covering true essentials only. Often requires geographic arbitrage (leaving high-cost cities), highly optimized spending, or both.

**Definition:** Annual expenses below $50,000/yr for a couple (in today's 2026 dollars).

**Seattle-specific context:** Lean FIRE in Seattle proper is functionally impossible for a couple unless housing is owned free-and-clear. The realistic Lean FIRE scenario involves leaving the Seattle metro area or moving somewhere with dramatically lower COL.

| Spending Level | Annual | Monthly | Notes |
|---------------|--------|---------|-------|
| Lean FIRE floor | $45,000 | $3,750 | Outside Seattle, no mortgage, low lifestyle |
| Lean FIRE ceiling | $60,000 | $5,000 | Paid-off home in lower COL area; frugal but comfortable |

**FIRE Number at 3.5% SWR:** $1.29M – $1.71M

**Who targets this:** Extreme early retirement (40s), geographic flexibility, minimalist lifestyle. Not aligned with Steven's profile unless a dramatic lifestyle change is intended.

---

### 1.4 Regular / "Normal" FIRE

Middle-ground: comfortable lifestyle, probably in or near Seattle, maintaining quality of life without extreme sacrifice.

| Spending Level | Annual | Monthly | Notes |
|---------------|--------|---------|-------|
| Modest Regular | $80,000 | $6,667 | Paid-off home, reasonable travel, no mortgage |
| Standard Regular | $100,000 | $8,333 | Moderate lifestyle in Seattle suburbs |
| Upper Regular | $120,000 | $10,000 | Good lifestyle with regular travel, discretionary spending |

**FIRE Number at 3.5% SWR:** $2.29M – $3.43M

**This is the most realistic FIRE target for Steven's profile.** If the couple leaves paid work at, say, age 42–47, a $100K/yr lifestyle with a paid-off home (likely in a lower COL suburb or adjacent city) is achievable.

---

### 1.5 Fat FIRE

Retirement with a *high* lifestyle — equivalent to or better than current pre-retirement spending. No material sacrifices, regular travel, potentially staying in Seattle or a similarly expensive market.

| Spending Level | Annual | Monthly | Notes |
|---------------|--------|---------|-------|
| "Chubby" FIRE | $130,000 | $10,833 | Upper-comfortable Seattle lifestyle |
| Fat FIRE | $160,000 | $13,333 | Full Seattle lifestyle with travel and discretionary spending |
| Ultra Fat FIRE | $200,000+ | $16,667+ | Business class travel, luxury housing, full optionality |

**FIRE Number at 3.5% SWR:** $3.71M – $5.71M+

**Seattle tech couple context:** A Microsoft L62 + senior frontend dev couple spending $250K–$300K annually during peak earning years will feel significant lifestyle downgrade below $130K–$150K in retirement. Fat FIRE is likely the target if they want to maintain current lifestyle.

**Steven's approximate current household spending (2026 estimate):**  
- Gross income ~$305K  
- After tax, ESPP, 401k: take-home ~$170K–$185K  
- Mortgage/housing: $30K–$45K/yr (rent or mortgage)  
- Total lifestyle spend: probably $100K–$140K/yr  
- Implied Fat FIRE target: **$120K–$150K/yr in today's dollars**

---

## 2. Key Formulas for Linus to Implement

### 2.1 FIRE Number
```typescript
// All values in consistent dollars (either all real or all nominal)
function calcFIRENumber(annualExpenses: number, swr: number): number {
  return annualExpenses / swr;
}

// Example: $120,000 / 0.035 = $3,428,571
```

### 2.2 Coast FIRE Number
```typescript
function calcCoastFIRENumber(
  fireNumber: number,
  growthRate: number,    // e.g., 0.07 for 7% nominal
  yearsToRetirement: number
): number {
  return fireNumber / Math.pow(1 + growthRate, yearsToRetirement);
}

// Example: $3,428,571 / (1.07)^20 = $887,816
```

**Coast FIRE for Steven's base case:**
- Target retirement age: 50 (FIRE scenario) → n = 23 years
- FIRE Number at $120K/yr, 3.5% SWR: $3,428,571
- Coast at 7% nominal: $3,428,571 / (1.07)^23 = **$716,040**
- Coast at 6% nominal: $3,428,571 / (1.06)^23 = **$897,565**
- Current portfolio: ~$95K → Coast FIRE is still ~7–9.5 years away depending on rate assumption

### 2.3 Years to FIRE (Time to Financial Independence)
```typescript
// Based on future value of growing annuity + existing portfolio
// Solve: portfolio × (1+r)^n + savings × [(1+r)^n - 1] / r = fireNumber
// Numerically (iterate or use logarithm form):

function calcYearsToFIRE(
  currentPortfolio: number,
  annualSavings: number,
  growthRate: number,    // annual return rate, e.g. 0.07
  fireNumber: number
): number {
  // Binary search or Newton's method; or closed-form approximation:
  // n = log(fireNumber / currentPortfolio) / log(1 + r)  
  //   → only if savings = 0 (pure coasting)
  // General case: iterate by year
  let portfolio = currentPortfolio;
  for (let year = 1; year <= 100; year++) {
    portfolio = portfolio * (1 + growthRate) + annualSavings;
    if (portfolio >= fireNumber) return year;
  }
  return Infinity; // savings rate too low
}
```

**Savings rate as a FIRE predictor (the Shockingly Simple Math):**

At 7% nominal return, assuming spending = 100% – savings rate:

| Savings Rate | Years to FIRE |
|-------------|--------------|
| 10% | ~43 years |
| 25% | ~32 years |
| 40% | ~22 years |
| 50% | ~17 years |
| 60% | ~12.5 years |
| 70% | ~8.5 years |

Steven's current effective savings rate (after tax, including ESPP + 401k): roughly 45–55% of take-home. At 50% savings rate: ~17 years from now → FIRE at ~age 44.

### 2.4 Annual Expense Projection — Retirement Spending

**Rule of thumb: 70–80% income replacement** is the conventional estimate. But for early FIRE, it's more accurate to project from *spending*, not income:

```typescript
function projectRetirementExpenses(
  currentAnnualSpending: number,
  yearsToRetirement: number,
  inflationRate: number = 0.025
): number {
  // In nominal terms (for nominal FIRE number)
  return currentAnnualSpending * Math.pow(1 + inflationRate, yearsToRetirement);
}
```

**Adjustments to apply:**
- **Remove:** Mortgage payments (if paid off), 401k contributions, FICA/payroll taxes, work-related expenses (~10–15% of spending)
- **Add:** Healthcare premium (see Section 3), increased leisure/travel, potential long-term care costs
- **Net effect:** Typically 70–85% of gross income if home is paid off; 85–100% if still renting or carrying mortgage

**For Steven's profile:**
- Pre-FIRE gross spend: ~$120K–$140K/yr
- Remove mortgage/rent if owned free-clear: –$30K
- Remove FICA/401k contributions: –$15K
- Add healthcare: +$25K–$35K/yr (see below)
- Add travel/leisure increase: +$10K–$20K
- **Net retirement spending estimate: $110K–$145K/yr (today's dollars)**

---

## 3. Healthcare Costs for Early Retirees (Pre-Medicare)

This is the most underestimated FIRE expense. Before Medicare eligibility at age 65, early retirees must source their own health insurance.

### 3.1 ACA Marketplace (Primary Option)
For a couple, unsubsidized ACA premiums in Washington state (King County):

| Plan Tier | Monthly Premium (2026 est.) | Annual |
|-----------|---------------------------|--------|
| Bronze (high deductible) | $800–$1,000 | $9,600–$12,000 |
| Silver | $1,100–$1,400 | $13,200–$16,800 |
| Gold | $1,400–$1,800 | $16,800–$21,600 |

**At high MAGI:** No ACA subsidies apply until MAGI < 400% FPL (~$90K for a couple in 2026). High-income early retirees pay full unsubsidized premiums.

**ACA subsidy management (advanced FIRE strategy):** If the couple can engineer MAGI below ~$75K (Roth conversions laddered carefully, capital gains managed, income from dividends/bonds), subsidies kick in dramatically. This is a real optimization for Lean/Regular FIRE but irrelevant for Fat FIRE.

### 3.2 Total Annual Healthcare Budget for Early Retirees

| Scenario | Annual Healthcare Cost | Notes |
|----------|----------------------|-------|
| ACA Gold (unsubsidized) | $20,000–$25,000 | Premiums only, King County WA |
| ACA Gold + out-of-pocket | $25,000–$35,000 | Include deductibles/copays/dental/vision |
| ACA with subsidies (managed income) | $5,000–$12,000 | Requires MAGI management |
| Post-Medicare (age 65+) | $8,000–$15,000 | Medicare Part B/D + Medigap premiums |

**Recommended default for Linus:** `$28,000/yr` healthcare for a couple retiring at 45–50, with healthcare inflation at `3.5%/yr` (team's established figure). This is pre-Medicare.

### 3.3 Healthcare as % of Retirement Budget

| Retirement Age | Healthcare / Total Spending |
|---------------|---------------------------|
| Age 45–54 | 20–28% of spending |
| Age 55–64 | 22–30% of spending |
| Age 65+ (Medicare) | 8–15% of spending |

**Implementation note for Linus:** Healthcare costs should have a "cliff" reduction at age 65 in the retirement expense model. Pre-65: unsubsidized ACA cost; post-65: Medicare + Medigap estimate.

---

## 4. Reasonable Defaults for a Seattle Tech Couple

### 4.1 FIRE Number Defaults

| FIRE Tier | Annual Spending | FIRE Number (3.5% SWR) | Lifestyle Description |
|-----------|----------------|----------------------|----------------------|
| Lean FIRE | $55,000 | $1,571,429 | Frugal, paid-off home, left Seattle |
| Regular FIRE | $100,000 | $2,857,143 | Comfortable, suburban WA, moderate travel |
| **Chubby FIRE** | $130,000 | $3,714,286 | **Likely target for Steven's profile** |
| Fat FIRE | $160,000 | $4,571,429 | Full Seattle lifestyle maintained |
| Ultra Fat FIRE | $200,000 | $5,714,286 | No compromises, any geography |

### 4.2 Growth Rate Assumptions (Consistent with Team Decisions)

| Use | Rate | Rationale |
|----|------|-----------|
| Coast FIRE calculation (nominal) | 7.0% | Conservative nominal; matches moderate portfolio |
| Coast FIRE (real, inflation-adj) | 4.5% | 7% – 2.5% inflation |
| Time-to-FIRE projection | 7.0% nominal | Consistent with engine's moderate scenario |
| Inflation (general) | 2.5% | Team-established default |
| Healthcare inflation | 3.5% | Team-established, faster than CPI |

### 4.3 Steven's Specific Coast FIRE Numbers (Today's Dollars, Real Returns 4.5%)

Using **$130K/yr spending** (Chubby FIRE target), **3.5% SWR**, **4.5% real return**:
- FIRE Number: **$3,714,286**

| Target Retirement Age | Years Remaining (from 27) | Coast FIRE Number |
|----------------------|--------------------------|-------------------|
| Age 40 | 13 years | $3,714,286 / (1.045)^13 = **$2,210,000** |
| Age 45 | 18 years | $3,714,286 / (1.045)^18 = **$1,748,000** |
| Age 50 | 23 years | $3,714,286 / (1.045)^23 = **$1,382,000** |
| Age 55 | 28 years | $3,714,286 / (1.045)^28 = **$1,093,000** |
| Age 60 | 33 years | $3,714,286 / (1.045)^33 = **$864,000** |
| Age 65 | 38 years | $3,714,286 / (1.045)^38 = **$683,000** |

**Current portfolio: ~$95K.** The Coast FIRE milestone for a 65-retirement target (~$683K) is approximately 8–10 years away at current savings velocity. At 45-retirement target, Coast FIRE (~$1.75M) is approximately 12–14 years away.

### 4.4 Savings Rate Assessment

Steven's household:
- Combined income: ~$305K gross
- Total tax burden: ~$80K–$90K (federal + FICA; no WA state income tax)
- Total retirement savings (401k × 2, ESPP, after-tax): ~$60K–$80K/yr
- Additional taxable savings capacity: ~$30K–$50K/yr
- **Effective savings rate: ~45–55% of after-tax income**

At 50% savings rate and 7% nominal return → **FIRE in approximately 17 years → age 44**. This is a realistic early retirement scenario.

---

## 5. How This Integrates with the Existing Projection Engine

### 5.1 New Functions Linus Should Add

```typescript
// 1. Core FIRE number
calcFIRENumber(annualExpenses: number, swr: number): number

// 2. Coast FIRE threshold
calcCoastFIRENumber(fireNumber: number, growthRate: number, yearsToRetirement: number): number

// 3. Years to FIRE from current position
calcYearsToFIRE(currentPortfolio: number, annualSavings: number, growthRate: number, fireNumber: number): number

// 4. Age when Coast FIRE is achieved (scan timeline)
// Returns the year/age in projectRetirementTimeline() output where
// yearlyPortfolio >= coastFIRENumber(fireNumber, g, retirementAge - currentAge)

// 5. Healthcare cost projection with Medicare cliff
calcHealthcareCost(currentAge: number, targetYear: number, baseAnnualCost: number, healthcareInflation: number): number
```

### 5.2 What the Timeline Output Needs

Each `YearlyProjection` row in `projectRetirementTimeline()` should (eventually) include:
- `coastFIREThreshold: number` — the Coast FIRE number for that year (decreases as retirement approaches)
- `isCoastFIREAchieved: boolean` — true once portfolio ≥ coastFIREThreshold
- `fireNumber: number` — the full FIRE number (in nominal or real terms, consistent)
- `healthcareCost: number` — projected healthcare for that year with Medicare cliff at 65

### 5.3 Three-Track Coast FIRE Visualization

The three velocity tracks (Fast/Average/Slow) each produce different portfolio trajectories. The Coast FIRE threshold line is the same regardless of track. This creates a clean "three trajectories converging on one threshold" chart:
- Fast track hits Coast FIRE earliest (portfolio grows faster due to higher comp → higher contributions)
- Average and Slow tracks hit Coast FIRE later
- All three eventually hit the full FIRE Number at retirement

**Suggested UI:** On the Projection tab, overlay the Coast FIRE threshold as a dashed horizontal line at each age. Annotate the age at which each track's portfolio crosses it.

---

## 6. FIRE Variant Summary Table

| Variant | Definition | Formula | Steven's Number (Chubby target) |
|---------|-----------|---------|--------------------------------|
| **FIRE Number** | Full nest egg at retirement | expenses / SWR | $3.71M |
| **Coast FIRE** | Stop contributing now, coast to FIRE | FIRE # / (1+g)^n | $716K–$1.75M (age-dependent) |
| **Lean FIRE** | Minimal lifestyle portfolio | $55K / 0.035 | $1.57M |
| **Regular FIRE** | Comfortable lifestyle portfolio | $100K / 0.035 | $2.86M |
| **Chubby FIRE** | Upper-comfortable portfolio | $130K / 0.035 | $3.71M |
| **Fat FIRE** | Full tech-couple lifestyle | $160K / 0.035 | $4.57M |

---

## 7. Recommended App Defaults (Ready for Linus)

```typescript
const FIRE_DEFAULTS = {
  // Growth rates
  coastGrowthRateNominal: 0.07,          // 7% — moderate portfolio nominal
  coastGrowthRateReal: 0.045,            // 4.5% — after 2.5% inflation
  safeWithdrawalRate: 0.035,             // 3.5% — team decision
  
  // Healthcare
  healthcareAnnualCouplePreMedicare: 28_000,   // $28K/yr unsubsidized ACA
  healthcareAnnualCouplePostMedicare: 12_000,  // $12K/yr Medicare + Medigap
  medicareEligibilityAge: 65,
  healthcareInflationRate: 0.035,              // 3.5% — faster than CPI

  // Spending tiers (today's 2026 dollars, Seattle couple)
  leanFIREAnnualSpend: 55_000,
  regularFIREAnnualSpend: 100_000,
  chubbyFIREAnnualSpend: 130_000,
  fatFIREAnnualSpend: 160_000,
  
  // Steven's suggested default (Chubby — most likely target)
  defaultFIREAnnualSpend: 130_000,
  defaultFIRETargetAge: 50,
  
  // Income replacement (pre-FIRE spending as % of gross income)
  incomeReplacementRatio: 0.75,          // 75% of gross as starting estimate
};
```

---

## 8. Key Risks and Caveats to Surface in the UI

1. **Sequence of returns risk:** A market crash early in FIRE (ages 40–50) is far more damaging than one at age 60. Coast FIRE does not fully protect against this — it assumes consistent average returns.

2. **Healthcare cliff at 65:** Pre-Medicare healthcare is the biggest FIRE budget wildcard. $28K is a defensible estimate for unsubsidized WA, but actual costs vary ±50%.

3. **WA capital gains tax:** WA's 7% capital gains tax on gains >$250K/yr matters during decumulation if selling appreciated assets. Roth accounts and tax-loss harvesting mitigate.

4. **Lifestyle creep risk:** Current spending during high-earning years often understates retirement expectations. The app should prompt Steven to think about whether current lifestyle (restaurants, travel, etc.) scales at or above inflation.

5. **Coast FIRE ≠ done:** Once Coast FIRE is achieved, contributions are optional — but market volatility can erode the portfolio below the threshold. A 20–30% drawdown shortly after hitting Coast FIRE puts the goal at risk. Consider a "buffer" (e.g., 110% of Coast number before declaring achieved).

6. **Social Security integration:** The FIRE Number should be netted against present value of expected SS benefits. If claiming SS at 62 yields ~$42K/yr, the portfolio only needs to fund `(target_spend - SS_income)`. This dramatically reduces the FIRE Number for people who don't retire extremely early. For age-45 FIRE, SS is 17–22 years away — modest NPV effect. For age-55 FIRE, it matters significantly.

---

**Sources:**
- Bengen (1994): original 4% rule research
- Kitces (updated SWR research, 2012–2024)
- Morningstar 2023 Safe Withdrawal Rate study (3.3% for 30-year, 3.0% for 40-year)
- ERN (Early Retirement Now): extended SWR analysis for 40–60 year horizons
- Mr. Money Mustache: Shockingly Simple Math Behind Early Retirement (savings rate table)
- Kaiser Family Foundation: ACA premium data by state/county (2025–2026)
- WA OIC (Office of the Insurance Commissioner): WA-specific ACA plan data
- Levels.fyi / Blind: Seattle tech couple income and spending patterns
- Team-established decisions: SWR 3.5%, inflation 2.5%, healthcare inflation 3.5%, market return 6–7%
