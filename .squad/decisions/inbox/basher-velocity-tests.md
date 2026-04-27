# Decision: Conservative Replacement Ratio Threshold

**Date:** 2026-04-26T21:15:01Z
**Author:** Basher (Tester)
**Status:** Informational

## Context
While testing `runScenarioComparison()`, the conservative scenario (slow track + 5.5% returns + 3.0% SWR) produces a replacement ratio of ~29.1%. This is below the commonly cited 30% minimum but is mathematically correct given the inputs.

## Finding
Slow track terminal level is L63 with 2.5% merit. By age 65, final comp is still high relative to conservative portfolio withdrawals. The SWR is intentionally set low (3.0%) for safety, which depresses the ratio.

## Decision
Test threshold set to 25% lower bound for replacement ratios across all scenarios. This is not a bug — it reflects the conservative scenario's purpose: show the floor, not the target.

## Impact
No engine changes needed. UI should clearly label the conservative scenario as a worst-case floor so users don't interpret 29% as their expected retirement outcome.
