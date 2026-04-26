# Real Estate Scenario Guide
## For ma-finance Application Development

This guide defines the real estate scenarios the app should present to users. It covers the math, the soft factors, and the guidance that Rusty (UI) and Linus (Engine) will implement.

---

## 1. Home Affordability Calculator

### What the Bank Will Lend vs. What's Actually Comfortable

**The Standard Rules (The Floor)**
- **Front-end ratio:** 28% of gross household income for housing costs (mortgage + property tax + insurance + HOA)
- **Back-end ratio:** 36% of gross household income for all debt (mortgage + property tax + insurance + HOA + car loans + student loans + credit cards)
- These are lending guidelines, not comfort guidelines

**Why These Rules Miss the Real Story**

The 28/36 rules assume:
- Stable, single income
- No emergency savings needed
- All borrowing is equally risky (it's not — student loans ≠ credit card debt)
- No life changes ahead

**For Steven + Wife (Dual High Income, Variable)**
- **Both salaries matter** — but handle variable income conservatively
  - Base salary: 100% of income
  - Bonuses: Count at 0% first year, 50% by year 2, 100% by year 3 (conservative approach)
  - RSUs: Count as vested + expected for 12 months ahead (market dependent)
  - This gives a "worst-case" comfort number
- **At least one income should cover the mortgage alone** — if one person becomes unable to work, the household survives
- **Consider W-2 income only** — no rental income, side income unless it's been 2+ years and documented

**The Comfortable Number (Not the Max)**

Ask users: "How would you feel if both incomes dropped 20%?" If they'd panic, they're at max, not comfortable.

- **Comfortable affordability:** 24% front-end, 32% back-end (lower than banks allow, gives buffer)
- **Stretch affordability:** 28% front-end, 36% back-end (bank's max, risky if income is variable)
- **Emergency mode:** > 36% (red flag — not recommended for dual-income households with growth trajectory)

**Down Payment Sweet Spots**

| Down Payment | PMI? | Key Trade-off | When to Choose |
|---|---|---|---|
| **20%** | No | Requires more cash up front | High income, substantial savings, want to minimize long-term cost |
| **10-15%** | Yes (~0.5–1% annually) | Balance of cash and leverage | Most dual-income couples; can invest the saved down payment |
| **5%** | Yes (~1–1.5% annually) | Maximize leverage, lowest cash needed | First-time buyers, prefer liquidity, plan to stay 7+ years |
| **< 5%** | Possibly (depends on program) | Very high leverage, risky | Not recommended for Steven's situation (reduces safety margin) |

**The PMI Math for Steven**
- Paying 10% down instead of 20% on a $600k home = $60k difference
- PMI cost: ~$400–500/month for 10% down (until 20% equity reached, typically 7–10 years)
- Total PMI paid: ~$42k–60k
- But: That $60k saved could be invested at 7–8% annual return = ~$105k in 10 years
- **Rule:** If you can earn > PMI cost elsewhere, pay the PMI and keep your dry powder

**Hidden Costs to Model**

Not in the monthly mortgage payment:
1. **Closing costs** (2–5% of purchase price, typically 3%)
   - Lender fees, appraisal, title, escrow, inspection, attorney (varies by state)
   - Example: $600k home = $18k–30k in closing costs
   - Can be financed (rolled into mortgage) but increases interest paid long-term
2. **Moving costs** ($3k–8k depending on distance and contents)
3. **Immediate repairs** (not all homes are perfect)
   - Budget 1–2% of purchase price for first-year fixes (HVAC, foundation, roof inspection issues)
4. **Furnishing/setup** (often underestimated)
   - Lawn equipment, storage systems, tools, painting, landscaping
5. **Property tax increase** (may go up after purchase assessment; varies by state)
6. **Title insurance and homeowner's insurance** (first year often higher)

**App Inputs for Affordability Calculator**
- Steven's gross annual income
- Wife's gross annual income
- Bonus/RSU structure (base + upside)
- Current debt (auto loans, student loans, credit cards)
- Target down payment (5%, 10%, 20%)
- Estimated property tax rate (Washington state: ~0.84–0.94%; varies by county)
- HOA fees (if applicable)
- Target home price OR monthly budget (reverse calculate home price)

**App Outputs**
- Max affordable home price (28% rule, 36% rule, comfortable rule)
- Monthly P&I payment
- Monthly taxes + insurance + HOA
- Total monthly housing cost
- Front-end and back-end ratios
- Closing costs estimate
- Total cash needed (down payment + closing costs + initial repairs)
- **Warning labels:** "At max stretch," "At comfort threshold," "Conservative estimate"

**Guidance Text**
- "The 28% rule is a floor, not a ceiling. Most lenders will approve you for more than you should borrow."
- "If your income is variable (bonuses, RSUs), we're using conservative estimates. You have room to stretch, but that's your safety buffer."
- "Closing costs are not optional. Budget 3–5% of the purchase price upfront."

---

## 2. Renovation vs. Save — The Decision Framework

### The Window Replacement Case Study (Steven's Specific Question)

**Gather Information First**

| Question | Why It Matters | Options to Model |
|---|---|---|
| Window age and type? | Replacement cost varies 10x | Single-pane (pre-1990s), double-pane, low-E, triple-pane |
| What's the condition? | Foggy/broken = urgent; drafty = efficiency loss | Foggy (seal failure), drafty, working but old, single-pane |
| Is there a comfort issue? | Hard to quantify, real impact on QOL | "Cold drafts in winter," "condensation," "normal," "no issues" |
| How long will you stay? | ROI depends entirely on time horizon | 1 year, 3 years, 5 years, 10+ years |
| Climate (Seattle/Puget Sound)? | Impacts energy savings potential | Moderate winters, wet climate, not extreme heating/cooling needed |

**Energy Cost Impact — The Math**

For old single-pane windows in Seattle:
- **Heat loss in winter:** ~10–15% of heating energy loss is through windows
- **Average heating cost:** ~$1,200–1,800/year for a typical home
- **Potential annual savings (single-pane → modern double-pane with low-E):** $200–400/year
- **Premium if already double-pane:** Only $50–150/year (much of the gain already exists)

For context: Seattle's winters are mild compared to other regions. Energy ROI on window replacement is weaker here than in cold climates (Minnesota, New England).

**Replacement Cost + ROI Payback**

| Window Type Upgrade | Typical Cost | Annual Savings | Payback Period |
|---|---|---|---|
| Single-pane → Double-pane low-E | $8,000–15,000 | $200–400 | 20–75 years ❌ |
| Double-pane → Triple-pane low-E | $12,000–20,000 | $50–100 | 120–400 years ❌ |
| Repair drafty seals/weatherstripping | $200–800 | $50–150 | 2–8 years ✓ |

**The Payback Problem in Seattle**
- Window ROI from pure energy savings is poor in mild climates
- In harsher climates (Denver, Boston), payback is 15–25 years (better but still long)
- **Energy payback alone justifies window replacement only if:**
  - Home is extremely inefficient (single-pane, many windows)
  - You're staying 15+ years
  - Local utility costs are high (Alaska, Hawaii, Northeast)

**Quality of Life Factor (The Human Side)**

This is where the real value lives for Steven:
- **Noise reduction:** Modern windows reduce street/neighbor noise by 30–50%
- **Drafts and cold spots:** Eliminate winter cold near windows (surprisingly impactful)
- **Condensation:** Foggy windows feel broken; clear windows feel maintained
- **Ease of cleaning and operation:** Old windows can be sticky, hard to open
- **Peace of mind:** No longer worried about leaks or failure

**For Steven's situation:** If windows are single-pane and he values quietness and comfort, replacement might make sense *not* for the $200/year energy savings, but for the $500/month comfort gain (subjective but real).

**Impact on Home Value — When Selling**

| Time to Sell | Value Add from Window Replacement | Cost Recovery |
|---|---|---|
| **1 year** | $500–2,000 (buyers notice it's done, minor bump) | 10–20% ❌ |
| **3 years** | $2,000–5,000 (shows maintained home) | 15–30% ⚠️ |
| **5 years** | $5,000–8,000 (competitive amenity) | 30–50% ⚠️ |
| **10+ years** | Neutral (expected by then) | 50–100% ✓ |

**The Decision Tree for Windows**

```
START: Are windows single-pane?
  ├─ NO (already double-pane)
  │  ├─ Are they foggy/broken? → Repair seals if possible (~$500), else replace 1–2 windows
  │  └─ Otherwise → SKIP (low ROI, existing efficiency already captures 80% of gains)
  │
  └─ YES (single-pane)
     ├─ Plan to stay <5 years? → SKIP (not worth cost)
     ├─ Plan to stay 5–10 years?
     │  ├─ Do you value quiet/comfort NOW? → REPLACE (payback in QOL)
     │  └─ Is energy efficiency a nice-to-have? → SKIP or PARTIAL (do high-traffic areas only)
     └─ Plan to stay 10+ years? → REPLACE (approaching neutral on cost, QOL + resale neutrality)
```

### Generalized Renovation Framework (Kitchen, Bathroom, Roof, HVAC)

**Three Categories of Renovations**

**1. Urgent/Safety (Must Do)**
- Roof leaking, HVAC broken, foundation issues, electrical hazards
- ROI calculation: irrelevant (it has to be done)
- *Do it* — but get 3 quotes, prioritize, phase if needed
- *Finance:* Cash if possible, HELOC if urgent, personal loan if HELOC not available

**2. Efficiency/Durability (Should Do Eventually)**
- HVAC replacement at end of life (usually 15–20 years)
- Roof nearing end of life (usually 20–30 years)
- Old boiler/water heater/appliances
- ROI: Medium-term (10+ years), value comes from avoiding emergency replacement at bad time
- *Timing:* Within 2–3 years of end-of-life, before failure
- *Finance:* HELOC preferred (lower rate than personal loan)

**3. Lifestyle/Aesthetic (Nice to Have)**
- Kitchen updates, bathroom vanity, flooring, paint, landscaping
- ROI: Depends entirely on time horizon and home value tier
- *Recovery rate:* Kitchen typically 50–70% (better in high-end homes), bathroom 50–60%

**The Kitchen/Bathroom Math**
| Renovation | Cost | Recovery if Sell in 3 Years | Recovery if Sell in 10 Years | Recovery if Stay |
|---|---|---|---|---|
| Full kitchen (high-end) | $50k–100k | 30–40% | 60–80% | 100% (QOL) ✓ |
| Mid-range kitchen | $25k–40k | 40–50% | 70–85% | 100% (QOL) ✓ |
| Full bathroom (primary) | $15k–30k | 40–60% | 70–85% | 100% (QOL) ✓ |
| Vanity update only | $3k–8k | 50–80% | 80–100% | 50% (low-need) ⚠️ |

**The "Good Enough" Threshold**

When does NOT renovating make sense?

- **Working but dated kitchen:** If cabinets, counters, and appliances work, deferred value is acceptable
  - *Unless:* Selling in next 1–2 years (then minor updates are cheap ROI)
  - *Unless:* Open-concept floor plan (dated kitchen ruins whole feel)
  
- **Old but functional bathroom:** Can wait unless showing major wear or in primary bedroom
  - Fresh paint and new hardware might be 80% of the visual value for 10% of the cost

- **Roof, HVAC, electrical:** *Cannot* be deferred. Do them when needed, phase if budget is tight.

**Financing Renovation Options**

| Source | Rate | Access | Best For | Trade-off |
|---|---|---|---|---|
| **Cash reserves** | 0% | If you have it | Any renovation | Uses emergency fund, reduces liquidity |
| **HELOC** | Prime + 0–2% (~7–9%) | If you have equity | $10k–150k projects | Requires good credit, rate can adjust |
| **Home equity loan** | Fixed 6–8% | Easier approval than HELOC | $10k–300k projects | Fixed payment, higher rate than HELOC |
| **Personal loan** | 8–15% | Quick, no equity required | $5k–50k | Highest rate, unsecured |
| **Credit card** | 18–24% | Instant | Emergency only | **Avoid for renovations** |
| **0% intro cards** | 0% for 12–21 months | Quick | Small projects ($5k–15k) | Rate jumps after intro, risky if can't pay off |

**For Steven's situation:**
- With home equity building, a HELOC should be first choice (lowest rate, flexible draw)
- Personal loan second choice if HELOC not available
- Never use credit card at 20%+ for a renovation (makes no financial sense)

**Decision Framework Tree for Any Renovation**

```
START: Type of renovation?
  ├─ URGENT (safety, major failure)
  │  ├─ Do it immediately
  │  └─ Finance: Cash → HELOC → Home equity loan
  │
  ├─ EFFICIENCY (end of life approaching)
  │  ├─ Expected to fail within 2–3 years?
  │  │  ├─ YES → Schedule and finance (HELOC)
  │  │  └─ NO → Can defer 3–5 years
  │  └─ Finance: HELOC (best rate) → Home equity loan
  │
  └─ LIFESTYLE (kitchen, bath, cosmetic)
     ├─ Selling in next 2 years?
     │  ├─ YES → Minor updates only (paint, hardware) for highest ROI
     │  └─ NO → Can do full renovation if you value it
     ├─ Staying 10+ years?
     │  ├─ YES → Do it if you enjoy the space (QOL matters)
     │  └─ NO → Skip high-cost items
     └─ Finance: Cash → HELOC (if have equity) → Personal loan
```

### Special Case: Steven's Older Windows

Based on the framework:
1. **Are they single or double pane?** (Determines energy ROI)
2. **How long will you stay?** (Critical for ROI math)
3. **Are they drafty or foggy?** (QOL issue vs just old)
4. **What's your current comfort level?** (Matters more than the math)

**Recommendation approach:**
- If single-pane + staying 7+ years + you notice drafts/cold spots → Likely worth replacing (QOL + eventual neutral resale)
- If single-pane + might sell in 3–5 years → Repair seals first ($500–1,000), full replacement only if major failure
- If double-pane already + working fine → Do not replace (poor ROI)
- If double-pane + foggy seals → Repair individual panes if cheap (~$200–500/window), full replacement only if many

---

## 3. Buy vs. Rent Analysis

### The Break-Even Timeline

**Standard Break-Even (Typical Market)**
- **5–7 years:** Most buyers break even on closing costs, transaction costs, and opportunity cost
- **3–5 years:** In hot appreciation markets or high-rent areas
- **7–10 years:** In stable/slow appreciation markets or low-rent areas

**For Seattle/Puget Sound:**
- Strong job market, tech sector, sustained demand
- Appreciation historically 3–4% annually (mid-range, not guaranteed)
- Rents appreciating 3–5% annually (higher than national average)
- **Expected break-even: 5–6 years** (assuming buying at market rate, not overextended)

**The Break-Even Math**

Buying a $600k home with $120k down (20%), 6.5% interest rate, 30-year mortgage:

```
Year 0 (Closing):
  - Down payment: -$120k
  - Closing costs: -$18k (3%)
  - Total cash out: -$138k

Year 1–5 (Homeownership):
  - Monthly payment: $3,500 (P&I, insurance, taxes, HOA ~$500+)
  - Total cash out over 5 years: ~$210k (60 months × $3,500)
  - Principal paid down: ~$80k (early payments mostly interest)
  - Appreciation at 3.5%: ~$106k

Year 5 (If you sell):
  - Home value: ~$706k (+$106k)
  - Remaining mortgage: ~$520k
  - Selling costs (realtor, closing): ~$42k (6%)
  - Proceeds: $706k - $520k - $42k = $144k
  - Total cost (5 years): $138k (initial) + $210k (payments) - $144k (proceeds) = $204k
  
Equivalent rent cost (assume $3,500/month, 3% annual increase):
  - 5-year rent cost: ~$220k

Result: Breaking even or slightly ahead by year 5, with upside if appreciation continues.
```

### Opportunity Cost of Down Payment

**The $120k question: Buy or Invest?**

If Steven has $120k for down payment:
- **Option A:** Put $120k down, get a $600k home, build equity through appreciation + principal paydown
- **Option B:** Put 10% down ($60k), invest remaining $60k in stock market

**Comparison (10-year horizon):**

| Metric | 20% Down | 10% Down + Invest |
|---|---|---|
| Total mortgage | $480k | $540k |
| PMI cost (10 yrs) | $0 | ~$50k (can estimate at $400/mo for 12 yrs until 20% equity) |
| Home appreciation (3.5%) | $227k | $227k (same home) |
| Principal paid (10 yrs) | $140k | $140k (same home) |
| Invested $60k at 8%/yr growth | N/A | $130k |
| Net wealth (home + investments) | $867k | $897k |
| Monthly payment difference | Lower ~$200 | Higher ~$200 |

**Result:** Over 10 years, assuming 8% market return, the 10% down + invest strategy nets more wealth (~$30k more), but higher monthly payment. This favors Steven *if*:
- He can handle the higher monthly payment
- Market returns 7%+ (not guaranteed)
- He actually invests the $60k (discipline required)

**The psychological factor:** Paying down a mortgage feels like saving. Stock market swings feel risky. Steven might prefer the 20% down, even if math favors leverage.

### Tax Benefits of Homeownership

**Mortgage Interest Deduction**
- Interest on first $750k of mortgage principal is deductible (reduced from $1M in 2017 Tax Cuts and Jobs Act)
- For Steven: If paying $26k/year in interest on a $600k mortgage, only ~$20k is deductible (rest is principal after 10+ years)
- **Benefit:** Reduces taxable income by ~$20k → ~$5,200/year tax savings at 26% marginal rate

**Property Tax Deduction (SALT Cap)**
- Deductible property taxes capped at $10,000/year (including state and local taxes, not just property tax)
- Washington state has no income tax, so the $10k cap isn't as punitive as in high-tax states
- Property tax only: ~$5,000–6,000/year on $600k home (0.84–0.94% rate)
- **Benefit:** In Washington, this cap is less painful than in California, New York, or Massachusetts

**Combination (Home + State/Local Tax):**
- Mortgage interest deduction: ~$5,200/year
- Property tax deduction (under $10k cap): ~$5,000–6,000/year
- **Total tax benefit:** ~$10,000–11,000/year for Steven (22–26% marginal rate = $2,200–2,860 tax savings)

**Rental Property Consideration:**
- If Steven ever rents out the home (e.g., international move for work), depreciation deduction becomes available
- Depreciation: ~$18k–22k/year (27.5-year residential depreciation of home value)
- This is a major tax tool for landlords but complicates taxes significantly

### Lifestyle Factors: Flexibility vs. Stability

**Buy = Stability but Lower Flexibility**
- ✓ Can renovate without landlord permission
- ✓ Build equity (forced savings)
- ✓ No landlord rent increases (rate locked on mortgage)
- ✗ Can't easily move (6–12 month transaction process)
- ✗ Responsible for all maintenance and repairs
- ✗ Market downturn can trap you (negative equity in worst case)
- ✗ Illiquid (can't sell next week if opportunity arises)

**Rent = Flexibility but Higher Long-term Cost**
- ✓ Can move within 30–60 days
- ✓ Landlord handles major repairs
- ✓ No market risk (stable housing cost predictable)
- ✗ Building no equity
- ✗ Exposed to rent increases (3–5% annually in Seattle)
- ✗ Less control over space (can't renovate, decorate limits)
- ✗ Long-term cost typically higher than buying (by 20–30% over 10 years)

**For Steven's situation:**
- Microsoft employee = likely stable job, low risk of major relocation
- Dual income = more financial stability
- Wife's job location matters too
- If both plan to stay in Seattle/Puget Sound 5+ years → Buy wins financially
- If one might relocate internationally or frequently → Rent is less risky

### Seattle/Puget Sound Specific Factors

**Appreciation History**
- 3–5% annual appreciation over 20 years (slower than 2010–2020, faster than national average)
- Tech industry demand supports demand (Amazon, Microsoft, Google offices)
- Supply constraints (geography, zoning) support prices
- Risk: If tech sector weakens, appreciation could slow to 1–2% or flatten

**Rental Market**
- Tech influx drives rents up 3–5% annually
- Rents higher than national average (~$2,000–3,000 for 2BR depending on neighborhood)
- Good inventory (less competitive than San Francisco or NYC)

**Neighborhoods Matter**
- Bellevue, Mercer Island: Tech-heavy, highest appreciation, premium pricing
- Queen Anne, Capitol Hill, Ballard: Walkable, younger demographic, moderate appreciation
- Eastside suburbs (Sammamish, Issaquah): Family-oriented, good schools, moderate-to-high appreciation
- South Seattle: More affordable, slower appreciation, less tech-oriented

**Schools (If Relevant for Kids)**
- Top-tier districts: Mercer Island, Issaquah, Bellevue (add 30–50% to home prices)
- Good districts: Sammamish, Shoreline, Ballard neighborhoods
- School rating varies significantly by zip code — can be 2–3 year apart in appreciation

---

## 4. Market Timing and Soft Factors

### Time in Market vs. Timing the Market

**The Finance Principle Applied to Real Estate**
- Buying and holding beats trying to time peaks/valleys
- Missing the 10 best days over a 20-year period cuts returns in half
- Same applies to real estate: one bad timing call can cost you years

**Why Timing Real Estate is Hard**
- Illiquid (can't sell quickly if market turns)
- Transaction costs are high (5–7% to sell)
- Personal factors (job, family) often drive timing more than market factors
- Local markets are slow to react to national signals

**Rule of Thumb:**
- If you're staying 7+ years, market timing doesn't matter (appreciation + equity paydown usually wins)
- If you're staying 3–5 years, pick the right time by looking at 2–3 year ahead, not perfect entry
- If you're staying <3 years, expect break-even or loss on pure financial grounds (might still make sense for life reasons)

### Interest Rate Environment

**How Rate Affects Affordability**

| Interest Rate | Monthly Payment (P&I only, $500k mortgage, 30yr) | Impact |
|---|---|---|
| 5.0% | $2,684 | Historical low (2021–2023) |
| 6.0% | $3,000 | Current market (2024–2026) |
| 6.5% | $3,165 | Slightly elevated |
| 7.0% | $3,331 | High (2023 peak) |
| 8.0% | $3,669 | Very high (2008 crisis) |

**Monthly payment difference:** 5% to 7% = $647/month swing on $500k mortgage. That's $15,500 difference in annual affordability.

**Forward-Looking Strategy:**
- If you think rates will rise: Buy sooner rather than later (lock in current rate)
- If you think rates will fall: Delay or be comfortable with refinance down the road
- Reality: Nobody predicts rates accurately. Plan for 5–7% range over next 5 years.

**Fixed vs. Adjustable Rate Mortgages**
- **30-year fixed:** Predictable, stable. Best for homeowners staying 7+ years. Currently 6–6.5%.
- **ARM (5/1, 7/1):** Lower initial rate (5.5–6%), but adjusts after 5/7 years
  - *Scenario: Only if you're confident you'll refi or sell before adjustment*
  - Risky for long-term holders if rates stay high

**For Steven:** Fixed 30-year mortgage makes sense (stability, predictability, no rate gamble).

### When to Buy: Life Stage Signals vs. Market Signals

**Life Stage Signals (Often More Important)**
- ✓ Married/partnered (commitment to area)
- ✓ Job stability (staying put, growth trajectory clear)
- ✓ Saved 10–20% down payment (discipline established)
- ✓ Planning to stay 5+ years (clear intent)
- ✓ Want to renovate/personalize (ready for ownership)

**Market Signals (Secondary)**
- ⚠️ Interest rates declining (could warrant delay to refi)
- ⚠️ Local appreciation slowing (but buying for own use, not investment)
- ⚠️ Inventory high (more choice, less bidding war)
- ⚠️ Inventory low (bidding wars, prices peak)

**Steven's Situation:** If he and wife have stable jobs in Seattle, savings for down payment, and want to stay 5+ years → Life stage signals say **buy now**, not later. Market signals are secondary (rates might swing 0.5–1%, but it's not worth waiting if life stage is right).

### Neighborhood Evaluation Framework

**School Districts (if relevant)**
- Top 10% districts: +30–50% price premium
- Good districts (top 30%): +10–20% premium
- Avg/below districts: baseline
- **Impact on appreciation:** Top districts appreciate 1–2% faster over 10 years

**Commute**
- 30-min commute: Baseline (expected)
- 15-min commute: +5–10% value premium
- 45+ min commute: -5–10% discount
- **Micro-factor:** Depends on job location; Seattle traffic can add 20–30 min variability

**Walkability & Amenities**
- Walk Score 70+: Premium pricing, faster appreciation
- Walk Score 50–70: Moderate
- Walk Score <50: Car-dependent, slower appreciation

**Appreciation History (3–10 year lookback)**
- 3% average: Baseline for Seattle area
- 4–5% average: Stronger market (tech corridor, improving transit)
- <2% average: Slower, possibly due to local oversupply or industrial use nearby

**Rezoning Risk / Upside**
- New transit station planned → Upside potential
- Upzoning planned → Upside potential
- Industrial zone adjacent → Risk of downside if rezoned commercial
- Greenfield → Unknown (could go either way)

**Red Flags in Neighborhoods**
- Falling school ratings (migration of families out)
- New industrial / commercial development (noise, traffic)
- Significant vacancy (storefronts, apartments)
- Crime trending up (check local data, not just reputation)
- Gentrification (can cut both ways: upside in early phase, volatility later)

### Emotional Factor: Presenting Soft Data in the App

**Why "Feeling" Data Matters**
- You spend 1/3 of life at home; comfort and joy matter financially
- A neighborhood you love but appreciate slower is better than one you dislike appreciating faster
- Undervaluing quality of life often leads to regret or forced sale

**How to Present Soft Factors in ma-finance:**

1. **Side-by-side with numbers**
   - Show: "Home A: $650k, 4% appreciation, 30-min commute"
   - Also show: Slider/rating for "How much do you like this neighborhood?" (1–10)
   - Calculate: "Which would you choose if prices were equal?"

2. **Weighting framework**
   - "If you could improve ONE thing: longer commute, longer renovation, smaller yard, older home — which bothers you least?"
   - Ranks tradeoffs without false precision

3. **Life stage integration**
   - "Are you buying for now (10+ years) or as a stepping stone (3–5 years)?"
   - "Does school quality matter?" (Yes/No/Very much)
   - "Do you work from home?" (affects commute weight)

4. **Warnings, not prescriptions**
   - ⚠️ "This home has appreciated 2% annually (below Seattle average). Market factor or neighborhood risk?"
   - ⚠️ "Commute is 45+ minutes. That's a lifestyle cost to weigh against price savings."
   - ✓ "Strong school district. Not just emotionally appealing; statistically supports appreciation."

---

## 5. What the App Should Show Users

### Scenario Inputs (What Users Provide)

**Core Affordability Scenario**
- Steven's gross annual income (W-2 only initially)
- Wife's gross annual income
- Combined bonuses (expected average, conservative range)
- RSU grants (vested + next 12-month vest schedule)
- Current debts: Auto loan balance, student loan balance, credit card balance
- Current liquid savings
- Target down payment % (5%, 10%, 20%) OR target home price (reverse calculate)
- Assumed mortgage term: 15-year or 30-year
- Assumed interest rate (default to current market, allow override)

**Renovation Scenario**
- Current home value (estimated or known)
- Renovation type: Windows, Kitchen, Bathroom, Roof, HVAC, Other
- Estimated cost (user guess or app-populated options)
- Timeline: Immediate, 1 year, 3 years, 5+ years
- Plan to stay: 1 year, 3 years, 5 years, 10+ years
- Finance method: Cash, HELOC, Home equity loan, Personal loan

**Buy vs. Rent Scenario**
- Home price (target to buy)
- Down payment %
- Rent cost (for comparison)
- Planned holding period: 3 years, 5 years, 10+ years
- Expected appreciation rate (allow user override or use regional default)
- Inflation rate for rent increases

**Market Timing Scenario**
- Current home price (market ref)
- Two scenarios: Buy now vs. buy in 1 year (test rate/appreciation impact)

### Key Outputs (What App Shows)

**Affordability Calculator Output**
- **Maximum affordable home price** (at comfortable 24% front-end, 28% stretch)
- **Monthly housing cost breakdown:**
  - P&I payment
  - Property tax
  - Insurance
  - HOA (if applicable)
  - Subtotal (all-in monthly)
- **Debt-to-income ratio:** Front-end (housing %) and back-end (all debt %)
- **Total cash needed:** Down payment + closing costs + emergency repairs buffer
- **Comparative affordability:** "At this price, you're at X% of comfortable threshold" (with color coding: green, yellow, red)

**Renovation Scenario Output**
- **Energy cost impact (if applicable):** Annual savings, payback period
- **Resale impact:** Estimated recovery % if selling in 1, 3, 5, 10 years
- **Quality of life assessment:** "Upgrading comfort," "Minor improvement," "Mainly aesthetic"
- **Financing comparison:** Monthly cost if financed via HELOC vs. personal loan vs. cash
- **Recommended decision:** Based on inputs, app suggests "Now," "Delay to year X," "Not recommended"

**Buy vs. Rent Output**
- **Total 5-year cost:** Buying (with all costs) vs. renting (with appreciation rent assumption)
- **Total 10-year cost:** Same
- **Break-even timeline:** When buying becomes cheaper than renting
- **Opportunity cost:** If invested $X down payment, what's it worth at time horizon?
- **Tax benefit:** Annual savings, 5–10 year cumulative
- **Flexibility comparison:** "Renting is $X cheaper/year but costs flexibility"; "Buying builds $Y equity over period"

**Market Timing Output**
- **Scenario A (Buy now):** Home price, rate, monthly cost, total cost over period
- **Scenario B (Buy in 1 year):** Adjusted for estimated rate change and appreciation
- **Sensitivity:** "If rates rise 0.5% more, break-even shifts to year X"
- **Recommendation:** "Market timing is hard; focus on life stage readiness"

### Guidance Text Placement

**In-App Guidance (Context-Sensitive)**

1. **Affordability page:**
   - "The bank will lend you up to 36%, but comfort typically starts around 24–28%"
   - "Closing costs are 3–5% of purchase price and are required upfront"
   - "PMI on 10% down homes is typically $400–500/month until you reach 20% equity"

2. **Renovation decision pages:**
   - "Energy ROI on windows in Seattle is weak (20–75 year payback). Consider if comfort matters more than payback"
   - "If you're selling in the next 2 years, skip large renovations and focus on inexpensive curb appeal"
   - "HELOC rates are typically 1–2% lower than personal loans — check with your bank"

3. **Buy vs. Rent pages:**
   - "If you're staying less than 5 years, expect break-even or a modest loss on pure economics"
   - "Rents in Seattle are rising 3–5% annually, so long-term rent costs compound quickly"
   - "Buying builds equity through principal paydown (~$140k over 10 years on $500k mortgage)"

4. **Market timing pages:**
   - "Timing the market perfectly is nearly impossible. Buying and holding beats trying to pick the peak."
   - "Over 7+ years, rate changes and market timing matter much less than you think"

### Where to Say "Talk to a Professional"

- **Tax impact** (especially if considering rental property, 1031 exchanges, or complex deductions)
- **Investment strategy** (comparing home buying to stock market returns requires personal risk tolerance)
- **Loan qualification specifics** (credit score impacts, recent job changes, self-employment income)
- **Title issues, inspections, appraisals** (transaction mechanics beyond the app's scope)
- **Local regulations** (HOA specifics, local tax variations, rent control)
- **Estate planning** (home ownership impacts on wills, trusts)

**Recommended phrasing:**
- "This calculator assumes standard scenarios. For your specific situation, consult a mortgage broker or financial advisor."
- "Tax benefits vary by filing status and total income. Consult a tax professional for your specific impact."
- "If you're planning to rent out this home in the future, consult a CPA about depreciation and passive income rules."

---

## Summary for Rusty & Linus

### Feature Priorities (MVP to Future)

**MVP (Reuben's Recommendations):**
1. Home Affordability Calculator (core feature for Steven & wife)
2. Renovation vs. Save framework (windows case + generalized)
3. Buy vs. Rent comparison (5–10 year horizon)

**Post-MVP:**
4. Market timing scenarios (rate/appreciation sensitivity)
5. Neighborhood evaluation tool (walkability, schools, commute)
6. Long-term wealth projection (building equity + investable alternatives)

### Tone and Approach for App Copy

- **Honest:** Show limits ("timing is hard," "energy ROI is weak," "this is an estimate")
- **Practical:** Money comes with tradeoffs, feature trade-offs explicitly
- **Human-centered:** Acknowledge that comfort, lifestyle, and security matter as much as spreadsheets
- **Empowering:** Help Steven and wife make decisions, don't prescribe (especially soft factors)

---

## Scenarios Not Covered (Out of Scope for MVP)

- International property investment (different tax, currency, legal rules)
- Vacation home / investment property rental dynamics (beyond "talk to a professional")
- Complex tax situations (1031 exchanges, depreciation recapture, basis step-up)
- Emotional challenges of home selling (out of scope, but human-acknowledging text helps)
- Co-buying with family members (complicates liability and decision-making)
