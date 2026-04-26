# Financial Reference Data — 2026

**Document Date:** April 25, 2026  
**Purpose:** Authoritative source for all financial assumptions, limits, rates, and formulas used in ma-finance scenario calculations.  
**Audience:** Engine (Linus), UI (Rusty), and stakeholders.

---

## 1. Retirement Accounts: 2026 Contribution Limits & Matching

### 401(k) — Employee & Employer Contributions

| Category | 2026 Limit |
|----------|-----------|
| **Employee Elective Deferral** (ages <50) | $24,500 |
| **Catch-up Contribution** (age 50+) | +$8,000 (total $32,500) |
| **Super Catch-up** (ages 60–63) | +$11,250 (total $35,750) |
| **Total Contribution Limit** (all sources) | $72,000 |
| **Total with Catch-up** (age 50+) | $80,000 |
| **Total with Super Catch-up** (ages 60–63) | $83,250 |

**Notes:**
- The $72,000 limit includes employee deferrals + employer match + profit sharing, but excludes catch-up contributions.
- Catch-up contributions are in addition to the standard limit, enabling higher savings for those 50+.
- Combined Roth and pre-tax contributions count toward the $24,500 limit.

### Microsoft 401(k) Employer Match (Verified 2026)

| Component | Details |
|-----------|---------|
| **Match Formula** | 50% of your contributions, up to the employee deferral limit |
| **Maximum Employer Match** | $12,250 (50% of $24,500) |
| **Vesting** | Immediate |
| **Applicability** | Standard employee deferrals only; catch-up contributions not matched |

**Example:** If you contribute $24,500, Microsoft matches $12,250 (combined employee + employer = $36,750, excluding catch-up or mega backdoor strategies).

### After-Tax & Mega Backdoor Roth (Limited Details)

- Microsoft plan allows after-tax (non-Roth) contributions and may permit conversions to Roth.
- Mega backdoor strategy enables contributions beyond the standard $24,500 limit, subject to plan design and IRS limits.
- *Action Item for Linus:* Confirm Microsoft's current mega backdoor rules with HR; rules vary by plan.

### Traditional & Roth IRA Contribution Limits (2026)

| Category | Amount |
|----------|--------|
| **Under age 50** | $7,500 |
| **Age 50 or older** | $8,600 (includes $1,100 catch-up) |

**Limits are combined:** You can split your $7,500 (or $8,600) between Traditional and Roth, but the total cannot exceed these caps.

**Must have earned income equal to or greater than your contribution.**

### Roth IRA Income Phase-Out (Married Filing Jointly, 2026)

| Status | MAGI Threshold |
|--------|----------------|
| **Full contribution allowed** | MAGI < $242,000 |
| **Partial contribution allowed** | MAGI $242,000–$252,000 |
| **No direct Roth contribution** | MAGI ≥ $252,000 |

**Backdoor Roth Strategy:** If income exceeds phase-out limits, contribute to Traditional IRA and convert to Roth in the same year (pro-rata rule considerations apply; consult a tax advisor).

---

## 2. Federal Income Taxes — 2026 (Married Filing Jointly)

### Standard Deduction (2026)

**$32,200** for married couples filing jointly.

*Considerations:* Most taxpayers benefit from the standard deduction. Itemize only if itemized deductions exceed $32,200.

### Federal Income Tax Brackets (Married Filing Jointly, 2026)

| Tax Rate | Income Range |
|----------|--------------|
| **10%** | $0 – $24,800 |
| **12%** | $24,801 – $100,800 |
| **22%** | $100,801 – $211,400 |
| **24%** | $211,401 – $403,550 |
| **32%** | $403,551 – $512,450 |
| **35%** | $512,451 – $768,700 |
| **37%** | $768,700+ |

**Tax System is Progressive:** Only the income within each bracket is taxed at that rate. For example, if you have $300,000 in taxable income, the first $24,800 is taxed at 10%, the next $76,000 at 12%, and so on.

### Long-Term Capital Gains Tax Rates (2026, Married Filing Jointly)

| Tax Rate | Income Range |
|----------|--------------|
| **0%** | $0 – $98,900 |
| **15%** | $98,901 – $583,750 |
| **20%** | $583,750+ |

