# Decision: Navigation — Sidebar Tabs (No Router)

**Date:** 2026-04-25
**Author:** Danny (Lead)
**Status:** Proposed

## Context
We need navigation between 4 scenario views.

## Decision
Use a **sidebar with tab-style navigation** managed by React state. No React Router.

## Rationale
- This is a single-page tool, not a multi-page app — no deep linking needed
- Simple `useState<ScenarioTab>` drives which panel renders
- Avoids router dependency and URL management complexity
- If Steven later wants shareable URLs, we can add React Router then

## Consequences
- Navigation is a controlled component: `Sidebar` calls `onTabChange`, `App` switches panels
- No browser history integration (back button won't switch tabs)
- Clean, zero-dependency approach
