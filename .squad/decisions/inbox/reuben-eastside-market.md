# Eastside Seattle Market Assessment
**Author:** Reuben (Real Estate Advisor)  
**Date:** 2026-04-26  
**For:** Linus (engine defaults) + Rusty (UI qualitative guidance)  
**Subject:** Kirkland / Redmond / Bellevue — Comprehensive Market Intelligence  

---

## 1. Median Home Prices (2025–2026 Data)

All figures are market-wide medians based on Zillow, Redfin, NWMLS, and local brokerage data through Q1 2026.

### Kirkland
| Tier | Price Range | Notes |
|------|-------------|-------|
| **Median SFH** | **$1,370,000–$1,420,000** | City-wide median; Redfin April 2026 cites ~$1,423K |
| **Median Condo/Townhome** | **$575,000–$700,000** | Condo per-sqft up 9.4% YoY in 2026 |
| Starter SFH | $850,000–$1,050,000 | South Juanita, Totem Lake, Finn Hill edges |
| Family SFH (3–4 BR) | $1,100,000–$1,600,000 | Core Kirkland, Bridle Trails adjacents |
| Higher-end SFH | $1,700,000–$3,000,000+ | Waterfront, Yarrow Point, West Kirkland lake views |
| Starter Condo | $480,000–$600,000 | Totem Lake area (~$488K median) |
| Family Townhome | $650,000–$850,000 | Typical 3BR attached |

### Redmond
| Tier | Price Range | Notes |
|------|-------------|-------|
| **Median SFH** | **$1,350,000–$1,400,000** | Steady; up 8.7% YoY Oct 2025 |
| **Median Condo/Townhome** | **$600,000–$900,000** | Wide range; Microsoft corridor condos on higher end |
| Starter SFH | $880,000–$1,100,000 | SE Redmond, Overlake area |
| Family SFH (3–4 BR) | $1,100,000–$1,500,000 | North Redmond, Education Hill |
| Higher-end SFH | $1,600,000–$2,500,000 | Willows Road area, Idylwood, 5+ BR |
| Starter Condo | $380,000–$620,000 | 1BR near Microsoft; 2BR ~$832K median |
| Family Townhome | $800,000–$1,100,000 | Growing supply near downtown Redmond |

### Bellevue
| Tier | Price Range | Notes |
|------|-------------|-------|
| **Median SFH** | **$1,500,000–$1,680,000** | Highest of the three; Redfin April 2026 ~$1,500K |
| **Median Condo/Townhome** | **$750,000–$1,100,000** | Downtown condos near $986K–$1M; suburban less |
| Starter SFH | $1,100,000–$1,350,000 | Crossroads, Eastgate, Bellevue fringe |
| Family SFH (3–4 BR) | $1,400,000–$2,200,000 | Somerset, Factoria, Lake Hills |
| Higher-end SFH | $2,200,000–$5,000,000+ | West Bellevue, Medina adjacents, downtown high-rises |
| Starter Condo | $600,000–$850,000 | Downtown mid-rise |
| Family Townhome | $950,000–$1,300,000 | Larger attached in south Bellevue |

> **Linus default for engine:** Use Kirkland $1,400K SFH / $640K condo as "middle Eastside" baseline. Bellevue as premium scenario (+10–15%). Redmond as near-identical to Kirkland but fractionally lower for condos.

---

## 2. Property Tax Rates (2025–2026)

King County uses per-$1,000 levy rates compiled by the County Assessor. The *effective rate* is what matters for budgeting — it accounts for all district levies (county, city, school, fire, parks, voter-approved bonds).

| City | Levy Rate per $1,000 AV | Effective Rate | Annual Tax on $1.4M Home |
|------|------------------------|----------------|--------------------------|
| **King County Base** | ~$3.50/$1,000 | — | — |
| **Kirkland** | $7.41–$8.51/$1,000 | **~0.85%** | ~$11,900 |
| **Redmond** | $7.17–$7.85/$1,000 | **~0.85%** | ~$11,900 |
| **Bellevue** | $7.33–$9.14/$1,000 | **~0.85%** | ~$12,750 on $1.5M |