**Additional 3.8% Net Investment Income Tax (NIIT):** High earners pay an extra 3.8% on investment income (including capital gains) if Modified AGI > $250,000 (MFJ), bringing the effective top rate to **23.8%** (20% + 3.8%).

**Short-Term Capital Gains:** Taxed as ordinary income (10%–37% depending on your bracket).

**Important:** Holding period: Assets must be held > 1 year to qualify for long-term rates.

### Social Security & Medicare Payroll Taxes (2026)

| Tax Type | Employee Rate | Employer Rate | Wage/Income Limit (2026) |
|----------|---------------|---------------|--------------------------|
| **Social Security (OASDI)** | 6.2% | 6.2% | $184,500 |
| **Medicare (HI)** | 1.45% | 1.45% | No limit |
| **Additional Medicare Tax** | +0.9% over $250k (MFJ) | — | $250,000+ for MFJ |

**Combined FICA (Employee):** 7.65% (6.2% + 1.45%) up to $184,500; then 1.45% + 0.9% = 2.35% on income above $250,000 (MFJ).

**Maximum Social Security Tax per employee:** $11,439 (6.2% × $184,500).

**Self-Employed:** Pay the employer and employee portions (15.3% total for SS + Medicare up to $184,500; then 2.9% + 0.9% = 3.8% on income above $250,000 for MFJ).

### State Income Tax — Washington

**No state income tax** on wages, salaries, or most personal income (rate = **0%**).

**Washington Capital Gains Tax (7%):**
- Applies to capital gains exceeding $250,000 in a tax year (7% state capital gains tax).
- Does NOT apply to real estate or retirement account gains.
- For capital gains under $250,000/year: effectively 0% (no state tax).

---

## 3. Retirement Planning Formulas & Concepts

### Compound Growth Formula (Future Value)

```
FV = PV × (1 + r)^n
```

Where:
- **FV** = Future Value (projected balance)
- **PV** = Present Value (starting balance or initial contribution)
- **r** = Annual return rate (as a decimal; e.g., 0.07 for 7%)
- **n** = Number of years

**For regular annual contributions (Future Value of Annuity):**

```
FV = PMT × [((1 + r)^n - 1) / r]
```

Where:
- **PMT** = Annual contribution amount
- **r** = Annual return rate
- **n** = Number of years

**Application:** Use to project 401(k), IRA, and investment account balances over time.

### The 4% Rule (Safe Withdrawal Rate)

**Definition:** In retirement, you can withdraw 4% of your initial portfolio balance in year 1, then adjust that dollar amount for inflation each subsequent year, with a high likelihood your portfolio will last 30+ years.

**Formula:**
```
Year 1 Withdrawal = Starting Portfolio × 0.04
Year 2+ Withdrawal = Prior Year Withdrawal × (1 + inflation_rate)
```

**Current Debate (2026):** The 4% rule originates from the 1994 "Trinity Study." Modern advisors debate its continued safety due to:
- Higher recent inflation (2022–2025 saw CPI above historical norms).
- Lower bond yields.
- Longer life expectancy.

**Alternative Safe Rates (2026 Guidance):**
- **Conservative:** 3.0–3.5% (safer for 50+ year horizons).
- **Moderate:** 3.5–4.0% (balanced for 30–40 year horizons).
- **Flexible Withdrawal:** Adjust withdrawals based on annual market performance (e.g., reduce spending in bear markets, increase modestly in bull markets).

**Recommendation for ma-finance:**
- Default: **3.5%** (middle ground between classic 4% and modern caution).
- Allow user input: **3.0% (conservative) to 4.5% (optimistic)** as a range.
- Caveat: Emphasize this is a guideline, not a guarantee. Consult a financial advisor for personal strategy.

### Social Security Benefit Estimation (Simplified)

**Factors:**
- Full Retirement Age (FRA): Age 67 for those born in 1960 or later.
- Current annual benefit at FRA: Average is ~$23,000–$30,000 (varies widely by earnings history).
- Claiming age adjustment:
  - Claim at 62: ~70% of FRA benefit (reduced).
  - Claim at 67 (FRA): 100% of benefit.
  - Claim at 70: ~124% of FRA benefit (increased; maximum credits).

