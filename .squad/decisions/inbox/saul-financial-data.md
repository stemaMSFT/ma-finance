# Saul — Financial Data Decisions

**Date:** April 25, 2026  
**Status:** Active  
**Author:** Saul (Finance Analyst)  

---

## Decision 1: Safe Withdrawal Rate Default (3.5% vs. 4%)

**Context:**
The 4% rule (Trinity Study, 1994) is the classic retirement planning guideline, but 2026 economic conditions raise questions about its continued safety.

**Key Factors:**
- **2026 Inflation (2.7% annualized)** is above historical post-WWII average (~2%).
- **Bond yields are lower** than in 1994, reducing portfolio diversification safety.
- **Longer life expectancy** means portfolios must support 40+ year retirements, not just 30.
- **Modern research** (Morningstar, Vanguard) suggests 3.3%–3.8% may be safer for new retirees.

**Decision:**
**Default withdrawal rate = 3.5%** (middle ground between classic 4% and modern caution).

**Rationale:**
- Conservative enough to reduce sequence-of-returns risk.
- Realistic for a Microsoft employee (above-average financial literacy).
- Allows users to adjust: Up to 4% if comfortable, down to 3% if very conservative.
- Leaves room for flexibility: Can increase withdrawals if spending is lower than expected or markets perform well.

**Implementation:**
- App default: 3.5%.
- User-adjustable range: 3.0%–4.5%.
- Caveat in UI: "This is a guideline, not a guarantee. Consult a financial advisor for your personal situation."

---

## Decision 2: Home Appreciation Rate (3.5%/year)

**Context:**
Seattle metro home appreciation varies widely depending on timeframe:
- **Last 5 years (2021–2026):** ~2.4%/year (market cooling after 2020–2021 boom).
- **10-year average (King County):** ~5–6%/year.
- **20-year long-term average:** ~5–7%/year.

**Key Factors:**
- Recent market correction (2023–2025) suggests slower appreciation going forward.
- Long-term fundamentals (tech job growth, limited housing supply in Seattle) support continued above-national-average appreciation.
- Uncertainty about Fed policy, recession risk, and interest rate trajectory.

**Decision:**
**Default home appreciation rate = 3.5%/year** (long-term assumption for planning).

**Rationale:**
- Mid-point between recent slowdown (2.4%) and long-term average (5–7%).
- Conservative without being pessimistic.
- Seattle metro typically outpaces national average (~3%), so 3.5% is defensible.
- Allows scenario analysis: Conservative (2.5%), Moderate (3.5%), Optimistic (5%).

**Implementation:**
- App default: 3.5%.
- User-adjustable range: 2%–7%.
- Note: This is separate from annual maintenance/cost growth (1% of home value).

---

## Decision 3: Expected Investment Return for Moderate Portfolio (6%/year)

**Context:**
- S&P 500 historical average (20+ years, pre-inflation): ~10%/year.
- Typical moderate portfolio (60% stocks / 40% bonds): ~6–7%/year.
- Post-inflation real return: ~3–4%/year (historically).

