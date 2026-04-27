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

## Deployment

### GitHub Pages (frontend only — public, no auth)

The app auto-deploys to **https://stemamsft.github.io/ma-finance/** on every push to `main`.
This is the static-only build — no backend, no authentication.

### Render (full app — authenticated, accessible from any device)

The Express backend serves the built React frontend and requires login.
Use this when you want Steven and family to access the app securely from any device.

#### First-time setup

1. **Create a Render account** at https://render.com (free tier is sufficient).
2. **Connect the GitHub repo** `stemaMSFT/ma-finance`.
3. Render will detect `render.yaml` and propose the `ma-finance` web service. Click **Apply**.
4. In the Render dashboard → your service → **Environment**, set these manually:
   - `AUTH_EMAIL` — the shared login email (e.g. `steven@example.com`)
   - `AUTH_PASSWORD_HASH` — bcrypt hash of your password (see below)
   - `SESSION_SECRET` — any long random string (e.g. output of `openssl rand -base64 32`)
5. Click **Manual Deploy** → **Deploy latest commit**.

#### Generating a password hash

```bash
npm run auth:hash
```

Enter your desired password when prompted. Copy the `$2b$...` hash into the `AUTH_PASSWORD_HASH`
environment variable in the Render dashboard.

#### ⚠️ Free tier — data persistence

Render's free tier uses **ephemeral storage** — any scenario data saved to disk is lost on restart
or redeploy. Scenario data lives in memory only. If you need persistence, upgrade to a paid tier
and add a database, or export scenarios before restarting.

---

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