**Simplified Approach for ma-finance:**
1. Ask user for their estimated annual Social Security benefit (available on ssa.gov).
2. Show impact of different claiming ages (62, 67, 70).
3. Calculate cumulative benefit (e.g., total lifetime received) by various claim ages.

**Note:** Full Social Security calculation requires detailed earnings history and is beyond this tool's scope. Recommend users verify their benefit estimate at ssa.gov.

### Required Minimum Distribution (RMD)

**Starting Age (2026):** Age 73 (changed from 72 under SECURE 2.0 Act).

**Formula:**
```
RMD = Account Balance (Dec 31 of prior year) ÷ Distribution Period (IRS Uniform Lifetime Table)
```

**Example (Age 73 in 2026):**
- Account balance Dec 31, 2025: $300,000.
- IRS Uniform Lifetime Table divisor for age 73: 26.5.
- RMD = $300,000 ÷ 26.5 = $11,320.75.

**Deadline:**
- First RMD (when you turn 73): Due by April 1 of the year following (e.g., April 1, 2027).
- Subsequent RMDs: Due by December 31 each year.

**Applies to:** Traditional 401(k)s, Traditional IRAs, SEP IRAs, SIMPLE IRAs, and most qualified retirement plans. Roth IRAs have no RMD during the owner's lifetime (but beneficiaries face RMD).

### Inflation Adjustment (Consumer Price Index)

**Current 2026 Inflation Rate (CPI):** ~2.7% annual average (as of April 2026).

**Recent Historical Context:**
- 2021: 4.7%
- 2022: 8.0%
- 2023: 4.1%
- 2024: 2.9%
- 2025: 2.6%

**Long-Term Historical Average:** ~2% to 3% annually (post-WWII era).

**Use in Calculations:**
- Adjust withdrawals annually by inflation rate.
- Project future costs (e.g., housing, healthcare) by applying inflation multiplier.
- Formula: `Future_Cost = Current_Cost × (1 + inflation_rate)^n`

**Default Assumption for ma-finance:** Use **2.5%** as a balanced long-term inflation assumption (slightly below current, slightly above historical post-WWII average).

---

## 4. Housing & Mortgage Data (2026)

### Current Mortgage Rates (As of April 25, 2026)

| Loan Type | Current Rate Range | Notes |
|-----------|-------------------|-------|
| **30-year Fixed** | 6.15%–6.28% | Slight downward trend in April 2026 |
| **15-year Fixed** | 5.55%–5.64% | Typically 0.5%–0.75% lower than 30-year |

**Important:** Rates vary by lender, credit score, loan size, and market conditions. Always get quotes from multiple lenders.

**Default Assumption:** Use **6.25%** (30-year) and **5.60%** (15-year) as mid-range scenarios.

### Property Tax — Seattle / King County (Puget Sound)

| Metric | Value |
|--------|-------|
| **King County Effective Rate** | 0.85%–1.0% of assessed value |
| **Seattle Median Effective Rate (2025)** | ~0.98% |
| **Typical Range in Seattle** | 0.8%–1.2% depending on neighborhood |
| **Example: $900,000 home** | ~$8,000–$9,000/year |

**Variability:** Property taxes depend on local levies (schools, parks, city, county). Use **0.95%** as default for planning purposes.

### Homeowners Insurance — Seattle Metro (2026)

| Coverage | Annual Cost |
|----------|------------|
| **Median Annual Premium** | ~$1,466 |
| **Monthly Average** | ~$122 |
| **Coverage Basis** | $300,000 dwelling, $100,000 liability, $1,000 deductible |

**Context:** This is lower than the U.S. average (~$2,582/year) due to lower risk profile in the Seattle area.

**Factors Affecting Cost:**
- Home age, construction type, location.
- Credit score.
- Deductible amount.
- Coverage limits.

**Default Assumption:** Use **$1,500–$1,700/year** for typical homes in the Seattle area; adjust based on home value and specifics.

### Private Mortgage Insurance (PMI) — When Down Payment < 20%

| Category | Details |
|----------|---------|
| **PMI Annual Rate Range** | 0.3%–1.5% of original loan amount |
| **Most Common Range** | 0.5%–1.5% annually |
| **Removal Threshold** | Drops automatically at 78% LTV; can request removal at 80% LTV |