**Key Factors:**
- 10% is unrealistic for a conservative/moderate portfolio (that's equity-heavy).
- 6% is achievable with low-cost index funds (Vanguard, Fidelity).
- Accounts for fees (~0.1%–0.5% for index funds), inflation drag, and sequence-of-returns risk.
- Modern advisors typically recommend 5–7% for balanced portfolios.

**Decision:**
**Default expected return for Moderate portfolio (60/40) = 6%/year**.

**Rationale:**
- Conservative vs. historical S&P 500 average (avoids over-promising).
- Realistic for low-cost index strategy (no active management premium assumed).
- Aligns with modern financial advisor recommendations.
- Leaves room for scenarios: Conservative (4%), Moderate (6%), Aggressive (8%).

**Implementation:**
- App default for Moderate: 6%.
- Conservative portfolio: 4%/year.
- Aggressive portfolio: 8%/year.
- Note: Emphasize that historical returns don't guarantee future results; markets are volatile.

---

## Decision 4: Long-Term Inflation Rate (2.5%/year)

**Context:**
- 2026 CPI: ~2.7% (elevated from pre-2022 norms).
- Historical post-WWII average: ~2–3%/year.
- Federal Reserve target: 2%/year.
- Recent volatility (2022: 8%, 2023: 4.1%, 2024: 2.9%, 2025: 2.6%): suggests return to normal.

**Key Factors:**
- Long-term inflation assumption should reflect Federal Reserve policy target (2%).
- Recent elevation (2022–2025) was anomalous due to pandemic/supply chain disruption.
- 2.5% balances Fed target (2%) with recent reality (~2.7%); serves as a middle ground.
- Impacts retirement planning, expense projections, and purchasing power calculations.

**Decision:**
**Default long-term inflation rate = 2.5%/year** for general expenses.

**Rationale:**
- Between Fed target (2%) and current rate (~2.7%).
- Reflects expectation of stabilization toward historical norms.
- Conservative vs. recent years (avoids over-optimism).
- Users can adjust for specific scenarios: Low inflation (1.5%), High inflation (3.5%).

**Special Rates:**
- **Healthcare inflation:** 3.5%/year (typically higher than CPI).
- **Property tax / housing costs:** 2.5%/year (aligned with general inflation).

**Implementation:**
- App default: 2.5% for most costs.
- Allow user adjustment: 1%–4%/year range.
- Separate inputs for healthcare, housing if granular planning desired.

---

## Decision 5: Default Mortgage Rate (6.25% for 30-year)

**Context:**
As of April 25, 2026, market rates are 6.15%–6.28%. Rates depend on:
- Federal Reserve policy, inflation outlook, and market volatility.
- Individual credit score, loan size, and down payment.

**Key Factors:**
- 6.25% is mid-range of current market (reasonable middle ground).
- Rates vary by credit score: excellent credit might get 6.0%–6.1%, fair credit 6.5%–6.7%.
- 15-year rates are typically 0.5%–0.75% lower than 30-year (e.g., 5.60% for 15-year).
- Predicting Fed rate moves is speculative; using current market is most defensible.

**Decision:**
**Default mortgage rate = 6.25% for 30-year fixed; 5.60% for 15-year fixed**.

**Rationale:**
- Reflects current (April 2026) market for borrowers with good credit.
- Mid-point of observed range; defensible without predicting Fed policy.
- Allows scenarios: Low-rate (5.75%), Current (6.25%), High-rate (6.75%).
- 15-year rate scaled appropriately (0.65% discount).

**Implementation:**
- App default: 6.25% (30-year), 5.60% (15-year).
- User-adjustable range: 5%–7.5% (covers realistic range given credit / market conditions).
- Note: Actual rates vary by lender, credit score, and down payment. Users should shop for quotes.

---

## Decision 6: Property Tax Rate for Seattle/King County (0.95%)

**Context:**
- King County effective rate: 0.85%–1.0% of assessed value.
- Seattle median (2025): ~0.98%.
- Varies by neighborhood due to local levies (school districts, parks, city, county).

**Key Factors:**
- 0.95% is just under the Seattle median; reasonable default.
- Property tax rates are set by local jurisdiction and levied annually; not fixed.
- Varies by specific address (school district, city vs. unincorporated).
- Higher than national average (~0.8%) but typical for Puget Sound.

**Decision:**
**Default property tax rate = 0.95% of home value (annually)**.

**Rationale:**
- Mid-point of observed Seattle range (0.85%–1.0%).
- Slightly conservative (below median 0.98%, accounting for variability).
- Allows scenarios: Low tax (0.85%), Mid (0.95%), High tax (1.1%).

**Implementation:**
- App default: 0.95%.
- User-adjustable range: 0.75%–1.2% (covers typical Puget Sound variation).
- Note: Users should verify actual tax rate for their specific property (county assessor website).

---

## Decision 7: Home Insurance Cost ($1,500–$1,700/year)

**Context:**
- Seattle median (based on $300k dwelling coverage): ~$1,466/year.
- U.S. average: ~$2,582/year (higher due to regional risk factors).
- Varies by home age, location, coverage limits, deductible, credit score.

**Key Factors:**
- Seattle is lower-risk region (less weather volatility, lower crime in many areas vs. national average).
- $1,466 is the median for standard coverage; users with older homes or higher-risk locations may pay more.
- Deductible (typically $500–$1,500) impacts premium significantly.

**Decision:**
**Default home insurance = $1,600/year for typical Seattle home**.

**Rationale:**
- Slightly above median ($1,466) to account for variability and inflation.
- Conservative default; allows upside if user finds better rates.
- Allows scenarios: Low ($1,400), Mid ($1,600), High ($1,900).
- Adjustable based on home value, age, and coverage.

**Implementation:**
- App default: $1,600/year.
- User-adjustable range: $1,000–$3,000/year.
- Note: Actual cost depends on specific property and insurer; users should shop.

---

## Decision 8: Annual Maintenance Budget (1% of Home Value)

**Context:**
Industry rule of thumb: Set aside 1% of home value annually for maintenance and repairs.
- Older homes (30+ years): 1.25%–1.5%.
- Newer homes (<10 years): 0.5%–0.75%.
- Average: ~1%.

**Key Factors:**
- Includes routine maintenance (HVAC servicing, roof inspection, gutter cleaning).
- Includes anticipated major repairs (roof replacement, plumbing, electrical in older homes).
- Major renovations (kitchen, HVAC) are separate line items, not maintenance.

**Decision:**
**Default annual maintenance budget = 1% of home value**.

**Rationale:**
- Industry standard; conservative for typical homes.
- Allows adjustment: New homes (0.75%), Average (1%), Older homes (1.25%).

**Implementation:**
- App default: 1% of home value.
- User-adjustable: 0.5%–1.5% based on home age and condition.

---

## Decision 9: Renovation ROI Defaults (Minor Kitchen 75%, Bathroom 70%, Windows 80%, HVAC 62%)

**Context:**
Renovation ROI varies by market, home value, and quality of work. National averages (2026 Cost vs. Value data):
- Minor kitchen: 81–113% (cosmetic refreshes have high ROI).
- Bathroom: 67–74% (ROI depends on scope).
- Windows: 73–89% (energy efficiency appeals to buyers).
- HVAC: 60–63% (necessary but not a high-ROI draw).

**Key Factors:**
- ROI decreases for high-end luxury projects (buyers won't pay premium for subjective preferences).
- Minor cosmetic updates often outperform major remodels.
- Local market affects ROI (Seattle metro real estate strong; high ROI expected).
- ROI is resale-focused; personal enjoyment value is separate.

**Decision:**
**Default ROI assumptions (resale perspective):**
- **Minor kitchen:** 75% (mid-range of 81–113%).
- **Bathroom:** 70% (mid-range of 67–74%).
- **Windows (whole-house vinyl):** 80% (mid-range of 73–89%).
- **HVAC replacement:** 62% (aligned with 60–63%).

**Rationale:**
- Conservative-to-moderate defaults allow room for local variability.
- Users can adjust based on specific project scope and quality.
- Allows scenarios: Low ROI (conservatively assume 60%), Mid (default), High (90%).

**Implementation:**
- App defaults: As listed above.
- User-adjustable: 50%–100% range for each project type.
- Note: ROI assumes good quality work, neutral design choices, and typical Seattle market conditions.

---

## Decision 10: Mega Backdoor Roth — Include as Advanced Option (Not Default)

**Context:**
Microsoft 401(k) plan may permit after-tax contributions and conversions to Roth IRA (mega backdoor strategy).
- Enables contributions beyond $24,500 limit (up to ~$40k additional in 2026).
- Provides high earners additional tax-advantaged savings.
- Complex rules; requires employer plan to support it.

**Key Factors:**
- Not all employers offer mega backdoor; Microsoft's status should be confirmed with HR.
- Complex tax implications (pro-rata rule if Traditional IRA exists).
- Advanced strategy; most users won't use it initially.
- Important for optimistic planning scenarios (maximizing retirement savings).

**Decision:**
**Include mega backdoor Roth as an advanced option; not a default**. Default contribution strategy is standard max-out ($24,500 + employer match $12,250 + IRA $7,500).

**Rationale:**
- Keep default simple for most users.
- Provide toggle/checkbox for advanced users: "Include mega backdoor Roth? (Advanced)".
- If enabled, explain pro-rata rule and need to verify with HR.
- Document in "Advanced Options" section of app.

**Implementation:**
- Standard flow: 401k limit, employer match, IRA.
- Advanced checkbox: "Maximize with mega backdoor Roth ($40k additional)."
- Warning: "Verify with your HR that your plan supports after-tax contributions and Roth conversions. Pro-rata rule may apply if you have a Traditional IRA."

---

## Decision 11: Traditional vs. Roth IRA Default (Income-Dependent)

**Context:**
For 2026, Roth IRA phase-out begins at $242k (MFJ). Higher earners should prioritize:
- **Below $242k:** Roth IRA (tax-free growth, no RMD).
- **Above $252k:** Backdoor Roth (convert Traditional to Roth).

**Key Factors:**
- Microsoft employee income (~$200k+) often triggers Roth phase-out, especially with spouse income.
- Roth is ideal for long-term planning (tax-free withdrawals in retirement, no RMD).
- Backdoor Roth requires annual conversion; slightly more complex.

**Decision:**
**Default: Assume Roth IRA if household income < $242k; offer backdoor Roth explanation if > $242k**.

**Rationale:**
- Roth is generally superior for high earners (tax-free growth, flexibility).
- Flags phase-out automatically; helps users plan around limits.

**Implementation:**
- App question: "Household MAGI?" → If <$242k, default to Roth. If >$242k, offer backdoor Roth explanation.
- Link to IRS backdoor Roth guidance for advanced users.

---

## Decision 12: RMD Starting Age (73) — SECURE 2.0 Compliant

**Context:**
SECURE 2.0 Act increased RMD age from 72 to 73 (effective January 1, 2023).
- Further increase to 75 planned for 2033 (for those age 75 in 2033).
- Affects Traditional 401(k), Traditional IRA, SEP, SIMPLE.
- Roth IRA has no RMD during owner's lifetime.

**Decision:**
**App assumes RMD starting age = 73 for 2026 planning; will update in 2033 if needed**.

**Rationale:**
- Complies with current law.
- Extra 1 year of tax-deferred growth (72→73) benefits users.
- Code can be updated when 2033 change takes effect.

**Implementation:**
- Use age 73 as RMD trigger in retirement projections.
- Formula: RMD = Prior-Year-End Balance ÷ IRS Uniform Lifetime Table Divisor (age 73).
- Note: Explain RMD strategy (e.g., qualified charitable distributions, strategic withdrawals) in retirement planning section.

---

## Open Questions / Future Review

1. **Mega Backdoor Roth Details:** Confirm Microsoft plan support; document rules with HR.
2. **Renovation Energy Savings:** Verify annual utility savings estimates ($200–$400 for windows, $500–$1,200 for HVAC) with utility data for Seattle area.
3. **Federal Tax Law Changes:** Annual IRS announcement (January) confirms 2027 limits; plan for yearly data refresh.
4. **Seattle Metro Market Shifts:** Monitor home appreciation rates quarterly; adjust if trend significantly deviates from 3.5% assumption.

---

**Next Review Date:** January 2027 (after IRS announces 2027 tax limits and contribution maxima).

**Owner:** Saul (Finance Analyst)  
**Approvers:** Linus (Engine Dev), Rusty (UI Designer), Steven (User)
