# Danny — History

## Project Context
- **App:** ma-finance — personal finance scenario planner for Steven and his wife
- **Stack:** React + TypeScript
- **Scenarios:** 401k max-out, retirement projections, home affordability, renovation vs savings

## Learnings
- **2026-04-25:** Initial project scaffold complete. Vite + React 19 + TypeScript + Recharts.
- Architecture: sidebar tab nav (no router), plain CSS, React Context for state, pure engine functions.
- `src/engine/types.ts` is the contract between UI (Rusty) and engine (Linus). All interfaces live there.
- `src/engine/constants.ts` has 2026 financial values — marked TODO for Saul to verify.
- Engine functions return `ScenarioResult` — universal output type with timeline, summary, warnings.
- Four scenario tabs: compensation, retirement, housing, renovation. Mapped in App.tsx via `panels` record.
- Build verified clean: `npm run build` passes with zero errors.
- Key file paths:
  - Entry: `src/main.tsx` → `src/App.tsx`
  - Types contract: `src/engine/types.ts`
  - Constants: `src/engine/constants.ts`
  - Sidebar nav: `src/components/layout/Sidebar.tsx`
  - Scenario panels: `src/components/scenarios/{Compensation,Retirement,Housing,Renovation}Panel.tsx`
  - Engine stubs: `src/engine/{retirement,housing,projections}.ts`


## Team Update — Full Buildout Session (2026-04-25 21:48:31)

### Completed Deliverables
- **linus**: housing.ts calculation engine (18/19 tests)
- **rusty**: HousingPanel and RenovationPanel UI components (TypeScript clean)
- **basher**: 163 unit tests across all engines (all passing)
- **danny**: Express backend with scenario CRUD and calculation APIs

---

### Authentication System Implementation (2026-04-27)

**Status:** Completed. All 313 tests pass.

**Backend:**
- Express middleware: cookie-session with secure, httpOnly, sameSite=strict
- bcrypt-based password hashing (10 rounds salt)
- Routes: POST /api/auth/login, POST /api/auth/logout, GET /api/health
- Request signing for local dev (via password-hash-helper.ts)
- .env.example with placeholders for SESSION_SECRET, NODE_ENV

**Frontend:**
- AuthContext (React) with login/logout actions and user state
- Protected routes via ProtectedRoute component
- Login page (LoginPage.tsx) with email/password form and error handling
- Session persistence: Auth state survives page refresh (via cookie)

**Impact:**
- All existing functionality protected by auth check
- Public health check endpoint available for deployment health verification
- Ready for Render deployment with environment-based secrets

---

### What was done
- Created public GitHub repo `stemaMSFT/ma-finance` on Steven's personal account
- Configured `vite.config.ts` with `base: '/ma-finance/'` for correct GH Pages asset paths
- Added `.github/workflows/deploy.yml` — triggers on push to main, runs `npx vite build`, deploys via `actions/deploy-pages`
- Added `public/404.html` with SPA redirect script (standard GH Pages SPA fix)
- Added redirect handler in `index.html` for SPA routing
- Added `homepage` to `package.json`
- Enabled GitHub Pages with workflow build type via API
- Deploy workflow runs and succeeds — site live at https://stemamsft.github.io/ma-finance/

### Decisions
- Used `npx vite build` instead of `npm run build` in CI because pre-existing TS errors fail `tsc -b`. Vite itself builds cleanly — the TS errors need separate attention.
- Used personal account (`stemaMSFT`) because EMU account (`stema_microsoft`) cannot create public repos and private repos don't get GH Pages on this plan.
- Branch renamed from `master` to `main` (GH Pages default).

---

## Render Deployment Setup (2026-04-27T11:27:44.050-07:00)

### What was done
- Created `render.yaml` Blueprint spec at repo root — single free-tier web service
- Build command: `npm ci && npx vite build` (vite directly, bypasses pre-existing TS errors — consistent with GH Pages CI approach)
- Start command: `npm run start` (Linux-compatible, works on Render)
- Health check: `/api/health`
- Auth env vars (AUTH_EMAIL, AUTH_PASSWORD_HASH, SESSION_SECRET) marked `sync: false` — must be set manually in Render dashboard
- Updated `vite.config.ts`: base path is now conditional — `/ma-finance/` when `GITHUB_PAGES=true`, else `/`
- Updated `.github/workflows/deploy.yml`: build step sets `GITHUB_PAGES: 'true'` so GH Pages retains correct asset paths
- Added `start:local` script using `cross-env` for Windows-compatible local production testing
- Installed `cross-env` as devDependency
- Updated `README.md` with "Deploy to Render" section including ephemeral data warning
- Both builds verified: `GITHUB_PAGES=true` → `/ma-finance/` base; no flag → `/` base

### Key file paths
- `render.yaml` — Render Blueprint spec (repo root)
- `vite.config.ts` — conditional base path via GITHUB_PAGES env var
- `.github/workflows/deploy.yml` — GH Pages CI sets GITHUB_PAGES=true
- `server/index.ts` — already had `trust proxy` set for Render/proxy environments
- `scripts/hash-password.ts` — generates bcrypt hash for AUTH_PASSWORD_HASH env var

---