**Example (10% down on $400,000 home with strong credit):**
- Loan amount: $360,000.
- PMI rate: ~0.5%/year.
- Annual PMI cost: $360,000 × 0.5% = $1,800 ($150/month).

**PMI Varies By:**
- **Credit score** (higher = lower PMI).
- **Loan-to-Value ratio** (lower down payment = higher LTV = higher PMI).
- **Lender** (shop for best rates).

**Default Assumption:** For planning, use **0.6%–0.8%** annual rate on the loan amount (assumes good credit and 10%–15% down).

### Closing Costs

| Component | Percentage of Purchase Price |
|-----------|------------------------------|
| **Total Closing Costs** | 2%–5% |
| **Typical Range** | 2%–3% for buyers in Washington state |

**Includes:** Lender fees (processing, appraisal, underwriting), title services, attorney fees, government recording fees, property taxes, homeowners insurance prepayment.

**Example ($400,000 home):**
- Low estimate (2%): $8,000.
- Mid estimate (3%): $12,000.
- High estimate (5%): $20,000.

**Default Assumption:** Use **3%** for Seattle area (mid-range estimate).

### Home Appreciation

| Timeframe | Appreciation Rate | Notes |
|-----------|-------------------|-------|
| **Last 5 years (2021–2026)** | ~2.4%/year (annualized) | Reflects market cooling after 2020–2021 boom |
| **10-year average (King County)** | ~5–6%/year | Includes post-2008 recovery period |
| **20-year long-term average** | ~5–7%/year | Typical long-term Seattle metro appreciation |
| **National long-term average** | ~3–4%/year | For comparison; Seattle typically outpaces |

**Current Market Context (2026):** Slower appreciation than 2010–2022 boom; market is more normalized.

**Default Assumption for ma-finance:**
- **Conservative:** 2.5%/year (market slowdown scenario).
- **Moderate (Recommended):** 3.5%/year (balanced, slightly below long-term average).
- **Optimistic:** 5%/year (recovery to historical average).

---

## 5. Renovation ROI & Home Improvement Data (2026)

### Renovation Return on Investment (National Averages)

| Project | ROI Range | Typical Cost | Annual Energy Savings (if applicable) |
|---------|-----------|--------------|--------------------------------------|
| **Minor Kitchen Remodel** (cosmetic) | 81–113% | $14k–$41k | $0 (cosmetic) |
| **Major Kitchen Remodel** (full update) | 60–66% | $65k+ | $0–$500 (if appliance upgrade) |
| **Midrange Bathroom Remodel** | 67–74% | $6k–$25k | $0 (cosmetic) |
| **Vinyl Window Replacement** | 73–89% | $17k–$20k (whole house) | $200–$400/year |
| **HVAC System Replacement** | 60–63% | $8.5k–$12k | $500–$1,200/year (efficiency gains) |
| **Garage Door Replacement** | ~194% (highest) | $3k–$8k | $0 (cosmetic) |

**Key Insights:**
- **Minor updates outperform luxury remodels:** Simple cosmetic refreshes (paint, fixtures, new countertops without layout change) have higher ROI than high-end custom work.
- **Market dependent:** Local market conditions and comparable home values affect ROI. Always compare to similar homes in your area.
- **Personal vs. Resale:** Highest-ROI projects (like new garage door) may lack personal appeal; plan based on your timeline (are you selling soon?).
- **ROI decreases at higher price points:** A $100k kitchen remodel typically returns less than a $40k minor remodel (percentage-wise).

### Window Replacement (Deeper Dive)

| Aspect | Details |
|--------|---------|
| **Average Cost per Window** | $300–$1,500 |
| **Whole-House Cost (10–20 windows)** | $17k–$20k (vinyl; higher for wood/composite) |
| **ROI** | 73–89% |
| **Annual Energy Savings** | $200–$400 (depending on climate, old windows, usage) |
| **Payback Period (energy alone)** | 40–100 years (longer); justification is more about comfort and aesthetics |

**Decision Guide:**
- **Replace now if:** Windows are failing (seals broken, condensation between panes, drafts), and you're staying in the home 10+ years.
- **Defer if:** Windows are aging but functional; prioritize other projects with better ROI if selling soon.

### HVAC Replacement (Deeper Dive)

