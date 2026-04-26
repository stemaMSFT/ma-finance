# Decision: Data Flow — UI → Engine → Result

**Date:** 2026-04-25
**Author:** Danny (Lead)
**Status:** Proposed

## Context
Need a clear pattern for how scenario inputs flow through calculations and back to the UI.

## Decision
**Unidirectional data flow:** UI collects inputs → calls pure engine functions → renders results.

```
[User Input] → [React State] → [engine/*.ts pure function] → [ScenarioResult] → [Charts/Display]
```

## Rationale
- Engine functions are pure (no side effects, no state) — easy to test, easy to reason about
- UI owns all state; engine is a calculation library
- ScenarioResult is the universal output type — every engine function returns one
- Charts/visualizations consume ScenarioResult.timeline for consistent rendering

## Consequences
- Linus writes pure functions in `src/engine/` — no React imports, no hooks
- Rusty writes components in `src/components/` — calls engine functions, renders results
- `types.ts` is the contract between them
- No caching layer needed initially (calculations are fast for single-household data)