**Key notes:**
- All three cities converge on ~0.85% effective rate — differences are within rounding margin for planning purposes.
- School bond levies and voter-approved measures (fire, parks) push rates slightly higher in some levy districts. Bellevue SD bond levies tend to run a bit higher.
- Washington has no state income tax; property tax is a primary local revenue mechanism and is predictable.
- Assessment value typically lags sale price by 1–2 assessment cycles.

> **Linus default:** Use **0.85% of purchase price** as effective annual property tax rate across all three cities. This is conservative and reflects reality well.

---

## 3. HOA Norms

HOA fees vary significantly by age of development, amenities included, and property type. Numbers below are typical (not outliers).

| Property Type | Low End | Mid Range | High End | Notes |
|--------------|---------|-----------|----------|-------|
| **Condo** | $250/mo | $400/mo | $700–$1,000+/mo | High-end includes concierge, gym, parking, reserve |
| **Townhome** | $200/mo | $325/mo | $450/mo | Usually covers exterior maintenance, roof, landscaping |
| **SFH Community HOA** | $50/mo | $150/mo | $350/mo | Many SFH neighborhoods have no HOA; gated/amenity-rich can reach $350+ |

**City-specific texture:**
- **Bellevue downtown condos:** $500–$900+/mo (high-rise amenities, doorman, EV charging)
- **Kirkland townhomes:** $200–$450/mo (most common configuration)
- **Redmond near Microsoft:** $300–$500/mo for newer condo stock (Overlake corridor)
- **Older Eastside SFH subdivisions:** Often $0–$75/mo or none at all

> **Linus defaults:**
> - Condo HOA: **$400/mo**
> - Townhome HOA: **$300/mo**
> - SFH HOA (when applicable): **$100/mo** (or $0 if none — let user toggle)

---

## 4. Home Appreciation Rates

### Historical Performance
| Period | Annual Appreciation (Eastside) | National Average |
|--------|-------------------------------|-----------------|
| **10-Year (2014–2024)** | **~7%–9% CAGR** | ~4–5% |
| **5-Year (2019–2024)** | **~9%–12% CAGR** | ~6–7% |
| **1-Year (2024–2025)** | **~2%–4%** | ~2–3% |

- The 10-year CAGR reflects Eastside homes more than doubling in value (Bellevue: ~$680K in 2014 → ~$1.5M+ in 2024 ≈ 8.2% CAGR).
- The 5-year figure is heavily influenced by the 2020–2022 pandemic surge (20–30% YoY in those years).
- The Eastside consistently outperforms the national average by 2–4 percentage points annually over the long run.

### Current Market Trajectory (2025–2026)
**Status: Moderating / Stabilizing** (cooling from 2022 peak but not declining meaningfully)

- Inventory up ~54% YoY on Eastside (fall 2025), creating buyer leverage not seen in years
- Prices modestly down 2–4% from 2022 peak highs, but not crashing — supported by tech employment
- Market has shifted from "frenzy" to "active but rational"
- Experts project 3–6% appreciation through 2026 as mortgage rates stabilize and demand remains structurally high
- The Eastside tech employment base (Microsoft, Amazon, Meta, Google all present) is the fundamental floor

> **Linus default:** Use **4.5% annual appreciation** as base case for Eastside models. Conservative scenario: 3.0%. Optimistic: 7.0%. This reflects current normalization + long-term structural demand.  
> Note: Prior history file shows 3.5% was the baseline assumption — recommend updating to 4.5% given the Eastside's persistent outperformance vs. national.

---

## 5. Insurance Costs

Washington is among the lower-cost states for homeowners insurance due to low tornado/hurricane exposure. Eastside cities are among the cheapest in WA.

| City | Annual Premium (typical) | Notes |
|------|--------------------------|-------|
| **Bellevue** | $1,100–$1,460/yr | ~5% below WA state average |
| **Redmond** | ~$1,090/yr | ~6% below WA state average |
| **Kirkland** | ~$1,200/yr | Near WA state average |
| **WA State Average** | ~$1,160–$1,475/yr | For $300K dwelling coverage |