| Aspect | Details |
|--------|---------|
| **Average System Cost** | $8,500–$12,000 (installation included) |
| **ROI** | 60–63% |
| **Annual Energy Savings** | $500–$1,200 (new efficient system vs. old) |
| **Lifespan** | 15–20 years |
| **Payback Period** | 7–24 years (depends on age of current system and efficiency gains) |

**Decision Guide:**
- **Replace now if:** Current system is 15+ years old, failing, or costing >$2k/year in repairs. New efficient system qualifies for federal tax credits (~30% through 2032).
- **Defer if:** System is <10 years old and running well; maintenance is more cost-effective.

### When "Live With It" Makes Sense vs. Replace Now

| Scenario | Recommendation |
|----------|-----------------|
| **Old windows but functional, not selling soon** | **Live with it.** Window replacement ROI is mediocre on resale; comfort/efficiency gains are slow to recoup. Unless severe drafts/condensation, defer. |
| **HVAC 8 years old, occasional repairs** | **Live with it** (for now). Monitor costs; replace if annual repairs exceed $1,500–$2,000, or system age hits 15+ years. |
| **Kitchen cosmetically dated, functional layout** | **Minor cosmetic refresh ($15k–$25k).** High ROI, low risk. Full remodel often wastes money on preferences buyers won't pay for. |
| **Selling home within 1–2 years** | **Prioritize high-ROI cosmetics (paint, fixtures, curb appeal).** Avoid major structural projects unless inspection reveals critical issues. |
| **Planning to stay 20+ years** | **Prioritize efficiency & functionality for long-term enjoyment and utility bill reduction.** ROI matters less when you'll benefit from the system for decades. |

---

## 6. Default Values & Ranges for App Inputs

### Income & Employment

| Input | Default | Conservative | Optimistic | Notes |
|-------|---------|--------------|-----------|-------|
| **Annual Salary (Microsoft employee)** | $200,000 | $150k | $280k | Tech salary range; adjust for level/tenure |
| **Spouse Annual Salary** | $120,000 | $80k | $180k | Flexible; user input |
| **Annual Bonus (if applicable)** | 0 | 0 | 30% of salary | Variable; defaults to $0; user input |
| **Cost of Living Increase** | 2.5% | 1.5% | 3.5% | Annual salary growth assumption |

### Retirement Savings

| Input | Default | Conservative | Optimistic | Notes |
|-------|---------|--------------|-----------|-------|
| **401k Contribution (annual)** | $24,500 | $12,000 | $32,500 | User can max out ($24,500 under 50) |
| **Employer Match** | $12,250 | $6,000 | $12,250 | Microsoft: 50% up to limit |
| **IRA Contribution (annual)** | $7,500 | $0 | $7,500 | Per person; user specifies Traditional or Roth |
| **Backdoor Roth (mega backdoor)** | $0 | $0 | $40,000 | Optional; not default; user input |
| **Current 401k Balance** | $150,000 | $50k | $300k | User input; varies widely by age/tenure |

### Investment Returns (Annual %)

| Portfolio Type | Default | Conservative | Optimistic | Notes |
|----------------|---------|--------------|-----------|-------|
| **Conservative (80% bonds, 20% stocks)** | 4% | 3% | 5% | Lower risk, lower return |
| **Moderate (60/40 stocks/bonds)** | 6% | 5% | 7% | Balanced; most common assumption |
| **Aggressive (80% stocks, 20% bonds)** | 8% | 7% | 10% | Higher volatility, higher long-term return |
| **S&P 500 Historical Average** | 10% | 9% | 11% | 20+ year average pre-inflation |

**Guidance:** Use **6% (Moderate)** as default scenario. Provide options for users to run Conservative and Optimistic cases.

### Inflation & Cost Growth

| Input | Default | Range | Notes |
|-------|---------|-------|-------|
| **General Inflation Rate** | 2.5% | 1.5%–3.5% | Apply to most expenses (groceries, general costs) |
| **Healthcare Inflation** | 3.5% | 2.5%–5% | Medical expenses typically grow faster than CPI |
| **Housing Cost Growth** | 2.5% | 1.5%–3.5% | Property taxes, insurance, maintenance (not home appreciation) |
| **Property Tax Rate** | 0.95% | 0.85%–1.1% | King County Seattle area |

### Housing

