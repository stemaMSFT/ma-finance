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

**Sources Used:**
- IRS.gov (limits, brackets, RMD rules, tax rates).
- SSA.gov (Social Security wage base, benefit estimation).
- Freddie Mac, Zillow, Mortgage Daily (current mortgage rates).
- King County Assessor, Seattle Real Estate Data (property taxes, appreciation).
- Cost vs. Value, Angi.com, HomeAdvisor (renovation ROI).
- U.S. Bureau of Labor Statistics (CPI/inflation).
- SHRM, Financial industry reports (employer match practices, safe withdrawal rates).
- Morningstar, Vanguard (retirement withdrawal strategy research).