**Important caveats:**
- These figures assume $300K dwelling coverage — most Eastside homes require $600K–$1.2M+ dwelling coverage, which scales premiums proportionally.
- Expect $2,000–$4,500/yr for full replacement cost coverage on a $1.2M–$1.8M SFH.
- Earthquake coverage is **not** included in standard HO-3 policies — add-on strongly recommended (PNW seismic risk). Add ~$800–$2,000/yr.
- No flood zone issues for most Eastside addresses (check FEMA map; most are low-risk).

> **Linus default:** Use **$2,400/yr ($200/mo)** as base homeowner's insurance for a $1.3–1.5M Eastside home. Flag earthquake rider as optional add-on (+$100–$150/mo). Scale proportionally for higher/lower purchase price.

---

## 6. Affordability Context — Tech Couple at $305K–$350K Combined Income

### Income Assumptions
- Steven: ~$158K base + $14.5K bonus + ~$15K vested stock = ~$188K gross (cash)
- Wife: Variable; model at $120K–$162K base for $305K–$350K combined
- Combined gross for affordability: **$305,000–$350,000/yr**

### Mortgage Rate Environment (April 2026)
| Loan Type | Current Rate Range | Typical (Good Credit) |
|-----------|-------------------|----------------------|
| Conforming (≤$1,063,750) | 5.50%–6.75% | ~6.00%–6.25% |
| Jumbo (>$1,063,750) | 6.00%–7.00% | ~6.25%–6.50% |

Most Eastside purchases will be **jumbo loans** at the SFH median. The conforming limit for King County in 2026 is $1,063,750 — any purchase above that requires jumbo financing.

*Note: Jumbo rates can paradoxically be equal to or slightly below conforming when lenders compete for high-credit borrowers.*

### Down Payment Scenarios

At **$330K combined gross**, monthly gross = ~$27,500:

| Down Payment | Purchase Price | Loan Amount | Loan Type | Rate | P&I/mo | Total PITI/mo* | Front-End DTI | Feasibility |
|-------------|---------------|-------------|-----------|------|--------|----------------|---------------|-------------|
| **10% ($140K)** | $1,400,000 | $1,260,000 | Jumbo | 6.50% | $7,964 | ~$10,100 | ~36.7% | Stretch |
| **15% ($210K)** | $1,400,000 | $1,190,000 | Jumbo | 6.40% | $7,440 | ~$9,600 | ~34.9% | Comfortable |
| **20% ($280K)** | $1,400,000 | $1,120,000 | Jumbo | 6.25% | $6,897 | ~$9,050 | ~32.9% | Comfortable |
| **25% ($350K)** | $1,400,000 | $1,050,000 | Conforming | 6.10% | $6,364 | ~$8,500 | ~30.9% | Conservative |
| **20% ($280K)** | $1,200,000 | $960,000 | Conforming | 6.10% | $5,827 | ~$7,950 | ~28.9% | Conservative |

*PITI includes P&I + property tax ($990/mo) + insurance ($200/mo) + average HOA ($300/mo for townhome; $0 for SFH without HOA).*

### DTI Analysis
- **Conventional/Jumbo lenders target ≤43% back-end DTI** (total debt / gross income)
- At $330K combined, max back-end DTI of 43% = ~$11,825/mo max debt service
- Add car payments, student loans, etc. to PITI to get back-end DTI
- **Sweet spot for this couple:** $1,100,000–$1,500,000 purchase price at 15–20% down
- **Comfortable without income stress:** $1,000,000–$1,300,000 (conforming range, lower rate)

### Critical Safety Check (Reuben's Rule)
Per history guidance: **at least one income must cover the mortgage alone.** 

At $1,400K purchase / 20% down / 6.25%:
- P&I only = $6,897/mo
- Steven's take-home after 401k ≈ ~$7,800–$8,500/mo net
- ✅ Steven alone can cover P&I. Full PITI (~$9,050) would be tight but survivable short-term.

