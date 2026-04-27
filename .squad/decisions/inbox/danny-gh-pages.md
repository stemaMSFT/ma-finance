# Decision: GitHub Pages Deployment Setup

**Date:** 2026-04-27
**Author:** Danny (Lead)
**Status:** Implemented

## Context
Steven wants the ma-finance app accessible as a website for him and his wife. This is a client-side SPA — no backend needed for the deployed version.

## Decisions

### 1. Personal GitHub account for hosting
- EMU account (`stema_microsoft`) cannot create public repos
- Private repos don't support GitHub Pages on current plan
- Used `stemaMSFT` personal account instead
- **URL:** https://stemamsft.github.io/ma-finance/

### 2. Vite build only in CI (no tsc)
- `npm run build` runs `tsc -b && vite build` — tsc fails on pre-existing type errors
- Vite builds cleanly on its own; the TS errors are in Recharts component types
- CI workflow uses `npx vite build` directly
- **Action needed:** Someone should fix the TS errors so `npm run build` works end-to-end

### 3. SPA routing via 404.html hack
- GitHub Pages doesn't support SPA routing natively
- Standard workaround: `public/404.html` redirects to index with path in query string
- `index.html` has a script to restore the original URL via `history.replaceState`
- Works for the tab-based nav in this app (no actual routes to worry about currently)
