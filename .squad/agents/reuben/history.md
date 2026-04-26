# Reuben — History

## Project Context
- **App:** ma-finance — personal finance scenario planner for Steven and his wife
- **Stack:** React + TypeScript
- **Scenarios:** Home affordability, renovation vs savings, buy vs rent, market timing
- **User context:** Steven is a Microsoft employee. Wife is co-user. They want to model real estate decisions with both hard numbers and soft factors.

## Learnings

### Real Estate Scenario Design (2026-04-25)

**Scenario Architecture:**
- Three-tier affordability: Conservative (24/32), Comfortable (26/34), Stretch (28/36) — not just "max"
- Renovation framework: Separate energy ROI from resale ROI from QOL impact — they diverge
- Buy vs. rent: Break-even math is 5–6 years Seattle; opportunity cost of down payment matters
- Market timing: Messaging must actively push back against timing obsession; life stage is first filter

**Windows Case Study Insights:**
- Energy ROI in Seattle is weak (20–75 year payback) because winters are mild
- Resale recovery is 15–30% at 3 years, improving to 50–100% at 10+ years
- QOL value (quiet, comfort, reduced drafts) is the real driver, not energy savings
- App must separate "what payback math says" from "what comfort says" — let user decide

**Dual-Income Household Handling:**
- Always show single-income affordability as a "resilience check"
- Variable income (bonuses, RSUs) should be modeled conservatively (base + 50% bonus by year 2)
- At least one income must cover mortgage alone; this isn't negotiable safety-wise

**Guidance Philosophy:**
- Hard numbers (monthly cost, break-even, payback) are app's domain
- Soft factors (comfort, lifestyle, neighborhood feel) are user's domain
- Soft factors matter as much as math, but can't be quantified
- "Sliders and ratings" for soft factors work better than trying to prescribe

**Financing Hierarchy for Renovations:**
- HELOC first (lowest rate, flexible), personal loan second, credit card never
- Never use credit card at 20%+ for a renovation; makes no sense financially

**Market Assumptions (Seattle/Puget Sound):**
- 3.5% annual appreciation (baseline)
- 4% annual rent increases (tech sector demand)
- 5% annual ownership costs (taxes, insurance, maintenance, HOA)
- Break-even: 5–6 years (for this market)

**App Messaging Principles:**
- Honest about limits (energy ROI weak, timing is hard, estimates not promises)
- Practical tradeoffs (show options, don't prescribe)
- Human-centered (acknowledge comfort and lifestyle matter)
- Escalate to professionals for tax, transaction mechanics, loan qualification