At $1,200K purchase / 20% down / 6.10%:
- P&I = $5,827/mo
- ✅ Comfortably covered by Steven alone with room for living expenses.

### Price Range Recommendation by Scenario

| Scenario | Purchase Price | Notes |
|----------|---------------|-------|
| Conservative (1 income resilience) | $1,000K–$1,200K | Conforming loan; one income covers PITI |
| Comfortable (dual income optimized) | $1,200K–$1,500K | Jumbo territory; both incomes needed |
| Stretch (RSU/bonus dependent) | $1,500K–$1,800K | Requires both incomes + variable comp |

> **Note on RSUs:** Steven's vesting stock should NOT be counted in primary income for mortgage qualification — most lenders require 2-year history. Useful for down payment reserve or accelerated paydown.

---

## 7. Qualitative Factors

### Commute to Microsoft Redmond Campus
| City | Drive (off-peak) | Drive (peak) | Transit Options |
|------|-----------------|--------------|-----------------|
| **Redmond** | 5–15 min | 10–25 min | Link Light Rail (Overlake); direct |
| **Kirkland** | 10–20 min | 15–30 min | Bus + light rail transfer |
| **Bellevue** | 12–20 min | 15–35 min | Light rail (East Link) to Overlake |

- Redmond is the obvious commute winner — literally on campus's doorstep.
- Kirkland (especially East Kirkland / Totem Lake) has nearly as good access via 520.
- Bellevue downtown-to-Microsoft is easy but can hit traffic on 520 or 156th.

### School District Quality
| District | Niche Rank (WA) | Notable Schools | Best For |
|---------|----------------|-----------------|----------|
| **Bellevue SD** | **#1 in WA** | Bellevue HS, Newport HS, International School | Highest academic outcomes |
| **Northshore SD** | **#2 in WA** | Canyon Creek, Sunrise | North Redmond / Woodinville |
| **Lake Washington SD** | **#3 in WA** | Tesla STEM HS (#1 public HS in WA), Redmond HS, ICS | STEM excellence; serves Kirkland + Redmond |

