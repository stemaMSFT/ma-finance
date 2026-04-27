# Decision: Render Deployment Configuration

**Date:** 2026-04-27T11:27:44.050-07:00  
**Author:** Danny (Lead/Architect)  
**Status:** Implemented

## Context

Steven and his wife need to access the ma-finance app from multiple devices over the internet. The Express backend with authentication is fully working locally. We need a production hosting solution that supports the full-stack (Express + React) with authentication.

## Decision

Deploy the full-stack app on **Render** (free tier) using a Blueprint spec (`render.yaml`).

- GitHub Pages continues to serve the unauthenticated static frontend (existing deployment unchanged)
- Render serves the authenticated full-stack app (Express + built React) for private family use

## Changes Made

| File | Change |
|------|--------|
| `render.yaml` | New Blueprint spec — free web service, `npm ci && npx vite build` build, `npm run start` start, health check `/api/health`, env vars set manually |
| `vite.config.ts` | Base path now conditional: `/ma-finance/` when `GITHUB_PAGES=true`, else `/` |
| `.github/workflows/deploy.yml` | Build step sets `GITHUB_PAGES: 'true'` to preserve GH Pages asset paths |
| `package.json` | Added `start:local` using `cross-env` for Windows dev; added `cross-env` devDep |
| `README.md` | Added "Deploy to Render" section with setup instructions and data persistence warning |

## Key Design Choices

1. **Dual deployment model** — GH Pages (static, public) + Render (full-stack, authenticated). Not merged into one flow. Clear separation of concerns.

2. **`npx vite build` not `npm run build`** in Render build command — consistent with GH Pages CI. The `npm run build` script runs `tsc -b` first, which fails on pre-existing TypeScript errors. `npx vite build` skips the type check and succeeds. The TS errors are a separate tech-debt item.

3. **GITHUB_PAGES env var pattern** — Clean, explicit, no magic. The vite.config reads it at build time. False/absent → `/` (Render). `'true'` → `/ma-finance/` (GH Pages).

4. **Env vars `sync: false`** — AUTH_EMAIL, AUTH_PASSWORD_HASH, SESSION_SECRET are sensitive. They must be entered manually in the Render dashboard. Never committed to source.

5. **`cross-env` for `start:local`** — The production `start` script uses Unix env var syntax which is fine for Render (Linux). Added `start:local` with `cross-env` for Windows developers.

## Consequences

- Render free tier has cold starts (~30s spin-up after idle)
- Storage is ephemeral — scenario data resets on restart/redeploy (documented in README)
- If persistence is needed later: upgrade to paid tier + PostgreSQL or use a free-tier DB