| Input | Default | Conservative | Optimistic | Notes |
|-------|---------|--------------|-----------|-------|
| **Home Purchase Price** | $800,000 | $500k | $1,200k | Seattle metro typical range |
| **Down Payment %** | 20% | 15% | 30% | 20% avoids PMI; <20% triggers PMI |
| **Mortgage Interest Rate** | 6.25% | 5.75% | 6.75% | 30-year; adjust based on credit/market |
| **Mortgage Term (years)** | 30 | 15 | 30 | User choice |
| **Property Tax Rate** | 0.95% | 0.90% | 1.05% | Seattle/King County typical |
| **Homeowners Insurance** | $1,600/year | $1,400 | $1,900 | Varies by home age, coverage, location |
| **HOA Fees (if applicable)** | $0 | $0 | $300/month | User input; $0 if not applicable |
| **Annual Maintenance Budget** | 1% of home value | 0.75% | 1.25% | Rule of thumb; older homes = higher % |
| **Home Appreciation Rate** | 3.5% | 2.5% | 5% | Seattle metro long-term average |

### Retirement & Withdrawal

| Input | Default | Conservative | Optimistic | Notes |
|-------|---------|--------------|-----------|-------|
| **Safe Withdrawal Rate (SWR)** | 3.5% | 3% | 4% | % of initial portfolio to withdraw annually |
| **Desired Retirement Age** | 65 | 62 | 70 | User choice; affects total savings needed |
| **Expected Lifespan** | 95 | 90 | 100 | Used for RMD calculations and planning horizon |
| **Social Security Claim Age** | 67 | 62 | 70 | Full Retirement Age = 67 for many; can claim 62–70 |
| **Estimated Annual SS Benefit** | $30,000 | $20k | $40k | User looks up on ssa.gov; varies widely |

### Renovation & Improvement

| Input | Default | Conservative | Optimistic | Notes |
|-------|---------|--------------|-----------|-------|
| **Kitchen ROI Assumption** | 75% | 60% | 85% | Minor remodel; user can adjust |
| **Bathroom ROI Assumption** | 70% | 67% | 74% | Midrange remodel |
| **Window Replacement ROI** | 80% | 73% | 89% | Whole-house vinyl |
| **HVAC Replacement ROI** | 62% | 60% | 63% | System replacement |
| **Annual Utility Savings (windows)** | $300 | $200 | $400 | Depends on current efficiency, climate usage |
| **Annual Utility Savings (HVAC)** | $800 | $500 | $1,200 | Efficiency gains from new system |

---

## 7. Key Formulas Used in Calculations

### Net Pay Calculation (Annual)

```
Gross Salary = W-2 Income + Bonus
Pre-tax Deductions = 401k Contribution + HSA + Other
Taxable Income = Gross - Standard Deduction - Pre-tax Deductions
Federal Income Tax = Tax from Brackets
FICA Tax = 7.65% up to $184,500 (SS) + 1.45% all income (Medicare)
State Income Tax = 0% (Washington) [unless high capital gains]
Net Pay = Gross - Federal Tax - FICA - State Tax - Post-tax Deductions (HSA, insurance, etc.)
```

### Mortgage Payment (Monthly)

```
M = P × [r(1 + r)^n] / [(1 + r)^n - 1]

Where:
M = Monthly payment
P = Principal (loan amount)
r = Monthly interest rate (annual rate / 12)
n = Total number of payments (years × 12)
```

**Example:** $320,000 loan at 6.25% for 30 years:
- Monthly rate: 6.25% / 12 = 0.520833%.
- n = 30 × 12 = 360 months.
- M ≈ $1,974 (plus property tax, insurance, PMI if applicable).

### Total Home Cost (Annual)

```
Total Annual Home Cost = Mortgage Payment (×12) + Property Tax + Insurance + HOA + Maintenance
```

Or over 30 years (considering appreciation):

```
Net Home Cost = (Total Paid Over 30 Years) - Home Value at Sale + Selling Costs
```

### Retirement Portfolio Projection

```
Year 0: Starting Balance
Year 1: (Starting + Annual Contribution) × (1 + Return Rate)
Year 2: (Prior Year + Annual Contribution) × (1 + Return Rate)
...repeat...
Year N: (Prior Year + Annual Contribution) × (1 + Return Rate)
```