**Practical reading:** All three cities sit in genuinely elite school districts. The difference between Bellevue SD (#1) and Lake Washington SD (#3) is real but marginal for most families. Tesla STEM High School (Redmond/Lake Washington SD) is arguably the single best public school in the state.

### Lifestyle & Walkability

**Bellevue:**
- Urban density, high-rise options, premium retail (The Bellevue Collection, Lincoln Square)
- Best walkability on Eastside; truly car-optional in downtown core
- Most "city" feel of the three; fastest pace, highest cost
- Ideal for a couple who wants urban convenience and doesn't miss Seattle

**Kirkland:**
- Waterfront charm — Lake Washington shoreline, Juanita Beach, Marina Park
- Strong local identity; independent coffee, restaurants, boutiques
- Best "community feel" of the three — people love living here
- Good walkability in the downtown/waterfront core; car still needed elsewhere
- Sweet spot between Bellevue's urbanism and Redmond's suburban efficiency

**Redmond:**
- Most practical for a Microsoft employee — live where you work
- Strong parks system (Marymoor Park is exceptional — concerts, dog park, sports)
- Downtown Redmond improving rapidly with new mixed-use development
- Less neighborhood "soul" than Kirkland or Bellevue, but functional and comfortable
- Best for: minimize commute, maximize home-for-dollar

### Market Competitiveness (April 2026)

| Metric | Kirkland | Redmond | Bellevue |
|--------|----------|---------|----------|
| Median DOM | 17–29 days | 12–20 days | 13–24 days |
| Inventory trend | Up ~54% YoY | Up similarly | Up; luxury slower |
| Multiple offers? | Still common at $1–$1.5M | Yes, esp. near Microsoft | Yes, under $1.5M |
| Over-ask prevalence | Moderate (most well-priced homes) | Moderate-high | Moderate |
| Bidding war intensity | Reduced vs. 2022 peak | Moderate | Reduced |

**Overall:** The Eastside has cooled from its 2021–2022 frenzy into a **competitive but rational** market. Buyers have more time (17–29 days vs. 3–5 days in 2022), can negotiate, and don't universally need to waive contingencies. However, the $1M–$1.5M sweet spot — exactly where this couple will be shopping — remains the most contested price band. Expect multiple offers on well-presented homes.

**Practical buyer guidance:**
- Get pre-approved for a jumbo loan *before* shopping; sellers expect it
- Budget 1–3% over ask on competitive properties in the $1.1M–$1.5M range
- Inspection contingencies are returning — reasonable to include in most offers now
- Spring (April–June) is peak competition; fall offers more buyer leverage

---

## 8. Summary Defaults for Linus (Engine)

| Parameter | Default Value | Conservative | Optimistic | Source |
|-----------|-------------|-------------|------------|--------|
| Purchase price (mid Eastside SFH) | $1,400,000 | $1,150,000 | $1,700,000 | Kirkland/Redmond median |
| Purchase price (Bellevue SFH) | $1,600,000 | $1,350,000 | $2,000,000 | Bellevue median |
| Purchase price (condo/townhome) | $700,000 | $580,000 | $950,000 | Eastside median condo |
| Property tax rate | 0.85% of value/yr | 0.85% | 0.90% | King County effective |
| Condo HOA | $400/mo | $250/mo | $600/mo | Eastside norms |
| Townhome HOA | $300/mo | $150/mo | $450/mo | Eastside norms |
| SFH HOA (toggle) | $100/mo or $0 | — | — | User-selectable |
| Homeowner's insurance | $200/mo ($2,400/yr) | $175/mo | $300/mo | Scaled for $1.3–1.5M home |
| Earthquake add-on (optional) | $125/mo | — | — | Strongly recommended PNW |
| Annual appreciation (base) | 4.5% | 3.0% | 7.0% | Eastside historical |
| Mortgage rate (conforming) | 6.10% | 6.50% | 5.75% | April 2026 actual |
| Mortgage rate (jumbo) | 6.35% | 6.75% | 6.00% | April 2026 actual |
| Conforming loan limit (King Co.) | $1,063,750 | — | — | 2026 FHFA limit |
| Annual appreciation (national avg) | 4.0% | 2.5% | 5.5% | For comparison |

---

## 9. Summary Guidance for Rusty (UI)

Surface the following as qualitative context cards or tooltips in the housing scenario panel:

1. **Commute card:** "Redmond = 5–15 min. Kirkland = 10–25 min. Bellevue = 12–35 min. All three are practical for a Microsoft employee."

2. **School quality card:** "You can't go wrong. Bellevue SD is #1 in WA; Lake Washington SD (#3, serves Kirkland & Redmond) has Tesla STEM HS, rated #1 public HS in the state."

3. **Lifestyle selector (non-quantified):** Let user rate how much they value: walkability, waterfront/parks, urban energy, neighborhood community feel. Map weights to Kirkland/Bellevue/Redmond suggestion.

4. **Market timing card:** "The Eastside has cooled from its 2022 peak. Inventory is up ~54%; bidding wars are less intense. This is a more normal market — but the $1M–$1.5M range is still competitive."

5. **Single-income resilience flag:** Always show: "On Steven's income alone, the mortgage would be [$X]/mo — [feasible/tight/at risk]. Safety requires one income to carry the home."

6. **Jumbo loan alert:** "Homes above $1,063,750 require a jumbo loan. Pre-approval for jumbo is different from conforming — start that process early."

7. **Insurance note:** "Standard homeowner's insurance does NOT cover earthquakes in WA. A separate rider is strongly recommended for Eastside homes (~$100–$150/mo)."

---

*All market data sourced from Zillow, Redfin, NWMLS, King County Assessor, Policygenius, and local brokerage reports (Windermere, Sammamish Mortgage, Realogics Sotheby's). Data reflects Q1 2026 conditions. Consult a licensed real estate agent and mortgage lender for transaction-specific advice.*
