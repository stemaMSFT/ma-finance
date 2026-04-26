# Real Estate Scenarios: Scope & Guidance Approach
**Decision Owner:** Reuben (Real Estate Advisor)  
**Date:** 2026-04-25  
**Status:** Active  

---

## Context

Steven requested a comprehensive real estate scenario guide for the ma-finance app. The guide covers affordability, renovation trade-offs (specifically windows), buy vs. rent, market timing, and soft factors. This decision document captures the scope and guidance philosophy for implementation by Rusty (UI) and Linus (Engine).

---

## Scenario Scope (MVP)

### In Scope
1. **Home Affordability Calculator**
   - Dual-income household (Steven + wife)
   - Conservative income handling (variable bonuses, RSUs)
   - Down payment options (5%, 10%, 20%) with PMI modeling
   - Hidden costs (closing, repairs, moving)
   - Front-end/back-end ratio calculations + "comfort" thresholds
   - Outputs: max affordable price, monthly breakdown, total cash needed

2. **Renovation vs. Save Framework**
   - Windows case study (single-pane, double-pane, draft/fog condition)
   - Energy ROI calculation (payback period)
   - Resale impact (recovery % at different time horizons)
   - Quality of life assessment (comfort, noise, aesthetics)
   - Financing options (cash, HELOC, personal loan)
   - Generalized to: kitchen, bathroom, roof, HVAC
   - Decision tree output: "Do now," "Delay," "Not recommended"

3. **Buy vs. Rent Analysis**
   - 5- and 10-year total cost comparison
   - Break-even timeline calculation
   - Opportunity cost of down payment (if invested instead)
   - Tax benefits (mortgage interest deduction, property tax deduction)
   - Flexibility vs. stability framing
   - Seattle/Puget Sound market context (appreciation assumptions)

4. **Market Timing Context** (light touch, not a full simulator)
   - Interest rate sensitivity (±0.5% impact on affordability)
   - Appreciation rate variability (Seattle 3–4% baseline)
   - "Time in market beats timing the market" messaging
   - Scenario preview: "If rates rise 0.5%, break-even shifts to year X"

### Out of Scope
- International property / currency hedging
- Investment property mechanics (depreciation, passive income, 1031 exchanges)
- Vacation home or second property
- Co-buying with family members
- Emotional/psychological support for home selling
- Complex tax scenarios (requires tax professional)

---

## Guidance Philosophy

### Hard Numbers vs. Soft Factors

**Hard Numbers (App Calculates):**
- Monthly P&I, taxes, insurance, HOA
- Closing costs, moving costs
- Break-even timeline
- Energy ROI (window example)
- Resale recovery %
- Debt ratios, affordability thresholds