**Simplified Compound Growth:**
```
Projected Balance = Starting Balance × (1 + Annual Return)^Years + 
                    Annual Contribution × [((1 + Annual Return)^Years - 1) / Annual Return]
```

---

## 8. Decision Notes: Debatable Values & Assumptions

### Safe Withdrawal Rate (3.5% vs. 4%)

**The Debate:** The classic 4% rule (Trinity Study, 1994) is under scrutiny in 2026 due to:
- **Higher inflation** (2022–2025 saw CPI > 4% most of the time).
- **Lower bond yields** (reducing portfolio diversification safety).
- **Longer lifespans** (requiring portfolios to last 40+ years instead of 30).

**Decision:** **Default to 3.5%** in ma-finance as a cautious middle ground.
- More conservative than classic 4%.
- More optimistic than ultra-safe 3%.
- Allows flexibility: Users can adjust up to 4% if comfortable, down to 3% if very conservative.

**Reasoning:** A Microsoft employee likely has above-average risk tolerance and financial literacy. Starting at 3.5% leaves room to adjust upward if early retirement experience shows spending is lower than expected.

### Home Appreciation Rate (3.5%/year)

**The Debate:** Seattle metro appreciation ranges from 2.4% (recent 5-year average) to 7% (long-term average).

**Decision:** **Default to 3.5%** (middle ground between recent slowdown and long-term average).
- Reflects market normalization post-2021 boom.
- Slightly below long-term average (conservative).
- Seattle metro typically outpaces national average (~3%), so 3.5% is realistic.

**Reasoning:** 3.5% is defensible as a long-term assumption without being overly optimistic (like 5%+) or pessimistic (like 2%).

### Expected Investment Return (6% for Moderate Portfolio)

**The Debate:** S&P 500 historical average is ~10% (pre-inflation). Typical moderate portfolio (60/40) averages 6–7%.

**Decision:** **Default to 6%** for Moderate portfolio (60% stocks, 40% bonds).
- Conservative vs. historical S&P 500 average.
- Reasonable after inflation and fees.
- Aligns with modern financial advisor recommendations.

**Reasoning:** 6% is achievable with a low-cost index fund strategy (e.g., Vanguard total market + bond index). It's cautious enough to not over-promise, but realistic for long-term planning.

### Inflation Rate (2.5% long-term)

**The Debate:** 2026 CPI is running ~2.7%, but historical post-WWII average is ~2–3%. Federal Reserve target is 2%.

**Decision:** **Default to 2.5%** for long-term inflation assumption.
- Between historical average (2%) and current rate (~2.7%).
- Close to Fed target; suggests stabilization.
- Conservative vs. recent years (2022–2025 higher).

**Reasoning:** 2.5% is the long-term anchor. Users can adjust if they expect deflation (unlikely) or sustained higher inflation.

### Mortgage Rate (6.25% for 30-year)

**The Debate:** As of April 25, 2026, rates are 6.15%–6.28%. Fed policy, inflation, and global factors determine future rates.

**Decision:** **Default to 6.25%** (mid-range of current market).
- Realistic for good credit; adjusts based on credit score and terms.
- Allows upside/downside scenarios (5.75%–6.75%).

**Reasoning:** 6.25% reflects current market without predicting future Fed moves. Users can adjust if they expect rate changes.

---

## 9. Sources & Methodology

**Data Sources:**
- **IRS (irs.gov):** 401(k), IRA, tax bracket, capital gains, RMD rules for 2026.
- **Social Security Administration (ssa.gov):** SS wage base, benefits estimation.
- **Freddie Mac, Zillow, Mortgage Daily:** Current mortgage rates (as of April 25, 2026).
- **King County Assessor, Seattle Real Estate Data:** Property taxes, home appreciation rates.
- **Cost vs. Value Report (2026), Angi.com, HomeAdvisor:** Renovation ROI data.
- **U.S. Bureau of Labor Statistics:** Inflation (CPI) data.
- **SHRM, IRS Publications, Financial industry reports:** Employer match practices, safe withdrawal rates.

**Verification Approach:**
- Cross-referenced multiple sources for each data point.
- Focused on 2026-specific data; used 2025 data as fallback where 2026 not yet available.
- Consulted recent academic studies (Trinity Study updates, Morningstar withdrawal research) for debatable assumptions.

