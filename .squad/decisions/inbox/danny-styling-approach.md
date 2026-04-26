# Decision: Styling — Plain CSS (No Framework)

**Date:** 2026-04-25
**Author:** Danny (Lead)
**Status:** Proposed

## Context
Need a styling approach that's fast to iterate on without overhead.

## Decision
Use **plain CSS files** — one per component area (App.css, index.css). No CSS framework, no CSS-in-JS.

## Rationale
- Steven's a two-person household app — not a design system
- CSS files are zero-runtime, fast to build, easy to understand
- Vite handles CSS hot reload perfectly
- If design complexity grows, we can adopt CSS Modules (already supported by Vite) without migration pain

## Consequences
- Class names are global — use descriptive names to avoid collision
- Rusty should use BEM-ish naming (`.sidebar-btn`, `.panel-description`) 
- No scoping — disciplined naming required
