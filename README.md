# ma-finance

Personal finance scenario planner for Steven and family.

## What it does

Interactive tool to model and compare financial decisions:

- **Compensation** — Total comp breakdown (salary, bonus, RSUs, ESPP, 401k match)
- **Retirement** — 401(k) projections, max-out analysis, Roth vs Traditional
- **Home Buying** — Mortgage affordability, payment breakdowns, rate scenarios
- **Renovate vs Save** — Compare renovation ROI against investing the cash

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tooling
- **Recharts** — Data visualization

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

## Project Structure

```
src/
  components/          # React UI (Rusty's domain)
    layout/            # App shell, sidebar navigation
    scenarios/         # Scenario-specific panels
    shared/            # Reusable inputs (sliders, currency fields)
    charts/            # Visualization components
  engine/              # Financial calculations (Linus's domain)
    types.ts           # All TypeScript interfaces
    constants.ts       # 2026 financial constants
    retirement.ts      # 401k / retirement math
    housing.ts         # Mortgage / affordability math
    projections.ts     # Compound growth utilities
  hooks/               # Custom React hooks
  utils/               # General utilities
```
