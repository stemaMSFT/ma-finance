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