**Maintenance & Updates:**
- This document reflects data as of **April 25, 2026**.
- Tax law and contribution limits change annually; review IRS.gov each January.
- Mortgage rates, home appreciation, and inflation rates vary monthly; update based on current market data.
- Renovation ROI data refreshes annually; use most recent Cost vs. Value report available.

---

## 10. Guidance for Linus (Engine Dev)

### Implementation Notes

1. **Parameterize All Numbers:** Store all limits, rates, and percentages as named constants or a configuration file (e.g., `tax-rates.json`, `retirement-limits.json`). This makes it easy to update annually and to implement scenario analysis (e.g., "what if mortgage rate is 5%?").

2. **Build Flexible Formulas:** Use the compound growth and mortgage payment formulas from Section 7 as templates. Ensure users can toggle between scenarios (conservative, moderate, optimistic).

3. **Validate User Inputs:** 
   - Age: 18–100.
   - Salary: $0–$1M+ (no upper limit, but flag outliers).
   - Contribution percentages: 0–100%.
   - Investment returns: -10% to +20% (allow flexibility; realistic ranges are narrower, but edge cases happen).

4. **Handle Edge Cases:**
   - **Income above Roth IRA limit:** Offer backdoor Roth explanation.
   - **Income above Microsoft match limit:** Clarify catch-up rules for 50+.
   - **Down payment < 20%:** Calculate PMI automatically.
   - **High earners near NIIT threshold ($250k MFJ):** Flag additional Medicare tax.

5. **Annual Review Checklist:**
   - January: Verify new IRS limits (401k, IRA, tax brackets).
   - Quarterly: Check mortgage rates and home appreciation data for Seattle.
   - Annually: Update inflation rate, Social Security wage base, renovation ROI data.

### Recommended Scenario Structure

**Default Scenario (Recommended for First-Time Users):**
- Microsoft employee income: $200k/year.
- Spouse income: $120k/year.
- 401k max-out: $24,500 + employer match $12,250.
- Mortgage: $800k home, 20% down, 6.25%, 30-year.
- Withdrawal rate: 3.5%.
- Market return: 6% (Moderate).
- Home appreciation: 3.5%/year.
- Inflation: 2.5%/year.

**Optimistic Scenario:**
- Same income; spouse gets 10% annual raise.
- 401k max + mega backdoor Roth $40k.
- Mortgage: $1M home, 30% down, 5.75%, 15-year.
- Withdrawal rate: 4%.
- Market return: 8% (Aggressive).
- Home appreciation: 5%/year.

**Conservative Scenario:**
- Same income; no annual raise.
- 401k contribution: $15k only.
- Mortgage: $600k home, 25% down, 6.75%, 30-year.
- Withdrawal rate: 3%.
- Market return: 4% (Conservative).
- Home appreciation: 2.5%/year.

---

## Appendix: Retirement Account Type Comparison

| Feature | Traditional 401k | Roth 401k | Traditional IRA | Roth IRA |
|---------|-----------------|-----------|-----------------|----------|
| **Contribution Limit (2026)** | $24,500 | $24,500 | $7,500 | $7,500 |
| **Catch-up (50+)** | $8,000 | $8,000 | $1,100 | $1,100 |
| **Tax Treatment** | Pre-tax (deductible) | Post-tax (no deduction) | Pre-tax (deductible*) | Post-tax (no deduction) |
| **Withdrawals in Retirement** | Taxable | Tax-free | Taxable | Tax-free |
| **RMD at Age 73** | Yes | Yes | Yes | No (during owner's lifetime) |
| **Income Limit for Contribution** | None | Income-based | None (deduction-limited by income) | $242k–$252k (MFJ) |
| **Employer Match** | Yes (common) | No | N/A | N/A |
| **Early Withdrawal Penalty (before 59.5)** | Yes (10% + tax) | Yes (10% + tax) | Yes (10% + tax) | Can withdraw contributions penalty-free |
| **Best For** | High earners, immediate tax savings | High earners (Roth conversion strategy) | Self-employed, no workplace plan | Long-term growth, tax-free growth, flexibility |

---

**End of Document**

*Compiled by Saul (Finance Analyst) on April 25, 2026*  
*Source of truth for ma-finance financial accuracy and scenario planning*
