# Decision: State Management — React Context + useReducer

**Date:** 2026-04-25
**Author:** Danny (Lead)
**Status:** Proposed

## Context
We need a state management approach for scenario inputs and results across 4 tabs.

## Decision
Start with **React Context + useReducer** for shared household/scenario state. No external library yet.

## Rationale
- App is small enough that Context avoids dependency overhead
- useReducer gives us predictable state transitions for financial inputs
- If we hit prop-drilling pain or perf issues, we upgrade to Zustand (one-file migration)
- Zustand stays in our back pocket as the "next step" if Context gets unwieldy

## Consequences
- Each scenario panel gets its own local state for draft inputs
- Shared `HouseholdFinances` lives in a top-level Context provider
- Engine functions are pure — called on-demand, not stored in state