**Soft Factors (App Acknowledges, Doesn't Prescribe):**
- "Comfort" with neighborhood (slider/rating, not score)
- Quality of life from renovations (described, not quantified)
- Commute tolerance (flagged as tradeoff, not ranked)
- School district importance (conditional on user input: "Does this matter to you?")
- Risk appetite (whether to take 10% down + leverage or 20% down + safety)

**App Posture:** "Here's what we can calculate. Here's what we can't. Here's what matters but you decide."

---

## Specific Guidance Rules

### Windows (Steven's Reference Case)

**Energy ROI Framework:**
- Single-pane → Double-pane: Payback 20–75 years (weak ROI in Seattle)
- Double-pane → Triple-pane: Payback 120+ years (poor ROI everywhere)
- Repair drafty seals: Payback 2–8 years (good ROI)
- **App messaging:** "Energy ROI is weak in Seattle's mild climate. Consider replacement if comfort matters more than savings."

**Resale Impact Framework:**
- 1 year: 10–20% cost recovery
- 3 years: 15–30% recovery
- 5 years: 30–50% recovery
- 10+ years: 50–100% recovery (neutral to positive)
- **App messaging:** "Window replacement is a long-term value play. Short-term sellers should skip it."

**QOL Factors to Surface:**
- Noise reduction potential
- Drafts/cold spots elimination
- Condensation/fogging issues
- Cleaning/operation ease
- **App messaging:** "New windows improve comfort significantly. Pure energy ROI doesn't justify it, but quality of life often does."

### Affordability: Comfortable vs. Max

**Rule:**
- **Comfortable threshold:** 24% front-end, 32% back-end (allows 20% income drop without hardship)
- **Max threshold:** 28% front-end, 36% back-end (bank's limit, risky for variable income)
- **Red flag:** > 36% back-end (not recommended)

**For Steven (Dual Income, Variable):**
- Base income only (conservative): Calculate at 24%/32%
- Bonus + RSU midpoint: Recalculate at 26%/34%
- With full upside: Show max at 28%/36%
- **App shows all three** with labels ("Conservative," "Mid-range," "Stretch")

**App Messaging:**
- "At comfortable threshold: You can weather a 20% income drop without panic"
- "At stretch threshold: You're fine until something changes. Plan for that."
- "Over stretch threshold: This is risky unless income is extremely stable"

### Dual Income Considerations

**Rule:**
- At least one income should cover the mortgage + property tax + insurance alone
- This ensures household survives if one person loses job/becomes unable to work
- Calculate max affordable on single income as a backstop

**App Messaging:**
- "We designed this for dual incomes. As a safety check, can either of you cover the mortgage alone if needed?"
- Show single-income affordability as a separate line ("Household resilience check")

### Financing Renovations: Hierarchy

**Rule of Thumb:**
1. **Cash:** First choice (no interest, no risk)
2. **HELOC:** Second choice (lowest rate, flexible, but rate can adjust)
3. **Home equity loan:** Third choice (fixed rate, higher than HELOC, but stable)
4. **Personal loan:** Fourth choice (unsecured, higher rate 8–15%, quick)
5. **Credit card:** **Avoid** (18–24% rate, terrible for renovations)
6. **0% intro cards:** Only for small projects ($5k–15k) with discipline to pay before interest kicks in

**App Messaging:**
- "HELOC or home equity loan if you have equity. Personal loan if not."
- "Credit cards make no financial sense for home renovations."

### Buy vs. Rent: Break-Even

**Default Assumption for Seattle:**
- 3.5% appreciation annually (baseline)
- 4% annual rent increase (historical average, Seattle higher than national)
- 5% total annual ownership costs (taxes + insurance + maintenance + HOA)
- Break-even: 5–6 years (typical for this market)

**App Messaging:**
- "If you're staying fewer than 5 years, expect break-even or a small loss financially"
- "But non-financial factors matter: stability, control, not moving"
- "Rents in Seattle rise ~3–5% annually, so long-term rent costs compound"

### Market Timing

**Rule:**
- Timing beats long-term holding about 0% of the time (nearly impossible to get right)
- Life stage and job stability matter far more than market conditions
- Interest rate swings of ±1% are normal; don't delay 5-year purchase for a possible 0.5% rate drop

**App Messaging:**
- "Time in the market beats timing the market"
- "Over 7+ years, small rate swings and market timing fade in importance"
- "Buy when your life stage is ready (job stability, savings, time horizon), not when you think rates are perfect"

---

## App Warnings: When to Escalate to Professional

**Tax Impact**
- Deduction eligibility depends on income, filing status, total deductions
- Rental property tax rules are complex
- Message: "Consult a tax professional for your specific tax impact."

**Loan Qualification**
- Credit score, recent job changes, self-employment income, debt-to-income limits
- Message: "This calculator assumes you qualify for standard loans. Confirm with a lender."

**Transaction Mechanics**
- Inspection issues, appraisal problems, title issues, local regulations
- Message: "Work with a real estate attorney and inspector for transaction details."

**Neighborhood Specifics**
- Local zoning, HOA covenants, school district boundaries, transit plans
- Message: "Verify local factors (schools, zoning, transit) before committing."

**Soft Factors (Can't Quantify)**
- Which neighborhood feels right for family
- Whether a long commute is livable
- Investment returns vs. home purchase (personal risk tolerance)
- Message: "Some factors can't be modeled. Trust your judgment on these."

---

## Outputs: MVP Feature Set

### Affordability Calculator
- **Inputs:** Dual incomes, debts, down payment %, rate, term
- **Outputs:** Max affordable price, monthly breakdown, cash needed, ratio %, warnings
- **Guidance:** Comfortable vs. stretch thresholds, hidden costs, PMI explanation

### Renovation Decision Tool
- **Inputs:** Renovation type, cost, condition, timeline, planned stay
- **Outputs:** Energy ROI, resale impact %, financing options, recommendation
- **Guidance:** When to do, when to delay, when to skip, financing choices

### Buy vs. Rent Comparison
- **Inputs:** Home price, down %, rent cost, holding period, appreciation rate
- **Outputs:** Total 5/10-year cost, break-even timeline, tax benefit, flexibility framing
- **Guidance:** Break-even expectations, Seattle market context, when each makes sense

### Market Timing Context (Info Only, Not a Simulator)
- **Inputs:** None (reference only)
- **Outputs:** Rate sensitivity examples, appreciation variability, messaging
- **Guidance:** "Timing is hard, life stage matters more"

---

## Not in MVP (Future Iterations)

- Detailed neighborhood evaluation tool (schools, walkability, commute mapping)
- Long-term wealth projection (home equity vs. invested alternatives over 20+ years)
- Refinancing calculator (rate drops, timeline for break-even on costs)
- Investment property rental calculator (depreciation, passive income, 1031 exchanges)
- Vacation home / second property analysis
- Interactive rate/appreciation sensitivity sliders

---

## Tone & Voice

**Principles:**
- Honest about limits ("Energy ROI is weak," "Timing is hard," "This is an estimate")
- Practical, not prescriptive (show tradeoffs, help user decide)
- Human-centered (acknowledge comfort, lifestyle, security matter)
- Seattle/Puget Sound grounded (use local market context, not national averages)
- Accessible (avoid jargon, explain ratios, avoid complex tax mechanics in main UI)

**Examples of Good App Messaging:**
- ✓ "At 28% front-end, you're at the bank's max. That's fine for stable income, risky if income is variable."
- ✓ "Windows have poor energy ROI in Seattle (20+ year payback). Consider replacement if comfort matters more."
- ✓ "Breaking even on buying vs. renting takes 5–6 years here. If you're staying less, rent might be cheaper."
- ✓ "HELOC rates are typically 1–2% lower than personal loans. Check with your bank."

**Examples of Bad App Messaging:**
- ✗ "Don't buy now, wait for rates to drop." (Timing, can't predict)
- ✗ "Windows MUST be replaced immediately." (Prescriptive, not true)
- ✗ "Energy savings of $250/year justify $12,000 window replacement." (Math without context)

---

## Decision Ratified By

- **Reuben:** Real Estate Advisor (owner)
- **Pending:** Rusty (UI Dev) and Linus (Engine Dev) for feasibility review

---

## Appendix: Quick Reference for Calculations

### Affordability Thresholds
| Category | Front-End % | Back-End % | Use Case |
|---|---|---|---|
| Conservative | 24% | 32% | Safety, income variability |
| Comfortable | 26% | 34% | Typical dual-income Seattle |
| Stretch | 28% | 36% | Bank max, stable income only |

### Window ROI (Seattle Market)
| Upgrade | Cost | Annual Savings | Payback |
|---|---|---|---|
| Single-pane → Double-pane | $8–15k | $200–400 | 20–75 yrs ❌ |
| Repair seals | $200–800 | $50–150 | 2–8 yrs ✓ |

### Break-Even Buy vs. Rent (Seattle)
- **Standard:** 5–6 years
- **Fast market:** 3–5 years
- **Slow market:** 7–10 years
- **Default assumption:** 3.5% appreciation, 4% rent increase, 5% ownership costs

### Financing Renovation Hierarchy
1. Cash
2. HELOC (Prime + 0–2%)
3. Home equity loan (6–8%)
4. Personal loan (8–15%)
5. ❌ Credit card (18–24%, avoid)
