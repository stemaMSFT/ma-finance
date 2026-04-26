# Skill: Vite + React + TypeScript Scaffold

## When to Use
Setting up a new React + TypeScript project from scratch with Vite.

## Steps
1. `npm create vite@latest . -- --template react-ts` (select "Ignore files" if dir not empty, decline auto-install)
2. `npm install` then add deps (`recharts`, etc.)
3. Create directory structure under `src/`: `components/{layout,scenarios,shared,charts}`, `engine/`, `hooks/`, `utils/`
4. Define types contract first (`engine/types.ts`) — this is the API between UI and logic
5. Create constants file with TODO markers for verification
6. Stub engine functions returning typed empty results
7. Replace Vite boilerplate App.tsx with real layout
8. Replace CSS with project-specific styles
9. `npm run build` to verify

## Gotchas
- Vite 8+ interactive prompts require arrow-key navigation for "ignore files" option
- Don't auto-install from Vite prompt — do `npm install` separately for control
- Vite generates `hero.png` import in App.tsx — remove it or the build fails after replacing
